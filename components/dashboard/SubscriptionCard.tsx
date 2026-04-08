'use client'

import React, { useState, useEffect } from 'react'
import type { DashboardUser } from '@/app/dashboard/page'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payment {
  id: string
  amount: number
  durationDays: number
  status: string
  createdAt: string
}

interface SubscriptionStatus {
  isSubscribed: boolean
  subscriptionExpiresAt: string | null
  daysRemaining: number | null
  isExpired: boolean
  payments: Payment[]
}

interface SubscriptionCardProps {
  user: DashboardUser
  onRenew: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €'
}

function planLabel(days: number): string {
  if (days <= 31) return '1 mois'
  if (days <= 92) return '3 mois'
  if (days <= 184) return '6 mois'
  return '12 mois'
}

function statusBadge(status: string) {
  if (status === 'succeeded' || status === 'paid') {
    return <Badge variant="success">Payé</Badge>
  }
  if (status === 'pending') {
    return <Badge variant="warning">En attente</Badge>
  }
  return <Badge variant="danger">{status}</Badge>
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const TableSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-2 mt-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-10 bg-dark/60 rounded-lg" />
    ))}
  </div>
)

// ─── SubscriptionCard ─────────────────────────────────────────────────────────

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ user, onRenew }) => {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true'

  useEffect(() => {
    let cancelled = false

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/subscription/status', { credentials: 'include' })
        const json = (await res.json()) as { success: boolean; data?: SubscriptionStatus; error?: string }
        if (!cancelled) {
          if (json.success && json.data) {
            setStatus(json.data)
          } else {
            setError(json.error ?? 'Erreur lors du chargement')
          }
        }
      } catch {
        if (!cancelled) setError('Impossible de charger les données')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchStatus()
    return () => { cancelled = true }
  }, [])

  const now = new Date()
  const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const isActive = user.isSubscribed && (expiresAt === null || expiresAt > now)
  const isTrial = isActive && !user.hasPaid && (expiresAt === null || expiresAt <= oneMonthFromNow)

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="bg-dark-apparent/80 border border-accent/10 rounded-xl p-6 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#E8F4FA] font-[Outfit] mb-1">
              Abonnement
            </h3>
            <div className="flex items-center gap-2">
              {isActive ? (
                isTrial ? (
                  <Badge variant="info">Période d&apos;essai</Badge>
                ) : (
                  <Badge variant="success">Abonnement actif</Badge>
                )
              ) : (
                <Badge variant="danger">Expiré / Inactif</Badge>
              )}
            </div>
          </div>

          {/* Days remaining — big number */}
          {status?.daysRemaining !== null && status?.daysRemaining !== undefined && (
            <div className="text-right">
              <p className="text-4xl font-bold text-accent font-[Outfit] leading-none">
                {status.daysRemaining}
              </p>
              <p className="text-xs text-accent-off mt-1">jours restants</p>
            </div>
          )}
        </div>

        {/* Dates */}
        {user.subscriptionExpiresAt && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-dark/50 rounded-xl p-4">
              <p className="text-xs text-accent-off uppercase tracking-wider mb-1">Début</p>
              <p className="text-sm text-[#E8F4FA] font-medium">{formatDateFr(user.createdAt)}</p>
            </div>
            <div className="bg-dark/50 rounded-xl p-4">
              <p className="text-xs text-accent-off uppercase tracking-wider mb-1">Fin</p>
              <p className="text-sm text-[#E8F4FA] font-medium">
                {formatDateFr(user.subscriptionExpiresAt)}
              </p>
            </div>
          </div>
        )}

        {/* Renew Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button
            variant="primary"
            onClick={onRenew}
            disabled={!stripeEnabled}
          >
            Renouveler
          </Button>
          {!stripeEnabled && (
            <p className="text-xs text-accent-off">
              Paiement bientôt disponible
            </p>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-dark-apparent/80 border border-accent/10 rounded-xl p-6 backdrop-blur-md">
        <h3 className="text-lg font-semibold text-[#E8F4FA] font-[Outfit] mb-4">
          Historique des paiements
        </h3>

        {loading && <TableSkeleton />}

        {!loading && error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && status && status.payments.length === 0 && (
          <p className="text-sm text-accent-off">Aucun paiement enregistré.</p>
        )}

        {!loading && !error && status && status.payments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-accent-off uppercase tracking-wider border-b border-accent/10">
                  <th className="text-left py-3 pr-4">Date</th>
                  <th className="text-left py-3 pr-4">Plan</th>
                  <th className="text-left py-3 pr-4">Montant</th>
                  <th className="text-left py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {status.payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-accent/5 last:border-0 hover:bg-dark/30 transition-colors"
                  >
                    <td className="py-3 pr-4 text-accent-off">
                      {formatDateFr(payment.createdAt)}
                    </td>
                    <td className="py-3 pr-4 text-[#E8F4FA]">
                      {planLabel(payment.durationDays)}
                    </td>
                    <td className="py-3 pr-4 text-[#E8F4FA] font-medium">
                      {formatAmount(payment.amount)}
                    </td>
                    <td className="py-3">
                      {statusBadge(payment.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default SubscriptionCard
