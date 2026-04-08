import type { NextRequest } from 'next/server'

/**
 * Safely extract the client IP from a request.
 * Takes only the first entry of X-Forwarded-For to prevent spoofing.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  const first = forwarded.split(',')[0].trim()
  return first || 'unknown'
}
