import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import type { Prisma } from '@prisma/client'

// ─── GET /api/admin/audit ─────────────────────────────────────────────────────

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

  // Parse query params
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const filterUserId = searchParams.get('userId') ?? ''
  const filterAction = searchParams.get('action') ?? ''
  const startDateRaw = searchParams.get('startDate') ?? ''
  const endDateRaw = searchParams.get('endDate') ?? ''

  const skip = (page - 1) * limit

  // Build where clause
  const where: Prisma.AuditLogWhereInput = {}

  if (filterUserId.trim()) {
    where.userId = filterUserId.trim()
  }

  if (filterAction.trim()) {
    where.action = filterAction.trim()
  }

  if (startDateRaw || endDateRaw) {
    where.createdAt = {}
    if (startDateRaw) {
      const startDate = new Date(startDateRaw)
      if (!isNaN(startDate.getTime())) {
        where.createdAt.gte = startDate
      }
    }
    if (endDateRaw) {
      const endDate = new Date(endDateRaw)
      if (!isNaN(endDate.getTime())) {
        // Include the full end day
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }
  }

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('[admin/audit] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}
