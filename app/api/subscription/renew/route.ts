import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { stripeEnabled, createCheckoutSession, PLANS, type PlanId } from '@/lib/stripe'

// ─── POST /api/subscription/renew ────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Auth required
  const token = getTokenFromCookies(request)
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Non authentifié.' },
      { status: 401 },
    )
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json(
      { success: false, error: 'Session invalide ou expirée.' },
      { status: 401 },
    )
  }

  // If Stripe is disabled, return informational response
  if (!stripeEnabled) {
    return NextResponse.json(
      {
        success: false,
        error: 'Paiement bientôt disponible',
        stripeDisabled: true,
      },
      { status: 200 },
    )
  }

  // Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Corps de la requête invalide.' },
      { status: 400 },
    )
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json(
      { success: false, error: 'Corps de la requête invalide.' },
      { status: 400 },
    )
  }

  const { planId } = body as Record<string, unknown>

  const validPlanIds = Object.keys(PLANS)
  if (typeof planId !== 'string' || !validPlanIds.includes(planId.trim())) {
    return NextResponse.json(
      { success: false, error: 'Plan invalide.' },
      { status: 400 },
    )
  }

  try {
    const checkoutUrl = await createCheckoutSession(
      payload.userId,
      payload.email ?? '',
      planId.trim() as PlanId,
      process.env.NEXT_PUBLIC_APP_URL ?? '',
    )

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl,
      },
    })
  } catch (error) {
    console.error('[subscription/renew] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}
