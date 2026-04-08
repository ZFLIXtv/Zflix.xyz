import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getAllJellyfinUsers } from '@/lib/jellyfin'
import { logAudit } from '@/lib/audit'
import type { Prisma } from '@prisma/client'

export interface MemberRow {
  id: string | null
  username: string
  email: string | null
  isSubscribed: boolean
  trialUsed: boolean
  hasPaid: boolean
  subscriptionExpiresAt: string | null
  createdAt: string | null
  isAdmin: boolean
  // Jellyfin
  jellyfinId: string | null
  jellyfinDisabled: boolean | null
  canPlayMedia: boolean | null
  lastLogin: string | null
  // meta
  source: 'zflix' | 'jellyfin-only'
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = getTokenFromCookies(request)
  if (!token) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Session invalide.' }, { status: 401 })

  if (!payload.isAdmin && !(payload.email && isAdminEmail(payload.email))) {
    return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 })
  }

  const ip = getClientIp(request)
  const { searchParams } = new URL(request.url)
  const search = (searchParams.get('search') ?? '').slice(0, 100)
  const filter = searchParams.get('filter') ?? 'all'
  const statsOnly = searchParams.get('stats') === 'true'

  const now = new Date()
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  try {
    // ── Stats ──────────────────────────────────────────────────────────────────
    // Accès valide = abonné, ou pas de date d'expiration, ou expiry futur
    const validAccess = {
      OR: [
        { isSubscribed: true },
        { subscriptionExpiresAt: null },
        { subscriptionExpiresAt: { gt: now } },
      ],
    }
    // Actif = a payé OU expiry > 1 mois
    const isActiveCondition = {
      OR: [
        { payments: { some: { status: 'succeeded' } } },
        { subscriptionExpiresAt: { gt: oneMonthFromNow } },
      ],
    }
    // Essai = jamais payé ET (expiry=null OU expiry <= 1 mois)
    const isTrialCondition = {
      AND: [
        { payments: { none: { status: 'succeeded' } } },
        { OR: [{ subscriptionExpiresAt: null }, { subscriptionExpiresAt: { lte: oneMonthFromNow } }] },
      ],
    }
    const noAccess = { isSubscribed: false, subscriptionExpiresAt: { not: null, lte: now } }

    const [dbTotal, active, trial, expired] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { AND: [validAccess, isActiveCondition] } }),
      prisma.user.count({ where: { AND: [validAccess, isTrialCondition] } }),
      prisma.user.count({ where: noAccess }),
    ])

    if (statsOnly) {
      // Inclure les comptes Jellyfin non liés dans le total et les essais
      let jellyfinOnlyCount = 0
      try {
        const [allJFUsers, linkedIds] = await Promise.all([
          getAllJellyfinUsers(),
          prisma.user.findMany({ select: { jellyfinUserId: true }, where: { jellyfinUserId: { not: null } } }),
        ])
        const linkedSet = new Set(linkedIds.map((u) => u.jellyfinUserId))
        jellyfinOnlyCount = allJFUsers.filter((j) => !linkedSet.has(j.Id)).length
      } catch { /* Jellyfin indisponible — on ignore */ }

      return NextResponse.json({
        success: true,
        data: {
          total: dbTotal + jellyfinOnlyCount,
          active,
          trial: trial + jellyfinOnlyCount,
          expired,
        },
      })
    }

    const total = dbTotal

    // ── Where clause ───────────────────────────────────────────────────────────
    const where: Prisma.UserWhereInput = {}
    if (search.trim()) {
      where.OR = [
        { username: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }
    if (filter === 'active') {
      where.AND = [
        { OR: [{ isSubscribed: true }, { subscriptionExpiresAt: null }, { subscriptionExpiresAt: { gt: now } }] },
        { OR: [{ payments: { some: { status: 'succeeded' } } }, { subscriptionExpiresAt: { gt: oneMonthFromNow } }] },
      ]
    } else if (filter === 'trial') {
      where.payments = { none: { status: 'succeeded' } }
      where.AND = [
        { OR: [{ isSubscribed: true }, { subscriptionExpiresAt: null }, { subscriptionExpiresAt: { gt: now } }] },
        { OR: [{ subscriptionExpiresAt: null }, { subscriptionExpiresAt: { lte: oneMonthFromNow } }] },
      ]
    } else if (filter === 'expired') {
      where.isSubscribed = false
      where.subscriptionExpiresAt = { not: null, lte: now }
    }

    // ── Fetch ZFlix users + Jellyfin in parallel ───────────────────────────────
    const [zflixUsers, jellyfinUsers] = await Promise.allSettled([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          isAdmin: true,
          isSubscribed: true,
          trialUsed: true,
          subscriptionExpiresAt: true,
          createdAt: true,
          jellyfinUserId: true,
          jellyfinUsername: true,
          payments: { where: { status: 'succeeded' }, select: { id: true }, take: 1 },
        },
      }),
      getAllJellyfinUsers(),
    ])

    const jUsers = jellyfinUsers.status === 'fulfilled' ? jellyfinUsers.value : []
    const jellyfinAvailable = jellyfinUsers.status === 'fulfilled'

    const dbUsers = zflixUsers.status === 'fulfilled' ? zflixUsers.value : []

    // ── Merge ──────────────────────────────────────────────────────────────────
    const mergedZflix: MemberRow[] = dbUsers.map((u) => {
      const jUser = jUsers.find(
        (j) => j.Id === u.jellyfinUserId || j.Name.toLowerCase() === u.jellyfinUsername?.toLowerCase(),
      )
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        isSubscribed: u.isSubscribed,
        trialUsed: u.trialUsed,
        hasPaid: u.payments.length > 0,
        subscriptionExpiresAt: u.subscriptionExpiresAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        isAdmin: u.isAdmin,
        jellyfinId: jUser?.Id ?? u.jellyfinUserId ?? null,
        jellyfinDisabled: jUser ? (jUser.Policy?.IsDisabled ?? false) : null,
        canPlayMedia: jUser ? (jUser.Policy?.EnableMediaPlayback ?? false) : null,
        lastLogin: jUser?.LastLoginDate ?? null,
        source: 'zflix',
      }
    })

    // Jellyfin-only: accounts not linked to any ZFlix user
    const linkedJellyfinIds = new Set(dbUsers.map((u) => u.jellyfinUserId).filter(Boolean))
    const linkedJellyfinNames = new Set(dbUsers.map((u) => u.jellyfinUsername?.toLowerCase()).filter(Boolean))

    const jellyfinOnly: MemberRow[] = jellyfinAvailable
      ? jUsers
          .filter((j) => !linkedJellyfinIds.has(j.Id) && !linkedJellyfinNames.has(j.Name.toLowerCase()))
          .map((j) => ({
            id: null,
            username: j.Name,
            email: null,
            isSubscribed: false,
            trialUsed: false,
            hasPaid: false,
            subscriptionExpiresAt: null,
            createdAt: null,
            isAdmin: j.Policy?.IsAdministrator ?? false,
            jellyfinId: j.Id,
            jellyfinDisabled: j.Policy?.IsDisabled ?? false,
            canPlayMedia: j.Policy?.EnableMediaPlayback ?? false,
            lastLogin: j.LastLoginDate ?? null,
            source: 'jellyfin-only',
          }))
      : []

    const members = [...mergedZflix, ...jellyfinOnly]

    await logAudit({
      userId: payload.userId,
      action: 'ADMIN_VIEW',
      details: { resource: 'members', filter, search },
      ipAddress: ip,
    })

    return NextResponse.json({
      success: true,
      data: {
        members,
        stats: { total, active, trial, expired },
        jellyfinAvailable,
      },
    })
  } catch (error) {
    console.error('[admin/members]', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur.' }, { status: 500 })
  }
}
