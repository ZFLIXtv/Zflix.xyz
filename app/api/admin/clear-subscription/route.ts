import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { applyUnsubscribedProfile, JellyfinError } from '@/lib/jellyfin'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = getTokenFromCookies(request)
  if (!token) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Session invalide.' }, { status: 401 })

  if (!payload.isAdmin && !(payload.email && isAdminEmail(payload.email))) {
    return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 })
  }

  const body = (await request.json()) as { userId: string; jellyfinId?: string | null }
  const { userId, jellyfinId } = body

  if (!userId) return NextResponse.json({ success: false, error: 'userId requis.' }, { status: 400 })

  const ip = getClientIp(request)

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, jellyfinUserId: true },
    })

    if (!user) return NextResponse.json({ success: false, error: 'Utilisateur introuvable.' }, { status: 404 })

    await prisma.user.update({
      where: { id: userId },
      data: { isSubscribed: false, subscriptionExpiresAt: null },
    })

    const effectiveJellyfinId = jellyfinId ?? user.jellyfinUserId
    let jellyfinError: string | null = null
    if (effectiveJellyfinId) {
      try {
        await applyUnsubscribedProfile(effectiveJellyfinId)
        if (!user.jellyfinUserId && jellyfinId) {
          await prisma.user.update({ where: { id: userId }, data: { jellyfinUserId: jellyfinId } })
        }
      } catch (err) {
        jellyfinError = err instanceof JellyfinError ? err.message : 'Erreur Jellyfin'
      }
    }

    await logAudit({
      userId: payload.userId,
      action: 'ADMIN_CLEAR_SUBSCRIPTION',
      details: { targetUserId: userId, targetUsername: user.username, jellyfinError },
      ipAddress: ip,
    })

    return NextResponse.json({ success: true, data: { jellyfinError } })
  } catch (error) {
    console.error('[admin/clear-subscription]', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur.' }, { status: 500 })
  }
}
