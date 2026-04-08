'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import AccountInfo from '@/components/dashboard/AccountInfo'
import SubscriptionCard from '@/components/dashboard/SubscriptionCard'
import RenewalModal from '@/components/dashboard/RenewalModal'
import ChangePasswordForm from '@/components/dashboard/ChangePasswordForm'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardUser {
  id: string
  username: string
  email: string | null
  isAdmin: boolean
  isSubscribed: boolean
  subscriptionExpiresAt: string | null
  trialUsed: boolean
  referralCode: string | null
  hasPaid: boolean
  jellyfinUsername: string | null
  createdAt: string
}

type TabId = 'compte' | 'renouveler' | 'securite' | 'parrainage'

interface Tab {
  id: TabId
  label: string
}

const TABS: Tab[] = [
  { id: 'compte', label: 'Mon compte' },
  { id: 'renouveler', label: 'Renouveler' },
  { id: 'securite', label: 'Sécurité' },
  { id: 'parrainage', label: 'Parrainage' },
]

// ─── Referral Tab ─────────────────────────────────────────────────────────────

const ReferralTab: React.FC<{ user: DashboardUser; onGoToRenew: () => void }> = ({ user, onGoToRenew }) => {
  const [copied, setCopied] = useState(false)

  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/register?ref=${user.referralCode}`
      : `https://zflix.fr/register?ref=${user.referralCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select input
    }
  }

  if (!user.hasPaid) {
    return (
      <div className="space-y-6">
        <div className="bg-dark-apparent/80 border border-accent/10 rounded-xl p-6 backdrop-blur-md text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/8 border border-accent/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-accent/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-[#E8F4FA] font-[Outfit] mb-2">
            Parrainage réservé aux abonnés
          </h3>
          <p className="text-accent-off text-sm max-w-sm mx-auto">
            Le programme de parrainage est disponible uniquement pour les membres ayant souscrit un abonnement payant.
          </p>
          <button
            type="button"
            onClick={onGoToRenew}
            className="mt-6 px-5 py-2.5 rounded-xl bg-accent text-darkest text-sm font-semibold hover:shadow-[0_0_20px_rgba(189,230,251,0.4)] transition-all duration-200"
          >
            Souscrire un abonnement
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-dark-apparent/80 border border-accent/10 rounded-xl p-6 backdrop-blur-md">
        <h3 className="text-lg font-semibold text-[#E8F4FA] font-[Outfit] mb-1">
          Votre programme de parrainage
        </h3>
        <p className="text-accent-off text-sm mb-6">
          Parrainez vos amis et gagnez 30 jours d&apos;abonnement gratuits pour chaque ami qui s&apos;inscrit via votre lien.
        </p>

        {/* Referral Code */}
        <div className="mb-4">
          <p className="text-xs font-medium text-accent-off uppercase tracking-wider mb-2">
            Votre code de parrainage
          </p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-accent text-xl font-bold tracking-widest">
              {user.referralCode}
            </span>
          </div>
        </div>

        {/* Referral Link */}
        <div>
          <p className="text-xs font-medium text-accent-off uppercase tracking-wider mb-2">
            Lien de parrainage
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-dark border border-accent/20 rounded-xl px-4 py-2.5 text-sm text-accent-off font-mono truncate">
              {referralLink}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={[
                'shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
                'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                copied
                  ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                  : 'bg-accent text-darkest hover:shadow-[0_0_20px_rgba(189,230,251,0.4)]',
              ].join(' ')}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copié !
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copier
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-dark-apparent/80 border border-accent/10 rounded-xl p-5 backdrop-blur-md text-center">
          <p className="text-3xl font-bold text-accent font-[Outfit]">0</p>
          <p className="text-sm text-accent-off mt-1">Amis parrainés</p>
        </div>
        <div className="bg-dark-apparent/80 border border-accent/10 rounded-xl p-5 backdrop-blur-md text-center">
          <p className="text-3xl font-bold text-green-400 font-[Outfit]">0</p>
          <p className="text-sm text-accent-off mt-1">Jours gagnés</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-dark-apparent/80 border border-accent/10 rounded-xl p-6 backdrop-blur-md">
        <h4 className="text-sm font-semibold text-[#E8F4FA] mb-4">Comment ça marche ?</h4>
        <ol className="space-y-3">
          {[
            'Partagez votre lien de parrainage avec vos amis',
            'Votre ami s\'inscrit via votre lien et souscrit un abonnement',
            'Vous recevez automatiquement 30 jours gratuits sur votre compte',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-xs font-bold text-accent">
                {i + 1}
              </span>
              <span className="text-sm text-accent-off">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 w-48 bg-dark-apparent/80 rounded-xl" />
    <div className="h-4 w-32 bg-dark-apparent/80 rounded-xl" />
    <div className="space-y-3">
      <div className="h-24 bg-dark-apparent/80 rounded-xl" />
      <div className="h-24 bg-dark-apparent/80 rounded-xl" />
    </div>
  </div>
)

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('compte')
  const [renewOpen, setRenewOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (!res.ok) {
          router.replace('/login')
          return
        }
        const json = (await res.json()) as { success: boolean; data?: { user: DashboardUser } }
        if (!cancelled && json.success && json.data?.user) {
          setUser(json.data.user)
        } else if (!cancelled) {
          router.replace('/login')
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
      <div className="min-h-screen bg-darkest">
        <Navbar />
        <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-darkest">
      <Navbar />

      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#E8F4FA] font-[Outfit]">Mon espace</h1>
            <p className="text-accent-off mt-1 text-sm">@{user.username}</p>
          </div>
          {user.isAdmin && (
            <a
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 shrink-0"
              style={{
                background: 'rgba(255,200,40,0.12)',
                border: '1px solid rgba(255,200,40,0.3)',
                color: 'rgb(255,200,40)',
                boxShadow: '0 0 16px rgba(255,200,40,0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,200,40,0.22)'
                e.currentTarget.style.boxShadow = '0 0 24px rgba(255,200,40,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,200,40,0.12)'
                e.currentTarget.style.boxShadow = '0 0 16px rgba(255,200,40,0.1)'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Panel Admin
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-accent/10 mb-8">
          <nav className="flex gap-1 sm:gap-0" aria-label="Onglets du tableau de bord">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'px-4 py-3 text-sm font-medium transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-t-lg',
                  activeTab === tab.id
                    ? 'border-b-2 border-accent text-accent'
                    : 'text-accent-off hover:text-white',
                ].join(' ')}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'compte' && <AccountInfo user={user} />}

          {activeTab === 'renouveler' && (
            <>
              <SubscriptionCard user={user} onRenew={() => setRenewOpen(true)} />
              <RenewalModal
                isOpen={renewOpen}
                onClose={() => setRenewOpen(false)}
                user={user}
              />
            </>
          )}

          {activeTab === 'securite' && <ChangePasswordForm />}

          {activeTab === 'parrainage' && <ReferralTab user={user} onGoToRenew={() => setActiveTab('renouveler')} />}
        </div>
      </div>
    </div>
  )
}
