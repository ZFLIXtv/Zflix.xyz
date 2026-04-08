import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { setJellyfinAccountDisabled, JellyfinError } from '@/lib/jellyfin'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = getTokenFromCookies(request)
  if (!token) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Session invalide.' }, { status: 401 })

  if (!payload.isAdmin && !(payload.email && isAdminEmail(payload.email))) {
    return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 })
  }

  const body = (await request.json()) as { userId?: string; jellyfinId?: string | null; disabled: boolean }
  const { userId, jellyfinId, disabled } = body

  if (typeof disabled !== 'boolean' || (!userId && !jellyfinId)) {
    return NextResponse.json({ success: false, error: 'Paramètres invalides.' }, { status: 400 })
  }

  const ip = getClientIp(request)

  try {
    let targetUsername = jellyfinId ?? 'inconnu'
    let effectiveJellyfinId = jellyfinId ?? null

    // Si compte ZFlix connu — mise à jour DB
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, jellyfinUserId: true, subscriptionExpiresAt: true },
      })

      if (!user) return NextResponse.json({ success: false, error: 'Utilisateur introuvable.' }, { status: 404 })

      targetUsername = user.username
      effectiveJellyfinId = jellyfinId ?? user.jellyfinUserId

      const now = new Date()
      const isSubscribed = disabled
        ? false
        : user.subscriptionExpiresAt !== null && user.subscriptionExpiresAt > now

      await prisma.user.update({ where: { id: userId }, data: { isSubscribed } })

      // Persiste le lien Jellyfin si absent
      if (!user.jellyfinUserId && jellyfinId) {
        await prisma.user.update({ where: { id: userId }, data: { jellyfinUserId: jellyfinId } })
      }
    }

    // Jellyfin
    let jellyfinError: string | null = null
    if (effectiveJellyfinId) {
      try {
        await setJellyfinAccountDisabled(effectiveJellyfinId, disabled)
      } catch (err) {
        jellyfinError = err instanceof JellyfinError ? err.message : 'Erreur Jellyfin'
      }
    }

    await logAudit({
      userId: payload.userId,
      action: disabled ? 'ADMIN_DISABLE_ACCOUNT' : 'ADMIN_ENABLE_ACCOUNT',
      details: { targetUserId: userId ?? null, targetUsername, jellyfinId: effectiveJellyfinId, jellyfinError },
      ipAddress: ip,
    })

    return NextResponse.json({
      success: true,
      data: { disabled, jellyfinError },
    })
  } catch (error) {
    console.error('[admin/toggle-account]', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur.' }, { status: 500 })
  }
}
