import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { logAudit } from '@/lib/audit'

// ─── POST /api/admin/clear-expiration ────────────────────────────────────────
// Supprime la date d'expiration sans révoquer l'accès (retour en Essai).

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = getTokenFromCookies(request)
  if (!token) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Session invalide.' }, { status: 401 })

  if (!payload.isAdmin && !(payload.email && isAdminEmail(payload.email))) {
    return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 })
  }

  const body = (await request.json()) as { userId: string }
  const { userId } = body

  if (!userId) return NextResponse.json({ success: false, error: 'userId requis.' }, { status: 400 })

  const ip = getClientIp(request)

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    })

    if (!user) return NextResponse.json({ success: false, error: 'Utilisateur introuvable.' }, { status: 404 })

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionExpiresAt: null, isSubscribed: true },
    })

    await logAudit({
      userId: payload.userId,
      action: 'ADMIN_CLEAR_EXPIRATION',
      details: { targetUserId: userId, targetUsername: user.username },
      ipAddress: ip,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/clear-expiration]', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur.' }, { status: 500 })
  }
}
