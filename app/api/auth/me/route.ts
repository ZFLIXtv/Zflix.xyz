import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify token from cookie
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
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        isSubscribed: true,
        subscriptionExpiresAt: true,
        trialUsed: true,
        referralCode: true,
        jellyfinUsername: true,
        jellyfinUserId: true,
        createdAt: true,
        payments: { where: { status: 'succeeded' }, select: { id: true }, take: 1 },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable.' },
        { status: 404 },
      )
    }

    const userIsAdmin = user.isAdmin || (user.email ? isAdminEmail(user.email) : false)

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isAdmin: userIsAdmin,
          isSubscribed: user.isSubscribed,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          trialUsed: user.trialUsed,
          referralCode: user.referralCode,
          hasPaid: user.payments.length > 0,
          jellyfinUsername: user.jellyfinUsername,
          jellyfinId: user.jellyfinUserId,
          createdAt: user.createdAt,
        },
      },
    })
  } catch (error) {
    console.error('[me] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}
