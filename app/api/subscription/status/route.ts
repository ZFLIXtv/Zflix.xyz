import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

// ─── GET /api/subscription/status ────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
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

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        isSubscribed: true,
        subscriptionExpiresAt: true,
        trialUsed: true,
        payments: {
          select: {
            id: true,
            amount: true,
            durationDays: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable.' },
        { status: 404 },
      )
    }

    const now = new Date()
    const isExpired =
      user.subscriptionExpiresAt !== null && user.subscriptionExpiresAt < now

    let daysRemaining: number | null = null
    if (user.subscriptionExpiresAt) {
      const diffMs = user.subscriptionExpiresAt.getTime() - now.getTime()
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    }

    return NextResponse.json({
      success: true,
      data: {
        isSubscribed: user.isSubscribed,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        trialUsed: user.trialUsed,
        daysRemaining,
        isExpired,
        payments: user.payments,
      },
    })
  } catch (error) {
    console.error('[subscription/status] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}
