'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Badge from '@/components/ui/Badge'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string
  userId: string | null
  action: string
  details: string | null
  ipAddress: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ApiResponse {
  success: boolean
  data?: {
    logs: AuditLog[]
    pagination: Pagination
  }
  error?: string
}

// ─── Action Badge Config ──────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

function getActionBadge(action: string): { label: string; variant: BadgeVariant } {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    REGISTER: { label: 'Inscription', variant: 'info' },
    LOGIN: { label: 'Connexion', variant: 'default' },
    LOGOUT: { label: 'Déconnexion', variant: 'default' },
    PASSWORD_CHANGE: { label: 'MDP modifié', variant: 'warning' },
    PASSWORD_RESET_REQUEST: { label: 'Reset MDP', variant: 'warning' },
    PASSWORD_RESET: { label: 'MDP réinitialisé', variant: 'warning' },
    SUBSCRIPTION_RENEW: { label: 'Renouvellement', variant: 'success' },
    SUBSCRIPTION_EXPIRE: { label: 'Expiration', variant: 'danger' },
    REFERRAL_REWARD: { label: 'Parrainage', variant: 'success' },
    PAYMENT_SUCCESS: { label: 'Paiement OK', variant: 'success' },
    PAYMENT_FAILED: { label: 'Paiement échoué', variant: 'danger' },
    ADMIN_EXTEND: { label: 'Extension admin', variant: 'warning' },
    ADMIN_VIEW: { label: 'Vue admin', variant: 'default' },
    JELLYFIN_ERROR: { label: 'Erreur Jellyfin', variant: 'danger' },
  }
  return map[action] ?? { label: action, variant: 'default' }
}

// ─── Known action types for filter dropdown ───────────────────────────────────

const ACTION_TYPES = [
  'REGISTER', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE',
  'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET',
  'SUBSCRIPTION_RENEW', 'SUBSCRIPTION_EXPIRE',
  'REFERRAL_REWARD', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
  'ADMIN_EXTEND', 'ADMIN_VIEW', 'JELLYFIN_ERROR',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTimeFr(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────

const TableSkeleton: React.FC = () => (
  <tbody>
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={i} className="border-b border-accent/5">
        {[1, 2, 3, 4, 5].map((j) => (
          <td key={j} className="py-4 pr-4">
            <div className="h-4 bg-dark/60 rounded animate-pulse" style={{ width: `${50 + (i * j) % 40}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
)

// ─── Expandable Details ───────────────────────────────────────────────────────

const DetailsCell: React.FC<{ details: string | null }> = ({ details }) => {
  const [expanded, setExpanded] = useState(false)

  if (!details) return <span className="text-accent-off">—</span>

  let parsed: unknown
  try {
    parsed = JSON.parse(details)
  } catch {
    parsed = details
  }

  const formatted =
    typeof parsed === 'object' && parsed !== null
      ? JSON.stringify(parsed, null, 2)
      : String(parsed)

  return (
    <div>
      {expanded ? (
        <div className="max-w-xs">
          <pre className="text-xs text-accent-off bg-dark/60 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all">
            {formatted}
          </pre>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-xs text-accent hover:underline mt-1 focus:outline-none"
          >
            Réduire
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs text-accent-off hover:text-accent transition-colors focus:outline-none text-left max-w-[160px] truncate block"
          title={details}
        >
          {truncate(details, 40)}
        </button>
      )}
    </div>
  )
}

// ─── AuditLogTable ────────────────────────────────────────────────────────────

const AuditLogTable: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (actionFilter) params.set('action', actionFilter)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`/api/admin/audit?${params.toString()}`, { credentials: 'include' })
      const json = (await res.json()) as ApiResponse

      if (json.success && json.data) {
        setLogs(json.data.logs)
        setPagination(json.data.pagination)
      } else {
        setError(json.error ?? 'Erreur lors du chargement')
      }
    } catch {
      setError('Impossible de charger les logs')
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter, startDate, endDate])

  useEffect(() => {
    setPage(1)
  }, [actionFilter, startDate, endDate])

  useEffect(() => {
    void fetchLogs()
  }, [fetchLogs])

  const inputClass = [
    'bg-dark-apparent border border-accent/20 rounded-xl',
    'px-3 py-2 text-sm text-[#E8F4FA] placeholder:text-accent-off/60',
    'focus:outline-none focus:border-accent',
    'transition-all duration-200',
  ].join(' ')

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className={`${inputClass} cursor-pointer`}
          aria-label="Filtrer par type d'action"
        >
          <option value="">Toutes les actions</option>
          {ACTION_TYPES.map((a) => (
            <option key={a} value={a}>{getActionBadge(a).label}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label htmlFor="audit-start" className="text-xs text-accent-off whitespace-nowrap">
            Du
          </label>
          <input
            id="audit-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="audit-end" className="text-xs text-accent-off whitespace-nowrap">
            Au
          </label>
          <input
            id="audit-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>

        {(actionFilter || startDate || endDate) && (
          <button
            type="button"
            onClick={() => { setActionFilter(''); setStartDate(''); setEndDate('') }}
            className="text-xs text-accent-off hover:text-accent transition-colors focus:outline-none"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-dark-apparent/80 border border-accent/10 rounded-xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="border-b border-accent/10">
              <tr>
                {['Date/Heure', 'Action', 'Utilisateur', 'IP', 'Détails'].map((h) => (
                  <th key={h} className="text-left py-3 pr-4 text-xs font-medium text-accent-off uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {loading ? (
              <TableSkeleton />
            ) : error ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-red-400">
                    {error}
                  </td>
                </tr>
              </tbody>
            ) : logs.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <p className="text-accent-off text-sm">Aucune entrée dans le journal</p>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {logs.map((log) => {
                  const { label, variant } = getActionBadge(log.action)
                  return (
                    <tr key={log.id} className="border-b border-accent/5 hover:bg-dark/30 transition-colors">
                      <td className="py-3 pr-4 text-xs text-accent-off whitespace-nowrap">
                        {formatDateTimeFr(log.createdAt)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={variant} size="sm">{label}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {log.userId ? (
                          <span className="font-mono text-xs text-accent-off" title={log.userId}>
                            {log.userId.slice(0, 8)}…
                          </span>
                        ) : (
                          <span className="text-xs text-accent-off">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs text-accent-off">
                          {log.ipAddress ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 max-w-[200px]">
                        <DetailsCell details={log.details} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-accent/10">
            <p className="text-xs text-accent-off">
              {pagination.total} entrée{pagination.total !== 1 ? 's' : ''} —
              page {pagination.page} / {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-medium',
                  'border border-accent/20 text-accent-off',
                  'hover:border-accent/50 hover:text-accent',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'transition-all duration-150 focus:outline-none',
                ].join(' ')}
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-medium',
                  'border border-accent/20 text-accent-off',
                  'hover:border-accent/50 hover:text-accent',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'transition-all duration-150 focus:outline-none',
                ].join(' ')}
              >
                Suivant →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditLogTable
