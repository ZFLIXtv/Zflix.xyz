import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getTokenFromCookies,
  verifyToken,
  verifyPassword,
  hashPassword,
} from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { changeJellyfinPassword } from '@/lib/jellyfin'

// ─── POST /api/auth/change-password ──────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Verify JWT from cookie
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

  // 2. Parse body
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

  const { currentPassword, newPassword } = body as Record<string, unknown>

  if (typeof currentPassword !== 'string' || !currentPassword) {
    return NextResponse.json(
      { success: false, error: 'Le mot de passe actuel est requis.' },
      { status: 400 },
    )
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json(
      {
        success: false,
        error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
      },
      { status: 400 },
    )
  }

  const ip = getClientIp(request)

  try {
    // 3. Load user and verify current password
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        jellyfinUserId: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable.' },
        { status: 404 },
      )
    }

    const passwordValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe actuel est incorrect.' },
        { status: 400 },
      )
    }

    // 4. Update Jellyfin password first (plain password before hashing)
    if (user.jellyfinUserId) {
      try {
        await changeJellyfinPassword(user.jellyfinUserId, newPassword)
      } catch (jellyfinError) {
        console.error(
          '[change-password] Jellyfin password update failed:',
          jellyfinError,
        )
        await logAudit({
          userId: user.id,
          action: 'JELLYFIN_ERROR',
          details: {
            step: 'changeJellyfinPassword',
            error: String(jellyfinError),
          },
          ipAddress: ip,
        })
      }
    }

    // 5. Hash new password and update DB
    const newPasswordHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    })

    // 6. Audit log
    await logAudit({
      userId: user.id,
      action: 'PASSWORD_CHANGE',
      ipAddress: ip,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[change-password] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}
