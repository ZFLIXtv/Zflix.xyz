import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { setJellyfinUserFolders, JellyfinError } from '@/lib/jellyfin'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = getTokenFromCookies(request)
  if (!token) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Session invalide.' }, { status: 401 })

  if (!payload.isAdmin && !(payload.email && isAdminEmail(payload.email))) {
    return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 })
  }

  const body = (await request.json()) as { jellyfinId?: string; folderIds?: string[]; username?: string }
  const { jellyfinId, folderIds, username } = body

  if (!jellyfinId || !Array.isArray(folderIds)) {
    return NextResponse.json({ success: false, error: 'jellyfinId et folderIds requis.' }, { status: 400 })
  }

  const ip = getClientIp(request)

  try {
    await setJellyfinUserFolders(jellyfinId, folderIds)

    await logAudit({
      userId: payload.userId,
      action: 'ADMIN_SET_MEDIA_ACCESS',
      details: { targetUsername: username ?? jellyfinId, jellyfinId, folderIds },
      ipAddress: ip,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof JellyfinError ? error.message : 'Erreur Jellyfin.'
    console.error('[admin/set-media-access]', error)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
