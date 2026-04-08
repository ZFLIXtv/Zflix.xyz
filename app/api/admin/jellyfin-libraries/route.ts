import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getJellyfinLibraries, getJellyfinUserPolicy } from '@/lib/jellyfin'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = getTokenFromCookies(request)
  if (!token) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Session invalide.' }, { status: 401 })

  if (!payload.isAdmin && !(payload.email && isAdminEmail(payload.email))) {
    return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const jellyfinId = searchParams.get('jellyfinId')

  try {
    const [libraries, userPolicy] = await Promise.all([
      getJellyfinLibraries(),
      jellyfinId ? getJellyfinUserPolicy(jellyfinId) : Promise.resolve(null),
    ])

    return NextResponse.json({ success: true, data: { libraries, userPolicy } })
  } catch (error) {
    console.error('[admin/jellyfin-libraries]', error)
    return NextResponse.json({ success: false, error: 'Erreur Jellyfin.' }, { status: 500 })
  }
}
