import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import type { NextRequest, NextResponse } from 'next/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  userId: string
  username: string
  email?: string
  isAdmin: boolean
}

// ─── Secret ───────────────────────────────────────────────────────────────────

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

// ─── Password helpers ─────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

export async function generateToken(payload: TokenPayload): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d'

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
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

// ─── Cookie helpers ───────────────────────────────────────────────────────────

const COOKIE_NAME = 'auth-token'
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 days

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export function getTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_NAME)?.value ?? null
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
}
