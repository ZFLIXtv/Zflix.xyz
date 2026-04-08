import { prisma } from '@/lib/db'

// ─── Action types ─────────────────────────────────────────────────────────────

export type AuditAction =
  | 'REGISTER'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'SUBSCRIPTION_RENEW'
  | 'SUBSCRIPTION_EXPIRE'
  | 'REFERRAL_REWARD'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'ADMIN_EXTEND'
  | 'ADMIN_CLEAR_SUBSCRIPTION'
  | 'ADMIN_CLEAR_EXPIRATION'
  | 'ADMIN_SET_MEDIA_ACCESS'
  | 'ADMIN_SYNC_POLICIES'
  | 'ADMIN_DISABLE_ACCOUNT'
  | 'ADMIN_ENABLE_ACCOUNT'
  | 'JELLYFIN_ERROR'
  | 'ADMIN_VIEW'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET'

// ─── logAudit ─────────────────────────────────────────────────────────────────

export async function logAudit(params: {
  userId?: string
  action: AuditAction
  details?: Record<string, unknown>
  ipAddress?: string
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress ?? null,
      },
    })
  } catch (error) {
    // Audit logging must never crash the caller
    console.error('[audit] Failed to write audit log:', error)
  }
}
