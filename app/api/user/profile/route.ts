import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'

// ─── Shared auth helper ───────────────────────────────────────────────────────

async function getAuthenticatedUser(request: NextRequest) {
  const token = getTokenFromCookies(request)
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  return payload
}

// ─── GET /api/user/profile ────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const payload = await getAuthenticatedUser(request)
  if (!payload) {
    return NextResponse.json(
      { success: false, error: 'Non authentifié.' },
      { status: 401 },
    )
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        isSubscribed: true,
        subscriptionExpiresAt: true,
        trialUsed: true,
        referralCode: true,
        jellyfinUsername: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable.' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          isAdmin: user.email ? isAdminEmail(user.email) : false,
        },
      },
    })
  } catch (error) {
    console.error('[profile GET] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}

// ─── PATCH /api/user/profile ──────────────────────────────────────────────────

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const payload = await getAuthenticatedUser(request)
  if (!payload) {
    return NextResponse.json(
      { success: false, error: 'Non authentifié.' },
      { status: 401 },
    )
  }

  // Placeholder for future updatable fields
  // Currently no user-editable profile fields exist in the schema
  return NextResponse.json({
    success: true,
    data: {
      message: 'Aucun champ modifiable pour le moment.',
    },
  })
}
