import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie, getTokenFromCookies, verifyToken } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Attempt to get userId for audit log (best-effort, not required)
  let userId: string | undefined
  try {
    const token = getTokenFromCookies(request)
    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        userId = payload.userId
      }
    }
  } catch {
    // Ignore token errors on logout
  }

  const ip = getClientIp(request)

  await logAudit({
    userId,
    action: 'LOGOUT',
    ipAddress: ip,
  })

  const response = NextResponse.json({ success: true })
  clearAuthCookie(response)
  return response
}
