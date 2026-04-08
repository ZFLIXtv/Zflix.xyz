'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import type { DashboardUser } from '@/app/dashboard/page'

// ─── Plans ────────────────────────────────────────────────────────────────────

interface Plan {
  id: string
  label: string
  pricePerMonth: string
  total: string
  durationMonths: number
  badge?: string
  badgeVariant?: 'info' | 'success' | 'warning'
}

const PLANS: Plan[] = [
  {
    id: 'monthly',
    label: '1 mois',
    pricePerMonth: '4,99 €',
    total: '4,99 €',
    durationMonths: 1,
  },
  {
    id: 'semiannual',
    label: '6 mois',
    pricePerMonth: '3,99 €',
    total: '23,94 €',
    durationMonths: 6,
    badge: 'Populaire',
    badgeVariant: 'info',
  },
  {
    id: 'annual',
    label: '12 mois',
    pricePerMonth: '2,99 €',
    total: '35,88 €',
    durationMonths: 12,
    badge: 'Meilleure offre',
    badgeVariant: 'success',
  },
]

// ─── Plan Card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: Plan
  selected: boolean
  onSelect: () => void
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={[
      'relative w-full text-left p-4 rounded-xl border transition-all duration-200',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
      selected
        ? 'border-accent bg-accent/5 shadow-[0_0_20px_rgba(189,230,251,0.12)]'
        : 'border-accent/10 bg-dark hover:border-accent/30',
    ].join(' ')}
    aria-pressed={selected}
  >
    {plan.badge && (
      <div className="absolute -top-2.5 right-4">
        <Badge variant={plan.badgeVariant ?? 'info'} size="sm">{plan.badge}</Badge>
      </div>
    )}

    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold text-[#E8F4FA]">{plan.label}</p>
        <p className="text-xs text-accent-off mt-0.5">
          {plan.pricePerMonth}
          {plan.durationMonths > 1 ? '/mois' : ''}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-accent font-[Outfit]">{plan.total}</p>
        {plan.durationMonths > 1 && (
          <p className="text-xs text-accent-off">total</p>
        )}
      </div>
    </div>

    {/* Selected ring indicator */}
    {selected && (
      <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-accent" aria-hidden="true" />
    )}
  </button>
)

// ─── RenewalModal ─────────────────────────────────────────────────────────────

interface RenewalModalProps {
  isOpen: boolean
  onClose: () => void
  user: DashboardUser
}

const RenewalModal: React.FC<RenewalModalProps> = ({ isOpen, onClose, user }) => {
  const router = useRouter()
  const { addToast } = useToast()
  const [selectedPlanId, setSelectedPlanId] = useState<string>('semiannual')
  const [loading, setLoading] = useState(false)

  const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true'

  const handleProceed = async () => {
    if (!stripeEnabled) return

    setLoading(true)

    try {
      const res = await fetch('/api/subscription/renew', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId }),
      })

      const json = (await res.json()) as {
        success: boolean
        data?: { checkoutUrl: string | null }
        error?: string
        stripeDisabled?: boolean
      }

      if (json.success && json.data?.checkoutUrl) {
        router.push(json.data.checkoutUrl)
      } else if (json.stripeDisabled) {
        addToast('Le paiement en ligne sera bientôt disponible.', 'info')
      } else {
        addToast(json.error ?? 'Une erreur est survenue.', 'error')
      }
    } catch {
      addToast('Impossible de contacter le serveur.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Renouveler l'abonnement" size="md">
      <div className="space-y-4">
        {/* User info */}
        <p className="text-sm text-accent-off">
          Renouvellement pour{' '}
          <span className="text-[#E8F4FA] font-medium font-mono">{user.email}</span>
        </p>

        {/* Plan selection */}
        <div className="space-y-3 pt-1">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlanId === plan.id}
              onSelect={() => setSelectedPlanId(plan.id)}
            />
          ))}
        </div>

        {/* Stripe disabled notice */}
        {!stripeEnabled && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-sm text-yellow-400">
              Le paiement en ligne sera bientôt disponible. Contactez-nous pour renouveler manuellement.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="primary"
            onClick={handleProceed}
            loading={loading}
            disabled={!stripeEnabled}
            className="flex-1 justify-center"
          >
            Procéder au paiement
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex-1 justify-center"
          >
            Annuler
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default RenewalModal
