import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { applySubscribedProfile } from '@/lib/jellyfin'
import { sendSubscriptionRenewedEmail } from '@/lib/email'
import { stripeEnabled, constructWebhookEvent, PLANS } from '@/lib/stripe'
import { generateUniqueReferralCode } from '@/lib/referral'
import type Stripe from 'stripe'

// ─── POST /api/stripe/webhook ─────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // If Stripe is not enabled, acknowledge and ignore
  if (!stripeEnabled) {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET not set.')
    return NextResponse.json(
      { success: false, error: 'Configuration serveur invalide.' },
      { status: 500 },
    )
  }

  // Read raw body
  let rawBody: Buffer
  try {
    const arrayBuffer = await request.arrayBuffer()
    rawBody = Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('[stripe/webhook] Failed to read raw body:', error)
    return NextResponse.json(
      { success: false, error: 'Impossible de lire le corps de la requête.' },
      { status: 400 },
    )
  }

  const signature = request.headers.get('stripe-signature') ?? ''

  // Verify webhook signature
  let event: Stripe.Event
  try {
    event = await constructWebhookEvent(rawBody, signature)
  } catch (error) {
    console.error('[stripe/webhook] Signature verification failed:', error)
    return NextResponse.json(
      { success: false, error: 'Signature invalide.' },
      { status: 400 },
    )
  }

  const ip = getClientIp(request)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const planId = session.metadata?.planId

        if (!userId) {
          console.error('[stripe/webhook] checkout.session.completed: missing userId in metadata')
          break
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, jellyfinUserId: true, subscriptionExpiresAt: true, referralCode: true },
        })

        if (!user) {
          console.error('[stripe/webhook] User not found:', userId)
          break
        }

        // Determine plan duration
        let durationDays = 30
        if (planId && planId in PLANS) {
          const plan = PLANS[planId as keyof typeof PLANS]
          if (plan && 'durationDays' in plan) {
            durationDays = (plan as { durationDays: number }).durationDays
          }
        }

        const amountTotal = session.amount_total ?? 0

        // Calculate new expiry date
        const now = new Date()
        const currentExpiry =
          user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
            ? user.subscriptionExpiresAt
            : now
        const newExpiry = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000)

        // Generate referral code on first payment if not already set
        let referralCode = user.referralCode
        if (!referralCode) {
          try {
            referralCode = await generateUniqueReferralCode()
          } catch (err) {
            console.error('[stripe/webhook] Failed to generate referral code:', err)
          }
        }

        // Update subscription in DB
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isSubscribed: true,
            subscriptionExpiresAt: newExpiry,
            ...(referralCode && !user.referralCode ? { referralCode } : {}),
          },
        })

        // Create Payment record
        await prisma.payment.create({
          data: {
            userId: user.id,
            stripePaymentId: session.payment_intent as string | null,
            amount: amountTotal,
            durationDays,
            status: 'succeeded',
          },
        })

        // Apply Jellyfin subscribed profile
        if (user.jellyfinUserId) {
          try {
            await applySubscribedProfile(user.jellyfinUserId)
          } catch (jellyfinError) {
            console.error('[stripe/webhook] Jellyfin profile update failed:', jellyfinError)
            await logAudit({
              userId: user.id,
              action: 'JELLYFIN_ERROR',
              details: { step: 'applySubscribedProfile', error: String(jellyfinError) },
              ipAddress: ip,
            })
          }
        }

        // Send renewal email
        if (user.email) {
          try {
            await sendSubscriptionRenewedEmail(user.email, newExpiry, durationDays)
          } catch (emailError) {
            console.error('[stripe/webhook] Renewal email failed:', emailError)
          }
        }

        // Log audit
        await logAudit({
          userId: user.id,
          action: 'PAYMENT_SUCCESS',
          details: {
            stripeSessionId: session.id,
            amount: amountTotal,
            durationDays,
            newExpiry: newExpiry.toISOString(),
          },
          ipAddress: ip,
        })

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const userId = paymentIntent.metadata?.userId

        console.error('[stripe/webhook] Payment failed:', paymentIntent.id, userId)

        await logAudit({
          userId: userId ?? undefined,
          action: 'PAYMENT_FAILED',
          details: {
            paymentIntentId: paymentIntent.id,
            error: paymentIntent.last_payment_error?.message ?? 'Unknown error',
          },
          ipAddress: ip,
        })

        break
      }

      default:
        // Unhandled event types — acknowledge receipt
        break
    }
  } catch (error) {
    console.error('[stripe/webhook] Error processing event:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du traitement de l\'événement.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
