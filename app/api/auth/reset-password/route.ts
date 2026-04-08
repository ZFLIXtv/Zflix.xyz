import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { logAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/ratelimit'

// ─── POST /api/auth/reset-password ────────────────────────────────────────────
// Request a password reset link. Always returns success to avoid email enumeration.

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const { email } = body as Record<string, unknown>

  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json(
      { success: false, error: 'L\'adresse e-mail est requise.' },
      { status: 400 },
    )
  }

  const normalizedEmail = email.trim().toLowerCase()

  // 2. Rate limit by IP (3 requests per 15 minutes)
  const ip = getClientIp(request)
  const rateLimitKey = `reset-password-request:${ip}`
  const rateLimitResult = checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000)
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.' },
      { status: 429 },
    )
  }

  try {
    // 3. Look up user — but do NOT reveal whether the email exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (user) {
      // 4. Generate a secure random token (nanoid 32 chars)
      const rawToken = nanoid(32)
      const tokenHash = await hashPassword(rawToken)
      const expires = new Date(Date.now() + 60 * 60 * 1000) // +1 hour

      // 5. Store hashed token and expiry in DB
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: tokenHash,
          resetPasswordExpires: expires,
        },
      })

      // 6. Send reset email with raw token
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      try {
        // sendPasswordResetEmail builds: `${appUrl}/reset-password?token=${rawToken}`
        // The frontend reset page at /reset-password/[token] also handles ?token= via redirect
        await sendPasswordResetEmail(normalizedEmail, rawToken, appUrl)
      } catch (emailError) {
        console.error('[reset-password] Failed to send email:', emailError)
      }

      // 7. Log audit
      await logAudit({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUEST',
        details: { email: normalizedEmail },
        ipAddress: ip,
      })
    }

    // 8. Always return success (don't reveal whether email is registered)
    return NextResponse.json({
      success: true,
      message: 'Si cet email est enregistré, vous recevrez un lien de réinitialisation.',
    })
  } catch (error) {
    console.error('[reset-password] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}
