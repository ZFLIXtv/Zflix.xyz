'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { MemberRow } from '@/app/api/admin/members/route'
import ExtendModal from '@/components/admin/ExtendModal'
import MediaAccessModal from '@/components/admin/MediaAccessModal'
import MemberActions from '@/components/admin/MemberActions'

type SortKey = 'username' | 'subscription' | 'lastLogin' | 'createdAt'
type SortDir = 'asc' | 'desc'

function formatDate(str: string | null): string {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(str: string | null): string {
  if (!str) return '—'
  return new Date(str).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function daysLeft(str: string): number {
  return Math.ceil((new Date(str).getTime() - Date.now()) / 86400000)
}

type StatusKey = 'active' | 'trial' | 'expired'
const statusConfig: Record<StatusKey, { label: string; dot: string; bg: string; color: string; border: string }> = {
  active:  { label: 'Actif',   dot: 'rgb(74,222,128)', bg: 'rgba(74,222,128,0.12)', color: 'rgb(74,222,128)', border: 'rgba(74,222,128,0.25)' },
  trial:   { label: 'Essai',   dot: 'rgb(56,189,248)', bg: 'rgba(56,189,248,0.12)', color: 'rgb(56,189,248)', border: 'rgba(56,189,248,0.25)' },
  expired: { label: 'Expiré', dot: 'rgb(251,146,60)',  bg: 'rgba(251,146,60,0.12)', color: 'rgb(251,146,60)', border: 'rgba(251,146,60,0.25)' },
}

function getStatus(row: MemberRow): StatusKey {
  const now = new Date()
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expires = row.subscriptionExpiresAt ? new Date(row.subscriptionExpiresAt) : null
  const hasAccess = row.isSubscribed || expires === null || (expires !== null && expires > now)
  if (!hasAccess) return 'expired'
  // Actif si a payé OU si l'expiration est à plus d'un mois
  const isActive = row.hasPaid || (expires !== null && expires > oneMonthFromNow)
  return isActive ? 'active' : 'trial'
}

const SkeletonRows = () => (
  <>
    {[1,2,3,4,5].map((i) => (
      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {[1,2,3,4,5].map((j) => (
          <td key={j} className="py-4 pr-4">
            <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${50+(i*j)%40}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </>
)

interface Props {
  searchQuery: string
  filter: string
}

const MembersTable: React.FC<Props> = ({ searchQuery, filter }) => {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jellyfinAvailable, setJellyfinAvailable] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [extendTarget, setExtendTarget] = useState<{ userId: string | null; jellyfinId: string | null; username: string } | null>(null)
  const [mediaTarget, setMediaTarget] = useState<{ jellyfinId: string; username: string } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ applied: number; skipped: number; errors: string[] } | null>(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ search: searchQuery, filter })
      const res = await fetch(`/api/admin/members?${params}`, { credentials: 'include' })
      const json = (await res.json()) as {
        success: boolean
        data?: { members: MemberRow[]; jellyfinAvailable: boolean }
        error?: string
      }
      if (json.success && json.data) {
        setMembers(json.data.members)
        setJellyfinAvailable(json.data.jellyfinAvailable)
      } else {
        setError(json.error ?? 'Erreur inconnue')
      }
    } catch {
      setError('Impossible de charger les membres')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filter])

  useEffect(() => { void fetchMembers() }, [fetchMembers])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = useMemo(() => {
    return [...members].sort((a, b) => {
      if (sortKey === 'username') {
        return sortDir === 'asc'
          ? a.username.localeCompare(b.username)
          : b.username.localeCompare(a.username)
      }
      let aVal = 0, bVal = 0
      if (sortKey === 'subscription') {
        aVal = a.subscriptionExpiresAt ? new Date(a.subscriptionExpiresAt).getTime() : 0
        bVal = b.subscriptionExpiresAt ? new Date(b.subscriptionExpiresAt).getTime() : 0
      } else if (sortKey === 'lastLogin') {
        aVal = a.lastLogin ? new Date(a.lastLogin).getTime() : 0
        bVal = b.lastLogin ? new Date(b.lastLogin).getTime() : 0
      } else if (sortKey === 'createdAt') {
        aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0
        bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [members, sortKey, sortDir])

  const SortBtn: React.FC<{ label: string; sk: SortKey }> = ({ label, sk }) => (
    <th className="text-left py-3 pr-4">
      <button
        type="button"
        onClick={() => handleSort(sk)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest transition-colors focus:outline-none"
        style={{ color: sortKey === sk ? 'rgb(0,212,255)' : 'rgb(110,125,175)' }}
      >
        {label}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: sortKey === sk ? 1 : 0.3 }}>
          {sortKey === sk && sortDir === 'desc'
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />}
        </svg>
      </button>
    </th>
  )

  const handleSyncPolicies = async () => {
    if (!confirm('Appliquer les politiques d\'accès à tous les comptes actifs ? (retire "abonnement expirer" de tous les comptes abonnés)')) return
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/admin/sync-policies', { method: 'POST', credentials: 'include' })
      const json = (await res.json()) as { success: boolean; data?: { applied: number; skipped: number; errors: string[] }; error?: string }
      if (json.success && json.data) setSyncResult(json.data)
      else setSyncResult({ applied: 0, skipped: 0, errors: [json.error ?? 'Erreur inconnue'] })
    } catch {
      setSyncResult({ applied: 0, skipped: 0, errors: ['Erreur réseau'] })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Avertissement Jellyfin indisponible */}
      {!loading && !jellyfinAvailable && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', color: 'rgb(251,146,60)' }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Jellyfin injoignable — données de connexion indisponibles
        </div>
      )}

      {/* Sync policies */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => void handleSyncPolicies()}
          disabled={syncing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: 'rgb(139,92,246)' }}
        >
          {syncing ? (
            <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {syncing ? 'Synchronisation…' : 'Synchroniser les accès Jellyfin'}
        </button>

        {syncResult && (
          <div
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: syncResult.errors.length > 0 ? 'rgba(251,146,60,0.08)' : 'rgba(74,222,128,0.08)',
              border: `1px solid ${syncResult.errors.length > 0 ? 'rgba(251,146,60,0.2)' : 'rgba(74,222,128,0.2)'}`,
              color: syncResult.errors.length > 0 ? 'rgb(251,146,60)' : 'rgb(74,222,128)',
            }}
          >
            <span>{syncResult.applied} compte{syncResult.applied !== 1 ? 's' : ''} mis à jour</span>
            <span style={{ color: 'rgba(110,125,175,0.6)' }}>·</span>
            <span style={{ color: 'rgb(110,125,175)' }}>{syncResult.skipped} admin{syncResult.skipped !== 1 ? 's' : ''} ignoré{syncResult.skipped !== 1 ? 's' : ''}</span>
            {syncResult.errors.length > 0 && (
              <>
                <span style={{ color: 'rgba(110,125,175,0.6)' }}>·</span>
                <span title={syncResult.errors.join('\n')} style={{ cursor: 'help', textDecoration: 'underline dotted' }}>
                  {syncResult.errors.length} erreur{syncResult.errors.length !== 1 ? 's' : ''} (hover)
                </span>
              </>
            )}
            <button type="button" onClick={() => setSyncResult(null)} style={{ color: 'rgba(110,125,175,0.5)' }}>✕</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden backdrop-blur-md"
        style={{
          background: 'rgba(16,18,50,0.75)',
          border: '1px solid rgba(0,212,255,0.12)',
          boxShadow: '0 0 40px rgba(0,212,255,0.05), 0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
                <SortBtn label="Membre" sk="username" />
                <th className="text-left py-3 pr-4 text-xs font-semibold text-accent-off uppercase tracking-widest">Statut</th>
                <SortBtn label="Expiration" sk="subscription" />
                <SortBtn label="Dernière connexion" sk="lastLogin" />
                <SortBtn label="Inscrit le" sk="createdAt" />
                <th className="text-left py-3 text-xs font-semibold text-accent-off uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : error ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-red-400">{error}</td></tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-accent-off text-sm">Aucun membre trouvé</p>
                    <p className="text-accent-off/50 text-xs mt-1">Modifiez vos filtres</p>
                  </td>
                </tr>
              ) : (
                sorted.map((row) => {
                  const status = getStatus(row)
                  const sc = statusConfig[status]
                  const days = row.subscriptionExpiresAt && new Date(row.subscriptionExpiresAt) > new Date()
                    ? daysLeft(row.subscriptionExpiresAt)
                    : null

                  return (
                    <tr
                      key={row.jellyfinId ?? row.id ?? row.username}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,212,255,0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      {/* Membre */}
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                            style={{
                              background: row.isAdmin ? 'rgba(255,200,40,0.15)' : 'rgba(0,212,255,0.12)',
                              color: row.isAdmin ? 'rgb(255,200,40)' : 'rgb(0,212,255)',
                              border: `1px solid ${row.isAdmin ? 'rgba(255,200,40,0.3)' : 'rgba(0,212,255,0.2)'}`,
                            }}
                          >
                            {row.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-sm text-[#E8F4FA]">@{row.username}</p>
                              {row.isAdmin && (
                                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,200,40,0.15)', color: 'rgb(255,200,40)' }}>
                                  Admin
                                </span>
                              )}
                            </div>
                            {row.email && <p className="text-xs text-accent-off/60 mt-0.5">{row.email}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Statut (abonnement + état Jellyfin) */}
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                            {sc.label}
                          </span>
                          {row.jellyfinDisabled === true && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: 'rgb(251,146,60)' }}>
                              <span className="w-1 h-1 rounded-full bg-orange-400" />
                              Jellyfin désactivé
                            </span>
                          )}
                          {row.jellyfinId === null && (
                            <span className="text-[10px]" style={{ color: 'rgba(110,125,175,0.5)' }}>Non lié</span>
                          )}
                        </div>
                      </td>

                      {/* Expiration */}
                      <td className="py-3.5 pr-4">
                        {row.subscriptionExpiresAt ? (
                          <div>
                            <span className={`text-sm font-medium ${new Date(row.subscriptionExpiresAt) < new Date() ? 'text-orange-400' : 'text-[#E8F4FA]'}`}>
                              {formatDate(row.subscriptionExpiresAt)}
                            </span>
                            {days !== null && days <= 7 && (
                              <p className="text-xs text-yellow-400 mt-0.5">{days}j restant{days > 1 ? 's' : ''}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-accent-off/40 text-sm">—</span>
                        )}
                      </td>

                      {/* Dernière connexion */}
                      <td className="py-3.5 pr-4 text-xs text-accent-off/70">
                        {formatDateTime(row.lastLogin)}
                      </td>

                      {/* Inscrit le */}
                      <td className="py-3.5 pr-4 text-xs text-accent-off/70">
                        {formatDate(row.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5">
                        {(row.id || row.jellyfinId) ? (
                          <MemberActions
                            userId={row.id}
                            username={row.username}
                            jellyfinId={row.jellyfinId}
                            isDisabled={row.jellyfinDisabled}
                            hasExpiration={row.subscriptionExpiresAt !== null}
                            onAction={() => void fetchMembers()}
                            onExtend={(row.id || row.jellyfinId) ? () => setExtendTarget({ userId: row.id, jellyfinId: row.jellyfinId, username: row.username }) : null}
                            onMediaAccess={row.jellyfinId ? () => setMediaTarget({ jellyfinId: row.jellyfinId!, username: row.username }) : null}
                          />
                        ) : (
                          <span className="text-accent-off/30 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MediaAccessModal
        isOpen={mediaTarget !== null}
        onClose={() => setMediaTarget(null)}
        jellyfinId={mediaTarget?.jellyfinId ?? ''}
        username={mediaTarget?.username ?? ''}
        onSuccess={() => void fetchMembers()}
      />

      <ExtendModal
        isOpen={extendTarget !== null}
        onClose={() => setExtendTarget(null)}
        userId={extendTarget?.userId ?? null}
        jellyfinId={extendTarget?.jellyfinId ?? null}
        userEmail={extendTarget?.username ?? ''}
        onSuccess={() => void fetchMembers()}
      />
    </div>
  )
}

export default MembersTable
