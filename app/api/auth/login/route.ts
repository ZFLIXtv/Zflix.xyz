import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, hashPassword, generateToken, setAuthCookie } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/ratelimit'
import { isAdminEmail } from '@/lib/admin'
import { authenticateJellyfinUser, JellyfinError } from '@/lib/jellyfin'
import { nanoid } from 'nanoid'

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

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

  const { username, email, password } = body as Record<string, unknown>

  // 2. Require either username or email
  const hasUsername = typeof username === 'string' && username.trim().length > 0
  const hasEmail = typeof email === 'string' && email.trim().length > 0

  if (!hasUsername && !hasEmail) {
    return NextResponse.json(
      {
        success: false,
        error: "Le nom d'utilisateur ou l'adresse e-mail est requis.",
      },
      { status: 400 },
    )
  }

  if (typeof password !== 'string' || !password) {
    return NextResponse.json(
      { success: false, error: 'Le mot de passe est requis.' },
      { status: 400 },
    )
  }

  // 3. Rate limit by IP
  const ip = getClientIp(request)
  const rateLimitKey = `login:${ip}`
  const { allowed } = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)
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
    // 4. Find user by username (preferred) or email
    let user = hasUsername
      ? await prisma.user.findUnique({
          where: { username: (username as string).trim() },
        })
      : await prisma.user.findUnique({
          where: { email: (email as string).trim().toLowerCase() },
        })

    // 5. Verify password (local DB)
    if (user) {
      const passwordValid = await verifyPassword(password, user.passwordHash)
      if (!passwordValid) {
        return NextResponse.json(
          { success: false, error: 'Identifiants incorrects.' },
          { status: 401 },
        )
      }
    } else if (hasUsername) {
      // 5b. Fallback: try Jellyfin authentication
      let jellyfinUser: Awaited<ReturnType<typeof authenticateJellyfinUser>> = null
      try {
        jellyfinUser = await authenticateJellyfinUser(
          (username as string).trim(),
          password,
        )
      } catch (err) {
        if (!(err instanceof JellyfinError)) throw err
        // Jellyfin unreachable — treat as wrong credentials
      }

      if (!jellyfinUser) {
        return NextResponse.json(
          { success: false, error: 'Identifiants incorrects.' },
          { status: 401 },
        )
      }

      // Upsert ZFlix user from Jellyfin data
      const passwordHash = await hashPassword(password)
      user = await prisma.user.upsert({
        where: { jellyfinUserId: jellyfinUser.id },
        update: {
          passwordHash,
          jellyfinUsername: jellyfinUser.username,
          isAdmin: jellyfinUser.isAdmin,
        },
        create: {
          username: jellyfinUser.username,
          passwordHash,
          jellyfinUserId: jellyfinUser.id,
          jellyfinUsername: jellyfinUser.username,
          isAdmin: jellyfinUser.isAdmin,
          emailVerified: true,
          referralCode: nanoid(8),
        },
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Identifiants incorrects.' },
        { status: 401 },
      )
    }

    // 6. Update subscription status if expired
    let isSubscribed = user.isSubscribed
    if (
      user.subscriptionExpiresAt &&
      user.subscriptionExpiresAt < new Date() &&
      user.isSubscribed
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isSubscribed: false },
      })
      isSubscribed = false
    }

    // 7. Determine admin status
    const userIsAdmin =
      user.isAdmin || (user.email ? isAdminEmail(user.email) : false)

    // 8. Audit log
    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      details: { username: user.username },
      ipAddress: ip,
    })

    // 9. Generate JWT and set cookie
    const token = await generateToken({
      userId: user.id,
      username: user.username,
      email: user.email ?? undefined,
      isAdmin: userIsAdmin,
    })

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isAdmin: userIsAdmin,
          isSubscribed,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          jellyfinId: user.jellyfinUserId,
        },
      },
    })

    setAuthCookie(response, token)
    return response
  } catch (error) {
    console.error('[login] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}
