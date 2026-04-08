import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { logAudit } from '@/lib/audit'
import type { Prisma } from '@prisma/client'

// ─── GET /api/admin/users ─────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Admin auth check
  const token = getTokenFromCookies(request)
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Non authentifié.' },
      { status: 401 },
    )
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json(
      { success: false, error: 'Session invalide ou expirée.' },
      { status: 401 },
    )
  }

  if (!payload.isAdmin && !(payload.email && isAdminEmail(payload.email))) {
    return NextResponse.json(
      { success: false, error: 'Accès refusé.' },
      { status: 403 },
    )
  }

  const ip = getClientIp(request)

  // Parse query params
  const { searchParams } = new URL(request.url)
  const statsOnly = searchParams.get('stats') === 'true'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const search = searchParams.get('search') ?? ''
  const filter = searchParams.get('filter') ?? 'all'

  const skip = (page - 1) * limit

  // Build where clause
  const now = new Date()
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const where: Prisma.UserWhereInput = {}

  if (search.trim()) {
    where.OR = [
      { username: { contains: search.trim(), mode: 'insensitive' } },
      { email: { contains: search.trim(), mode: 'insensitive' } },
    ]
  }

  const validAccess = { OR: [{ isSubscribed: true }, { subscriptionExpiresAt: null }, { subscriptionExpiresAt: { gt: now } }] }

  if (filter === 'active' || filter === 'subscribed') {
    where.AND = [
      validAccess,
      { OR: [{ payments: { some: { status: 'succeeded' } } }, { subscriptionExpiresAt: { gt: oneMonthFromNow } }] },
    ]
  } else if (filter === 'expired') {
    where.isSubscribed = false
    where.subscriptionExpiresAt = { not: null, lte: now }
  } else if (filter === 'trial') {
    where.payments = { none: { status: 'succeeded' } }
    where.AND = [
      validAccess,
      { OR: [{ subscriptionExpiresAt: null }, { subscriptionExpiresAt: { lte: oneMonthFromNow } }] },
    ]
  } else if (filter === 'inactive') {
    where.isSubscribed = false
  }

  try {
    // Aggregate stats (always computed, returned as top-level when statsOnly=true)
    const [totalUsers, subscribedCount, trialCount, expiredCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          AND: [
            validAccess,
            { OR: [{ payments: { some: { status: 'succeeded' } } }, { subscriptionExpiresAt: { gt: oneMonthFromNow } }] },
          ],
        },
      }),
      prisma.user.count({
        where: {
          AND: [
            validAccess,
            { payments: { none: { status: 'succeeded' } } },
            { OR: [{ subscriptionExpiresAt: null }, { subscriptionExpiresAt: { lte: oneMonthFromNow } }] },
          ],
        },
      }),
      prisma.user.count({
        where: { isSubscribed: false, subscriptionExpiresAt: { not: null, lte: now } },
      }),
    ])

    if (statsOnly) {
      return NextResponse.json({
        success: true,
        data: {
          total: totalUsers,
          active: subscribedCount,
          trial: trialCount,
          expired: expiredCount,
        },
      })
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          isSubscribed: true,
          subscriptionExpiresAt: true,
          trialUsed: true,
          referralCode: true,
          jellyfinUsername: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { referrals: true, payments: true },
          },
          payments: { where: { status: 'succeeded' }, select: { id: true }, take: 1 },
        },
      }),
      prisma.user.count({ where }),
    ])

    await logAudit({
      userId: payload.userId,
      action: 'ADMIN_VIEW',
      details: { resource: 'users', page, limit, filter, search },
      ipAddress: ip,
    })

    const mappedUsers = users.map(({ payments, ...u }) => ({
      ...u,
      hasPaid: payments.length > 0,
    }))

    return NextResponse.json({
      success: true,
      data: {
        users: mappedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total: totalUsers,
          active: subscribedCount,
          trial: trialCount,
          expired: expiredCount,
        },
      },
    })
  } catch (error) {
    console.error('[admin/users] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}
