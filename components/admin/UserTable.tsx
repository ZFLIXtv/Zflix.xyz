'use client'

import React, { useState, useEffect, useCallback } from 'react'
import UserRow from '@/components/admin/UserRow'
import ExtendModal from '@/components/admin/ExtendModal'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

export interface AdminTableUser {
  id: string
  username: string
  email: string | null
  jellyfinUsername: string | null
  isSubscribed: boolean
  trialUsed: boolean
  hasPaid: boolean
  subscriptionExpiresAt: string | null
  emailVerified: boolean
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
  data?: { users: AdminTableUser[]; pagination: Pagination }
  error?: string
}

type SortKey = 'username' | 'createdAt' | 'subscriptionExpiresAt'
type SortDir = 'asc' | 'desc'

interface UserTableProps {
  searchQuery: string
  filter: string
}

const TableSkeleton: React.FC = () => (
  <tbody>
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={i} className="border-b border-white/5">
        {[1, 2, 3, 4, 5].map((j) => (
          <td key={j} className="py-4 pr-4">
            <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${60 + (i * j) % 40}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
)

const SortIcon: React.FC<{ active: boolean; dir: SortDir }> = ({ active, dir }) => (
  <svg
    className={`w-3 h-3 inline-block ml-1 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}
    fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
  >
    {dir === 'asc' || !active
      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />}
  </svg>
)

const UserTable: React.FC<UserTableProps> = ({ searchQuery, filter }) => {
  const [users, setUsers] = useState<AdminTableUser[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [extendUserId, setExtendUserId] = useState<string | null>(null)
  const [extendUserLabel, setExtendUserLabel] = useState<string>('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search: searchQuery, filter })
      const res = await fetch(`/api/admin/users?${params.toString()}`, { credentials: 'include' })
      const json = (await res.json()) as ApiResponse
      if (json.success && json.data) {
        setUsers(json.data.users)
        setPagination(json.data.pagination)
      } else {
        setError(json.error ?? 'Erreur lors du chargement')
      }
    } catch {
      setError('Impossible de charger les utilisateurs')
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, filter])

  useEffect(() => { setPage(1) }, [searchQuery, filter])
  useEffect(() => { void fetchUsers() }, [fetchUsers])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const handleExtend = (userId: string) => {
    const u = users.find((usr) => usr.id === userId)
    if (u) { setExtendUserId(userId); setExtendUserLabel(u.username) }
  }

  const sortedUsers = [...users].sort((a, b) => {
    let aVal: string | number = 0
    let bVal: string | number = 0
    if (sortKey === 'username') { aVal = a.username.toLowerCase(); bVal = b.username.toLowerCase() }
    else if (sortKey === 'createdAt') { aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime() }
    else if (sortKey === 'subscriptionExpiresAt') {
      aVal = a.subscriptionExpiresAt ? new Date(a.subscriptionExpiresAt).getTime() : 0
      bVal = b.subscriptionExpiresAt ? new Date(b.subscriptionExpiresAt).getTime() : 0
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const ThBtn: React.FC<{ label: string; sk: SortKey }> = ({ label, sk }) => (
    <th className="text-left py-3 pr-4">
      <button
        type="button"
        onClick={() => handleSort(sk)}
        className="text-xs font-semibold text-accent-off uppercase tracking-widest hover:text-accent transition-colors focus:outline-none"
      >
        {label}
        <SortIcon active={sortKey === sk} dir={sortDir} />
      </button>
    </th>
  )

  return (
    <div>
      <div
        className="rounded-2xl overflow-hidden backdrop-blur-md"
        style={{
          background: 'rgba(16,18,50,0.75)',
          border: '1px solid rgba(0,212,255,0.12)',
          boxShadow: '0 0 40px rgba(0,212,255,0.05), 0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
                <ThBtn label="Utilisateur" sk="username" />
                <th className="text-left py-3 pr-4 text-xs font-semibold text-accent-off uppercase tracking-widest">Statut</th>
                <ThBtn label="Expiration" sk="subscriptionExpiresAt" />
                <ThBtn label="Inscrit le" sk="createdAt" />
                <th className="text-left py-3 text-xs font-semibold text-accent-off uppercase tracking-widest">Actions</th>
              </tr>
            </thead>

            {loading ? (
              <TableSkeleton />
            ) : error ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-red-400">{error}</td>
                </tr>
              </tbody>
            ) : sortedUsers.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <p className="text-accent-off text-sm">Aucun utilisateur trouvé</p>
                    <p className="text-accent-off/50 text-xs mt-1">Modifiez vos filtres de recherche</p>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {sortedUsers.map((user) => (
                  <UserRow key={user.id} user={user} onExtend={handleExtend} />
                ))}
              </tbody>
            )}
          </table>
        </div>

        {!loading && !error && pagination.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: '1px solid rgba(0,212,255,0.1)' }}
          >
            <p className="text-xs text-accent-off">
              <span className="text-accent font-semibold">{pagination.total}</span> utilisateur{pagination.total !== 1 ? 's' : ''} — page{' '}
              <span className="text-accent font-semibold">{pagination.page}</span> / {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              {[
                { label: '← Précédent', disabled: page <= 1, onClick: () => setPage((p) => Math.max(1, p - 1)) },
                { label: 'Suivant →', disabled: page >= pagination.totalPages, onClick: () => setPage((p) => Math.min(pagination.totalPages, p + 1)) },
              ].map(({ label, disabled, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  disabled={disabled}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(0,212,255,0.08)',
                    border: '1px solid rgba(0,212,255,0.2)',
                    color: 'rgb(0,212,255)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ExtendModal
        isOpen={extendUserId !== null}
        onClose={() => setExtendUserId(null)}
        userId={extendUserId ?? ''}
        jellyfinId={null}
        userEmail={extendUserLabel}
        onSuccess={() => void fetchUsers()}
      />
    </div>
  )
}

export default UserTable
