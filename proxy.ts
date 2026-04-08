import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TokenPayload {
  userId: string
  username: string
  email?: string
  isAdmin: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production')
    }
    return new TextEncoder().encode('fallback-dev-secret-change-in-production')
  }
  return new TextEncoder().encode(raw)
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())

    const userId = payload['userId']
    const username = payload['username']
    const isAdmin = payload['isAdmin']

    if (
      typeof userId !== 'string' ||
      typeof username !== 'string' ||
      typeof isAdmin !== 'boolean'
    ) {
      return null
    }

    const email = typeof payload['email'] === 'string' ? payload['email'] : undefined

    return { userId, username, email, isAdmin }
  } catch {
    return null
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Skip static assets and API health endpoint
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/api/health'
  ) {
    return NextResponse.next()
  }

  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true'
  const token = request.cookies.get('auth-token')?.value ?? null

  // Verify JWT (edge-compatible via jose)
  let user: TokenPayload | null = null
  if (token) {
    user = await verifyToken(token)
  }

  // Maintenance mode: redirect all non-admin traffic to /maintenance
  // Exception: /maintenance itself and /api/* routes
  if (
    maintenanceMode &&
    pathname !== '/maintenance' &&
    !pathname.startsWith('/api/')
  ) {
    if (user?.isAdmin) return NextResponse.next()
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  // Protect /dashboard — requires authenticated user
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect /admin — requires authenticated admin
  if (pathname.startsWith('/admin')) {
    if (!user || !user.isAdmin) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
