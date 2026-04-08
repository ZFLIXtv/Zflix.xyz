import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import {
  createJellyfinUser,
  deleteJellyfinUser,
  jellyfinUserExists,
  applySubscribedProfile,
  JellyfinError,
} from '@/lib/jellyfin'
import { sendWelcomeEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/ratelimit'
import {
  getUserByReferralCode,
  applyReferralReward,
} from '@/lib/referral'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

// ─── POST /api/auth/register ──────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Maintenance mode
  if (process.env.MAINTENANCE_MODE === 'true') {
    return NextResponse.json(
      {
        success: false,
        error: 'Le service est temporairement indisponible pour maintenance.',
      },
      { status: 503 },
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

  const { username, password, email, referralCode } = body as Record<
    string,
    unknown
  >

  // 3. Validate username
  if (typeof username !== 'string' || !USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Le nom d'utilisateur doit contenir entre 3 et 20 caractères (lettres, chiffres, underscore).",
        code: 'INVALID_USERNAME',
      },
      { status: 400 },
    )
  }

  // 4. Validate password
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      {
        success: false,
        error: 'Le mot de passe doit contenir au moins 8 caractères.',
        code: 'INVALID_PASSWORD',
      },
      { status: 400 },
    )
  }

  // 5. Validate email if provided
  if (email !== undefined && email !== null && email !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Adresse e-mail invalide.', code: 'INVALID_EMAIL' },
        { status: 400 },
      )
    }
  }

  const normalizedEmail =
    typeof email === 'string' && email.trim()
      ? email.trim().toLowerCase()
      : null

  // 6. Rate limit by IP
  const ip = getClientIp(request)
  const rateLimitKey = `register:${ip}`
  const allowed = await checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.',
      },
      { status: 429 },
    )
  }

  try {
    // 7. Check username not already taken in DB
    const existingByUsername = await prisma.user.findUnique({
      where: { username },
    })
    if (existingByUsername) {
      return NextResponse.json(
        {
          success: false,
          error: "Ce nom d'utilisateur est déjà pris.",
          code: 'USERNAME_TAKEN',
        },
        { status: 400 },
      )
    }

    // 8. Check email not already taken (if provided)
    if (normalizedEmail) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })
      if (existingByEmail) {
        return NextResponse.json(
          {
            success: false,
            error: 'Un compte avec cette adresse e-mail existe déjà.',
            code: 'EMAIL_TAKEN',
          },
          { status: 400 },
        )
      }
    }

    // 9. Check username not already taken on Jellyfin
    let usernameOnJellyfin: boolean
    try {
      usernameOnJellyfin = await jellyfinUserExists(username)
    } catch (jellyfinError) {
      console.error('[register] Jellyfin check failed:', jellyfinError)
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de créer le compte, réessaie plus tard.',
          code: 'JELLYFIN_UNAVAILABLE',
        },
        { status: 503 },
      )
    }

    if (usernameOnJellyfin) {
      return NextResponse.json(
        {
          success: false,
          error: "Ce nom d'utilisateur est déjà utilisé sur le serveur média.",
          code: 'JELLYFIN_USERNAME_TAKEN',
        },
        { status: 400 },
      )
    }

    // 10. Create Jellyfin account (password captured in clear before hashing)
    let jellyfinUserId: string
    let jellyfinUsername: string
    try {
      const jellyfinUser = await createJellyfinUser(username, password)
      jellyfinUserId = jellyfinUser.id
      jellyfinUsername = jellyfinUser.username
    } catch (jellyfinError) {
      console.error('[register] Jellyfin user creation failed:', jellyfinError)
      const isUnavailable = !(jellyfinError instanceof JellyfinError)
      return NextResponse.json(
        {
          success: false,
          error: isUnavailable
            ? 'Impossible de créer le compte, réessaie plus tard.'
            : 'Impossible de créer le compte sur le serveur média.',
          code: 'JELLYFIN_ERROR',
        },
        { status: 503 },
      )
    }

    // 11. Hash password
    const passwordHash = await hashPassword(password)

    // 12. Find referrer if referralCode provided
    let referrer: { id: string } | null = null
    if (typeof referralCode === 'string' && referralCode.trim()) {
      referrer = await getUserByReferralCode(referralCode.trim())
    }

    // 13. Create user in DB — accès gratuit sans date d'expiration
    let user: { id: string; username: string; email: string | null; referralCode: string | null }
    try {
      user = await prisma.user.create({
        data: {
          username,
          email: normalizedEmail,
          passwordHash,
          jellyfinUserId,
          jellyfinUsername,
          subscriptionExpiresAt: null,
          isSubscribed: true,
          trialUsed: false,
          referredById: referrer?.id ?? null,
        },
      })
    } catch (dbError) {
      console.error('[register] DB create failed, rolling back Jellyfin:', dbError)
      try {
        await deleteJellyfinUser(jellyfinUserId)
      } catch (rollbackError) {
        console.error('[register] Jellyfin rollback failed:', rollbackError)
      }
      return NextResponse.json(
        { success: false, error: 'Erreur serveur.', code: 'DB_ERROR' },
        { status: 500 },
      )
    }

    // 14. Apply subscribed profile on Jellyfin
    try {
      await applySubscribedProfile(jellyfinUserId)
    } catch (profileError) {
      console.error('[register] Jellyfin apply profile failed:', profileError)
      await logAudit({
        userId: user.id,
        action: 'JELLYFIN_ERROR',
        details: { step: 'applySubscribedProfile', error: String(profileError) },
        ipAddress: ip,
      })
    }

    // 15. Apply referral reward
    if (referrer) {
      try {
        await applyReferralReward(referrer.id, user.id)
      } catch (referralError) {
        console.error('[register] Referral reward failed:', referralError)
      }
    }

    // 16. Send welcome email (only if email provided)
    if (user.email) {
      try {
        await sendWelcomeEmail(
          user.email,
          username,
          process.env.NEXT_PUBLIC_JELLYFIN_PUBLIC_URL ?? '',
        )
      } catch (emailError) {
        console.error('[register] Welcome email failed:', emailError)
      }
    }

    // 17. Audit log
    await logAudit({
      userId: user.id,
      action: 'REGISTER',
      details: { username, hasEmail: !!user.email, hasReferral: !!referrer },
      ipAddress: ip,
    })

    // 18. Generate JWT and set cookie
    const token = await generateToken({
      userId: user.id,
      username: user.username,
      email: user.email ?? undefined,
      isAdmin: false,
    })

    const response = NextResponse.json(
      { success: true, userId: user.id },
      { status: 201 },
    )

    setAuthCookie(response, token)
    return response
  } catch (error) {
    console.error('[register] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}
