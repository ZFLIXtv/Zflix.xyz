import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getAllJellyfinUsers } from '@/lib/jellyfin'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = getTokenFromCookies(request)
  if (!token) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Session invalide.' }, { status: 401 })

  if (!payload.isAdmin && !(payload.email && isAdminEmail(payload.email))) {
    return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 })
  }

  try {
    const [jellyfinUsers, zflixUsers] = await Promise.all([
      getAllJellyfinUsers(),
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          jellyfinUserId: true,
          jellyfinUsername: true,
          isSubscribed: true,
          subscriptionExpiresAt: true,
        },
      }),
    ])

    // Croiser les comptes Jellyfin avec ZFlix par ID ou username
    const result = jellyfinUsers.map((jUser) => {
      const linked = zflixUsers.find(
        (z) =>
          z.jellyfinUserId === jUser.Id ||
          z.jellyfinUsername?.toLowerCase() === jUser.Name.toLowerCase(),
      )
      return {
        jellyfinId: jUser.Id,
        jellyfinName: jUser.Name,
        isDisabled: jUser.Policy?.IsDisabled ?? false,
        isAdmin: jUser.Policy?.IsAdministrator ?? false,
        canPlayMedia: jUser.Policy?.EnableMediaPlayback ?? false,
        lastLogin: jUser.LastLoginDate ?? null,
        lastActivity: jUser.LastActivityDate ?? null,
        zflixId: linked?.id ?? null,
        zflixUsername: linked?.username ?? null,
        isSubscribed: linked?.isSubscribed ?? false,
        subscriptionExpiresAt: linked?.subscriptionExpiresAt ?? null,
      }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[admin/jellyfin]', msg)
    return NextResponse.json(
      { success: false, error: msg },
      { status: 502 },
    )
  }
}
