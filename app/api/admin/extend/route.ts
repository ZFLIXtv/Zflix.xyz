import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken, hashPassword } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { logAudit } from '@/lib/audit'
import { applySubscribedProfile } from '@/lib/jellyfin'

// ─── POST /api/admin/extend ───────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Admin auth check
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

  if (!payload.isAdmin && !(payload.email && isAdminEmail(payload.email))) {
    return NextResponse.json(
      { success: false, error: 'Accès refusé.' },
      { status: 403 },
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

  const { userId, jellyfinId, jellyfinUsername, days } = body as Record<string, unknown>

  const hasUserId = typeof userId === 'string' && userId.trim().length > 0
  const hasJellyfinId = typeof jellyfinId === 'string' && jellyfinId.trim().length > 0

  if (!hasUserId && !hasJellyfinId) {
    return NextResponse.json(
      { success: false, error: 'userId ou jellyfinId requis.' },
      { status: 400 },
    )
  }

  if (typeof days !== 'number' || !Number.isInteger(days) || days < 1 || days > 365) {
    return NextResponse.json(
      { success: false, error: 'Le nombre de jours doit être un entier entre 1 et 365.' },
      { status: 400 },
    )
  }

  const ip = getClientIp(request)

  try {
    const now = new Date()

    // ── Chemin ZFlix (userId fourni) ─────────────────────────────────────────
    if (hasUserId) {
      const user = await prisma.user.findUnique({
        where: { id: (userId as string).trim() },
        select: { id: true, email: true, isSubscribed: true, subscriptionExpiresAt: true, jellyfinUserId: true },
      })

      if (!user) {
        return NextResponse.json({ success: false, error: 'Utilisateur introuvable.' }, { status: 404 })
      }

      const base = user.subscriptionExpiresAt && user.subscriptionExpiresAt > now ? user.subscriptionExpiresAt : now
      const newExpiry = new Date(base.getTime() + (days as number) * 86400000)

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { isSubscribed: true, subscriptionExpiresAt: newExpiry },
        select: { id: true, email: true, isSubscribed: true, subscriptionExpiresAt: true, trialUsed: true, jellyfinUsername: true },
      })

      // Persist Jellyfin link if provided and missing
      const effectiveJellyfinId = (hasJellyfinId ? jellyfinId as string : null) ?? user.jellyfinUserId
      if (!user.isSubscribed && effectiveJellyfinId) {
        try { await applySubscribedProfile(effectiveJellyfinId) } catch (e) {
          console.error('[admin/extend] Jellyfin profile failed:', e)
        }
      }

      await logAudit({
        userId: payload.userId,
        action: 'ADMIN_EXTEND',
        details: { targetUserId: user.id, targetEmail: user.email, days, newExpiry: newExpiry.toISOString() },
        ipAddress: ip,
      })

      return NextResponse.json({ success: true, data: { user: updatedUser } })
    }

    // ── Chemin Jellyfin-only (jellyfinId sans userId) ────────────────────────
    const jId = (jellyfinId as string).trim()
    const jName = typeof jellyfinUsername === 'string' ? jellyfinUsername.trim() : `jf_${jId.slice(0, 8)}`

    // Chercher un compte ZFlix déjà lié
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { jellyfinUserId: jId },
          { jellyfinUsername: { equals: jName, mode: 'insensitive' } },
        ],
      },
      select: { id: true, email: true, username: true, isSubscribed: true, subscriptionExpiresAt: true, jellyfinUserId: true },
    })

    const base = user?.subscriptionExpiresAt && user.subscriptionExpiresAt > now ? user.subscriptionExpiresAt : now
    const newExpiry = new Date(base.getTime() + (days as number) * 86400000)

    if (!user) {
      // Créer un compte ZFlix minimal lié à ce compte Jellyfin
      // Le hash est aléatoire et inutilisable — ce compte ne peut pas se connecter en local
      const unusablePasswordHash = await hashPassword(randomUUID())
      user = await prisma.user.create({
        data: {
          username: jName,
          email: null,
          passwordHash: unusablePasswordHash,
          jellyfinUserId: jId,
          jellyfinUsername: jName,
          isSubscribed: true,
          subscriptionExpiresAt: newExpiry,
        },
        select: { id: true, email: true, username: true, isSubscribed: true, subscriptionExpiresAt: true, jellyfinUserId: true },
      })
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isSubscribed: true,
          subscriptionExpiresAt: newExpiry,
          ...(user.jellyfinUserId ? {} : { jellyfinUserId: jId }),
        },
      })
    }

    // Appliquer le profil abonné sur Jellyfin
    try { await applySubscribedProfile(jId) } catch (e) {
      console.error('[admin/extend] Jellyfin profile failed:', e)
    }

    await logAudit({
      userId: payload.userId,
      action: 'ADMIN_EXTEND',
      details: { targetUserId: user.id, targetUsername: jName, jellyfinId: jId, days, newExpiry: newExpiry.toISOString() },
      ipAddress: ip,
    })

    return NextResponse.json({ success: true, data: { user } })
  } catch (error) {
    console.error('[admin/extend] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}
