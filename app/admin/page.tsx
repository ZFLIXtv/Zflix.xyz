'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import StatsCards from '@/components/admin/StatsCards'
import MembersTable from '@/components/admin/MembersTable'
import AuditLogTable from '@/components/admin/AuditLogTable'

interface AdminUser {
  id: string
  username: string
  email: string | null
  isAdmin: boolean
}

type ActiveTab = 'members' | 'audit'

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-9 w-64 bg-dark-apparent/80 rounded-xl" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-dark-apparent/80 rounded-xl" />)}
    </div>
    <div className="h-64 bg-dark-apparent/80 rounded-xl" />
  </div>
)

const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'members',
    label: 'Membres',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'audit',
    label: "Journal d'audit",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('members')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (!res.ok) { router.replace('/login'); return }
        const json = (await res.json()) as { success: boolean; data?: { user: AdminUser } }
        if (!cancelled) {
          if (json.success && json.data?.user) {
            if (!json.data.user.isAdmin) { router.replace('/'); return }
            setUser(json.data.user)
          } else {
            router.replace('/login')
          }
        }
      } catch {
        if (!cancelled) router.replace('/login')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void fetchUser()
    return () => { cancelled = true }
  }, [router])

  if (loading) {
    return (
      <div className="relative min-h-screen bg-darkest overflow-hidden">
        <div className="absolute inset-0 grid-lines opacity-60 pointer-events-none" aria-hidden="true" />
        <Navbar />
        <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto relative z-10"><LoadingSkeleton /></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="relative min-h-screen bg-darkest overflow-hidden">
      <div className="absolute inset-0 grid-lines opacity-60 pointer-events-none" aria-hidden="true" />
      <div className="absolute pointer-events-none" style={{ width: 700, height: 700, top: '-15%', left: '-10%', background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 65%)', animation: 'orb-drift 20s ease-in-out infinite' }} aria-hidden="true" />
      <div className="absolute pointer-events-none" style={{ width: 500, height: 500, bottom: '0%', right: '-8%', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)', animation: 'orb-drift 26s ease-in-out infinite reverse' }} aria-hidden="true" />

      <Navbar />

      <div className="relative z-10 pt-24 pb-16 px-4 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold tracking-wide mb-4 border-glow" style={{ background: 'rgba(0,212,255,0.06)', color: 'rgb(var(--accent))' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              Panneau de contrôle
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
              <span className="text-gradient">Administration</span>
              <span className="text-[#E8F4FA]"> ZFlix</span>
            </h1>
            <p className="text-accent-off text-sm mt-2">Gestion des membres et abonnements</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl self-start sm:self-auto" style={{ background: 'rgba(16,18,50,0.8)', border: '1px solid rgba(255,200,40,0.25)', boxShadow: '0 0 20px rgba(255,200,40,0.08)' }}>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-widest" style={{ background: 'rgba(255,200,40,0.15)', color: 'rgb(255,200,40)' }}>Admin</span>
            <span className="text-sm text-[#E8F4FA] font-mono">@{user.username}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-10"><StatsCards /></div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: 'rgba(16,18,50,0.7)', border: '1px solid rgba(0,212,255,0.12)', boxShadow: '0 0 30px rgba(0,212,255,0.04)' }} role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={['flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200', 'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60', activeTab === tab.id ? 'text-accent' : 'text-accent-off hover:text-[#E8F4FA] hover:bg-white/5'].join(' ')}
              style={activeTab === tab.id ? { background: 'rgba(0,212,255,0.12)', boxShadow: '0 0 20px rgba(0,212,255,0.15)' } : {}}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Onglet Membres */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-off pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="search"
                  placeholder="Rechercher par pseudo ou email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#E8F4FA] placeholder:text-accent-off/60 focus:outline-none transition-all"
                  style={{ background: 'rgba(16,18,50,0.8)', border: '1px solid rgba(0,212,255,0.15)' }}
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl px-4 py-2.5 text-sm text-[#E8F4FA] focus:outline-none transition-all cursor-pointer"
                style={{ background: 'rgba(16,18,50,0.8)', border: '1px solid rgba(0,212,255,0.15)' }}
              >
                <option value="all">Tous</option>
                <option value="active">Actifs</option>
                <option value="trial">Essai</option>
                <option value="expired">Expirés</option>
              </select>
            </div>
            <MembersTable searchQuery={searchQuery} filter={filter} />
          </div>
        )}

        {activeTab === 'audit' && <AuditLogTable />}
      </div>
    </div>
  )
}
