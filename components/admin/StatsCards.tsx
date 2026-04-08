'use client'

import React, { useState, useEffect } from 'react'

interface Stats {
  total: number
  active: number
  trial: number
  expired: number
}

interface StatCardProps {
  label: string
  value: number | null
  total: number | null
  loading: boolean
  accentColor: string
  glowColor: string
  borderColor: string
  icon: React.ReactNode
  sublabel: string
}

const StatCard: React.FC<StatCardProps> = ({
  label, value, total, loading, accentColor, glowColor, borderColor, icon, sublabel,
}) => {
  const pct = total && value !== null && total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: 'rgba(16,18,50,0.8)',
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 30px ${glowColor}, 0 4px 20px rgba(0,0,0,0.3)`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Orbe décoratif en fond */}
      <div
        className="absolute -top-6 -right-6 rounded-full pointer-events-none"
        style={{ width: 100, height: 100, background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-accent-off uppercase tracking-widest mb-3">{label}</p>
          {loading ? (
            <div className="h-10 w-20 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <p className="text-4xl font-black leading-none" style={{ color: accentColor }}>
              {value ?? '—'}
            </p>
          )}
          <p className="text-xs text-accent-off/70 mt-1.5">{sublabel}</p>
        </div>
        <div
          className="shrink-0 p-2.5 rounded-xl"
          style={{ background: `${glowColor}`, color: accentColor }}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      {/* Barre de progression */}
      {!loading && total !== null && total > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-accent-off/60 uppercase tracking-wider">Part du total</span>
            <span className="text-[10px] font-bold" style={{ color: accentColor }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${accentColor}88, ${accentColor})`,
                boxShadow: `0 0 8px ${accentColor}66`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const StatsCards: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/admin/members?stats=true', { credentials: 'include' })
        const json = (await res.json()) as { success: boolean; data?: Stats }
        if (!cancelled && json.success && json.data) setStats(json.data)
      } catch { /* unavailable */ } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void fetch_()
    return () => { cancelled = true }
  }, [])

  const cards: Omit<StatCardProps, 'total' | 'loading'>[] = [
    {
      label: 'Total membres',
      value: stats?.total ?? null,
      accentColor: 'rgb(0,212,255)',
      glowColor: 'rgba(0,212,255,0.12)',
      borderColor: 'rgba(0,212,255,0.18)',
      icon: <UsersIcon />,
      sublabel: 'comptes enregistrés',
    },
    {
      label: 'Abonnés actifs',
      value: stats?.active ?? null,
      accentColor: 'rgb(74,222,128)',
      glowColor: 'rgba(74,222,128,0.12)',
      borderColor: 'rgba(74,222,128,0.18)',
      icon: <CheckIcon />,
      sublabel: 'abonnements en cours',
    },
    {
      label: 'Essais en cours',
      value: stats?.trial ?? null,
      accentColor: 'rgb(56,189,248)',
      glowColor: 'rgba(56,189,248,0.12)',
      borderColor: 'rgba(56,189,248,0.18)',
      icon: <ClockIcon />,
      sublabel: 'période d\'essai active',
    },
    {
      label: 'Accès expirés',
      value: stats?.expired ?? null,
      accentColor: 'rgb(251,146,60)',
      glowColor: 'rgba(251,146,60,0.12)',
      borderColor: 'rgba(251,146,60,0.18)',
      icon: <XIcon />,
      sublabel: 'sans abonnement valide',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          {...card}
          total={stats?.total ?? null}
          loading={loading}
        />
      ))}
    </div>
  )
}

export default StatsCards
