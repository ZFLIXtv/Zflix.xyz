import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { applyUnsubscribedProfile } from '@/lib/jellyfin'
import { sendSubscriptionExpiredEmail } from '@/lib/email'

// ─── GET /api/cron/check-expirations ─────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Auth: Bearer token must match CRON_SECRET
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron/check-expirations] CRON_SECRET not set.')
    return NextResponse.json(
      { success: false, error: 'Configuration serveur invalide.' },
      { status: 500 },
    )
  }

  const authHeader = request.headers.get('Authorization') ?? ''
  const providedToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (providedToken !== cronSecret) {
    return NextResponse.json(
      { success: false, error: 'Non autorisé.' },
      { status: 401 },
    )
  }

  const ip = getClientIp(request)
  const now = new Date()

  // Find all users where subscription has expired but isSubscribed is still true
  let expiredUsers: Array<{
    id: string
    username: string
    email: string | null
    jellyfinUserId: string | null
    subscriptionExpiresAt: Date | null
  }>

  try {
    expiredUsers = await prisma.user.findMany({
      where: {
        subscriptionExpiresAt: { lt: now },
        isSubscribed: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        jellyfinUserId: true,
        subscriptionExpiresAt: true,
      },
    })
  } catch (error) {
    console.error('[cron/check-expirations] DB query failed:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de la recherche des abonnements expirés.' },
      { status: 500 },
    )
  }

  let processed = 0
  const errors: string[] = []

  for (const user of expiredUsers) {
    try {
      // Mark user as unsubscribed
      await prisma.user.update({
        where: { id: user.id },
        data: { isSubscribed: false },
      })

      // Apply Jellyfin unsubscribed profile
      if (user.jellyfinUserId) {
        try {
          await applyUnsubscribedProfile(user.jellyfinUserId)
        } catch (jellyfinError) {
          console.error(`[cron/check-expirations] Jellyfin profile update failed for ${user.id}:`, jellyfinError)
          await logAudit({
            userId: user.id,
            action: 'JELLYFIN_ERROR',
            details: { step: 'applyUnsubscribedProfile', error: String(jellyfinError) },
            ipAddress: ip,
          })
          errors.push(`Jellyfin error for user ${user.id}: ${String(jellyfinError)}`)
        }
      }

      // Send expiry email (only if user has an email)
      if (user.email) {
        try {
          await sendSubscriptionExpiredEmail(user.email)
        } catch (emailError) {
          console.error(`[cron/check-expirations] Expiry email failed for ${user.id}:`, emailError)
          errors.push(`Email error for user ${user.id}: ${String(emailError)}`)
        }
      }

      // Log audit
      await logAudit({
        userId: user.id,
        action: 'SUBSCRIPTION_EXPIRE',
        details: {
          subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString(),
        },
        ipAddress: ip,
      })

      processed++
    } catch (error) {
      console.error(`[cron/check-expirations] Failed to process user ${user.id}:`, error)
      errors.push(`User ${user.id}: ${String(error)}`)
    }
  }

  console.log(`[cron/check-expirations] Processed ${processed}/${expiredUsers.length} expired subscriptions.`)

  return NextResponse.json({
    success: true,
    data: {
      processed,
      total: expiredUsers.length,
      errors,
    },
  })
}
