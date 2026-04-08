'use client'

import React, { useState, useEffect, useMemo } from 'react'

type SortKey = 'name' | 'lastLogin' | 'subscription'
type SortDir = 'asc' | 'desc'

interface JellyfinRow {
  jellyfinId: string
  jellyfinName: string
  isDisabled: boolean
  isAdmin: boolean
  canPlayMedia: boolean
  lastLogin: string | null
  lastActivity: string | null
  zflixId: string | null
  zflixUsername: string | null
  isSubscribed: boolean
  subscriptionExpiresAt: string | null
}

function formatDate(str: string | null): string {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatDateTime(str: string | null): string {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const SkeletonRows: React.FC = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {[1, 2, 3, 4, 5].map((j) => (
          <td key={j} className="py-4 pr-4">
            <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${55 + (i * j) % 40}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </>
)

const JellyfinTable: React.FC = () => {
  const [rows, setRows] = useState<JellyfinRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('lastLogin')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/jellyfin', { credentials: 'include' })
        const json = (await res.json()) as { success: boolean; data?: JellyfinRow[]; error?: string }
        if (!cancelled) {
          if (json.success && json.data) setRows(json.data)
          else setError(json.error ?? 'Erreur inconnue')
        }
      } catch {
        if (!cancelled) setError('Impossible de contacter le serveur')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    const base = rows.filter((r) =>
      r.jellyfinName.toLowerCase().includes(search.toLowerCase()) ||
      (r.zflixUsername ?? '').toLowerCase().includes(search.toLowerCase()),
    )
    return [...base].sort((a, b) => {
      let aVal: number = 0
      let bVal: number = 0
      if (sortKey === 'name') {
        return sortDir === 'asc'
          ? a.jellyfinName.localeCompare(b.jellyfinName)
          : b.jellyfinName.localeCompare(a.jellyfinName)
      }
      if (sortKey === 'lastLogin') {
        aVal = a.lastLogin ? new Date(a.lastLogin).getTime() : 0
        bVal = b.lastLogin ? new Date(b.lastLogin).getTime() : 0
      }
      if (sortKey === 'subscription') {
        aVal = a.subscriptionExpiresAt ? new Date(a.subscriptionExpiresAt).getTime() : 0
        bVal = b.subscriptionExpiresAt ? new Date(b.subscriptionExpiresAt).getTime() : 0
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [rows, search, sortKey, sortDir])

  const linked = rows.filter((r) => r.zflixId !== null).length
  const disabled = rows.filter((r) => r.isDisabled).length

  return (
    <div className="space-y-4">
      {/* Mini stats */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Comptes Jellyfin', value: rows.length, color: 'rgba(0,212,255,1)', glow: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.18)' },
            { label: 'Liés à ZFlix', value: linked, color: 'rgba(74,222,128,1)', glow: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.18)' },
            { label: 'Désactivés', value: disabled, color: 'rgba(251,146,60,1)', glow: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.18)' },
          ].map(({ label, value, color, glow, border }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{ background: 'rgba(16,18,50,0.8)', border: `1px solid ${border}`, boxShadow: `0 0 20px ${glow}` }}
            >
              <p className="text-xs font-semibold text-accent-off uppercase tracking-widest mb-1">{label}</p>
              <p className="text-3xl font-black" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recherche */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-off pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="search"
          placeholder="Rechercher un compte Jellyfin…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#E8F4FA] placeholder:text-accent-off/60 focus:outline-none transition-all"
          style={{ background: 'rgba(16,18,50,0.8)', border: '1px solid rgba(0,212,255,0.15)' }}
        />
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
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
                {([
                  { label: 'Compte Jellyfin', sk: 'name' as SortKey },
                  { label: 'Statut', sk: null },
                  { label: 'Lié à ZFlix', sk: null },
                  { label: 'Abonnement', sk: 'subscription' as SortKey },
                  { label: 'Dernière connexion', sk: 'lastLogin' as SortKey },
                ]).map(({ label, sk }) => (
                  <th key={label} className="text-left py-3 pr-4">
                    {sk ? (
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
                    ) : (
                      <span className="text-xs font-semibold text-accent-off uppercase tracking-widest">{label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <p className="text-orange-400 text-sm">{error}</p>
                    <p className="text-accent-off/50 text-xs mt-1">Vérifiez que Jellyfin est accessible</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <p className="text-accent-off text-sm">Aucun compte trouvé</p>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.jellyfinId}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,212,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    {/* Nom Jellyfin */}
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                          style={{
                            background: row.isAdmin ? 'rgba(255,200,40,0.15)' : 'rgba(139,92,246,0.15)',
                            color: row.isAdmin ? 'rgb(255,200,40)' : 'rgb(139,92,246)',
                            border: `1px solid ${row.isAdmin ? 'rgba(255,200,40,0.3)' : 'rgba(139,92,246,0.3)'}`,
                          }}
                        >
                          {row.jellyfinName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#E8F4FA]">{row.jellyfinName}</p>
                          {row.isAdmin && (
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgb(255,200,40)' }}>
                              Admin Jellyfin
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Statut Jellyfin */}
                    <td className="py-3.5 pr-4">
                      {row.isDisabled ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: 'rgba(251,146,60,0.12)', color: 'rgb(251,146,60)', border: '1px solid rgba(251,146,60,0.25)' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                          Désactivé
                        </span>
                      ) : row.canPlayMedia ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: 'rgba(74,222,128,0.12)', color: 'rgb(74,222,128)', border: '1px solid rgba(74,222,128,0.25)' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          Actif
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: 'rgba(110,125,175,0.1)', color: 'rgb(110,125,175)', border: '1px solid rgba(110,125,175,0.2)' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgb(110,125,175)' }} />
                          Limité
                        </span>
                      )}
                    </td>

                    {/* Lien ZFlix */}
                    <td className="py-3.5 pr-4">
                      {row.zflixUsername ? (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgb(0,212,255)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span className="text-sm font-medium" style={{ color: 'rgb(0,212,255)' }}>@{row.zflixUsername}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-accent-off/50 italic">Non lié</span>
                      )}
                    </td>

                    {/* Abonnement ZFlix */}
                    <td className="py-3.5 pr-4">
                      {row.zflixId ? (
                        row.isSubscribed && row.subscriptionExpiresAt ? (
                          <div>
                            <span className="text-sm text-[#E8F4FA]">{formatDate(row.subscriptionExpiresAt)}</span>
                            {new Date(row.subscriptionExpiresAt) < new Date() && (
                              <p className="text-xs text-orange-400 mt-0.5">expiré</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-accent-off/50">Aucun</span>
                        )
                      ) : (
                        <span className="text-xs text-accent-off/30">—</span>
                      )}
                    </td>

                    {/* Dernière connexion */}
                    <td className="py-3.5 pr-4 text-xs text-accent-off/70">
                      {formatDateTime(row.lastLogin)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default JellyfinTable
