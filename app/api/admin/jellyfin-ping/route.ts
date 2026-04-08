import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = getTokenFromCookies(request)
  if (!token) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload?.isAdmin) return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 })

  const url = process.env.JELLYFIN_URL
  const key = process.env.JELLYFIN_API_KEY

  if (!url) return NextResponse.json({ success: false, error: 'JELLYFIN_URL non définie.' })
  if (!key) return NextResponse.json({ success: false, error: 'JELLYFIN_API_KEY non définie.' })

  const testUrl = `${url.replace(/\/$/, '')}/Users`

  try {
    const res = await fetch(testUrl, {
      method: 'GET',
      headers: { Authorization: `MediaBrowser Token="${key}"`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
    })

    const body = await res.text()

    return NextResponse.json({
      success: res.ok,
      testedUrl: testUrl,
      httpStatus: res.status,
      responsePreview: body.slice(0, 200),
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      testedUrl: testUrl,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
