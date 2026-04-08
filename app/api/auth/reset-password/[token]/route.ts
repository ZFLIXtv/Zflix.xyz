import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/ratelimit'

// ─── POST /api/auth/reset-password/[token] ────────────────────────────────────
// Validate a reset token and update the password.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params

  if (!token || typeof token !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Token invalide.' },
      { status: 400 },
    )
  }

  // 1. Parse body
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

  const { newPassword, confirmPassword } = body as Record<string, unknown>

  // 2. Validate passwords
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json(
      { success: false, error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' },
      { status: 400 },
    )
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { success: false, error: 'Les mots de passe ne correspondent pas.' },
      { status: 400 },
    )
  }

  // 3. Rate limit by IP
  const ip = getClientIp(request)
  const rateLimitKey = `reset-password-confirm:${ip}`
  const rateLimitResult = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.' },
      { status: 429 },
    )
  }

  try {
    // 4. Find users with a non-expired reset token
    const now = new Date()
    const usersWithToken = await prisma.user.findMany({
      where: {
        resetPasswordToken: { not: null },
        resetPasswordExpires: { gt: now },
      },
      select: {
        id: true,
        resetPasswordToken: true,
        resetPasswordExpires: true,
      },
    })

    // 5. Find the matching user by verifying the token hash
    let matchedUserId: string | null = null

    for (const user of usersWithToken) {
      if (!user.resetPasswordToken) continue
      try {
        const isMatch = await verifyPassword(token, user.resetPasswordToken)
        if (isMatch) {
          matchedUserId = user.id
          break
        }
      } catch {
        // invalid hash format — skip
      }
    }

    if (!matchedUserId) {
      return NextResponse.json(
        { success: false, error: 'Lien de réinitialisation invalide ou expiré. Veuillez faire une nouvelle demande.' },
        { status: 400 },
      )
    }

    // 6. Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // 7. Update password and clear token fields
    await prisma.user.update({
      where: { id: matchedUserId },
      data: {
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    })

    // 8. Log audit
    await logAudit({
      userId: matchedUserId,
      action: 'PASSWORD_RESET',
      details: { method: 'token' },
      ipAddress: ip,
    })

    return NextResponse.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès.',
    })
  } catch (error) {
    console.error('[reset-password/token] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}
