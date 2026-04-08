import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// ─── GET /api/health ──────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const timestamp = new Date().toISOString()

  // Check for detailed health check via Authorization header
  const healthSecret = process.env.HEALTH_CHECK_SECRET
  const authHeader = request.headers.get('Authorization') ?? ''
  const providedToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  const isDetailed = !!healthSecret && healthSecret.length >= 16 && providedToken === healthSecret

  // Basic response (no auth required)
  if (!isDetailed) {
    return NextResponse.json({
      success: true,
      data: {
        status: 'ok',
        timestamp,
      },
    })
  }

  // Detailed check
  const services: {
    database: { status: 'ok' | 'error'; message?: string }
    jellyfin: { status: 'ok' | 'error'; message?: string }
    email: { status: 'ok' | 'error'; message?: string }
  } = {
    database: { status: 'error' },
    jellyfin: { status: 'error' },
    email: { status: 'error' },
  }

  // 1. Check DB
  try {
    await prisma.$queryRaw`SELECT 1`
    services.database = { status: 'ok' }
  } catch (error) {
    console.error('[health] Database check failed:', error)
    services.database = { status: 'error', message: 'Database unreachable' }
  }

  // 2. Check Jellyfin
  const jellyfinUrl = process.env.JELLYFIN_URL
  if (!jellyfinUrl) {
    services.jellyfin = { status: 'error', message: 'JELLYFIN_URL not configured' }
  } else {
    try {
      const jellyfinResponse = await fetch(`${jellyfinUrl}/System/Info/Public`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      })
      if (jellyfinResponse.ok) {
        services.jellyfin = { status: 'ok' }
      } else {
        services.jellyfin = {
          status: 'error',
          message: `Jellyfin returned HTTP ${jellyfinResponse.status}`,
        }
      }
    } catch (error) {
      console.error('[health] Jellyfin check failed:', error)
      services.jellyfin = { status: 'error', message: 'Jellyfin unreachable' }
    }
  }

  // 3. Check email (Resend) — basic connectivity check via env key presence
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    services.email = { status: 'error', message: 'RESEND_API_KEY not configured' }
  } else {
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      })
      // Resend returns 200 or 405 for valid keys on this endpoint
      if (resendResponse.status === 200 || resendResponse.status === 405) {
        services.email = { status: 'ok' }
      } else if (resendResponse.status === 401 || resendResponse.status === 403) {
        services.email = { status: 'error', message: 'Invalid Resend API key' }
      } else {
        services.email = { status: 'ok' } // Assume ok if not auth error
      }
    } catch (error) {
      console.error('[health] Email (Resend) check failed:', error)
      services.email = { status: 'error', message: 'Resend unreachable' }
    }
  }

  const allOk = Object.values(services).every((s) => s.status === 'ok')
  const overallStatus: 'ok' | 'degraded' = allOk ? 'ok' : 'degraded'

  return NextResponse.json({
    success: true,
    data: {
      status: overallStatus,
      services,
      version: process.env.npm_package_version ?? '0.1.0',
      uptime: process.uptime(),
      timestamp,
    },
  })
}
