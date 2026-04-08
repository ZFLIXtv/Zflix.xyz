'use client'

import React, { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtendModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
  jellyfinId: string | null
  userEmail: string
  onSuccess: () => void
}

// ─── Quick Presets ────────────────────────────────────────────────────────────

const PRESETS = [
  { label: '30 j', days: 30 },
  { label: '90 j', days: 90 },
  { label: '180 j', days: 180 },
  { label: '365 j', days: 365 },
]

// ─── ExtendModal ──────────────────────────────────────────────────────────────

const ExtendModal: React.FC<ExtendModalProps> = ({
  isOpen,
  onClose,
  userId,
  jellyfinId,
  userEmail,
  onSuccess,
}) => {
  const { addToast } = useToast()
  const [days, setDays] = useState<number>(30)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!days || days < 1 || days > 365) {
      setError('Le nombre de jours doit être entre 1 et 365.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/extend', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(userId ? { userId } : {}),
          ...(jellyfinId ? { jellyfinId, jellyfinUsername: userEmail } : {}),
          days,
        }),
      })

      const json = (await res.json()) as { success: boolean; error?: string }

      if (json.success) {
        addToast(`Abonnement de ${userEmail} étendu de ${days} jour${days !== 1 ? 's' : ''}.`, 'success')
        setDays(30)
        setNote('')
        onSuccess()
        onClose()
      } else {
        const msg = json.error ?? 'Une erreur est survenue.'
        setError(msg)
        addToast(msg, 'error')
      }
    } catch {
      const msg = 'Impossible de contacter le serveur.'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setDays(30)
      setNote('')
      setError(null)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Étendre l'abonnement"
      size="md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Target user */}
        <div className="bg-dark/50 rounded-xl p-3">
          <p className="text-xs text-accent-off mb-0.5">Utilisateur</p>
          <p className="text-sm text-[#E8F4FA] font-mono font-medium">{userEmail}</p>
        </div>

        {/* Quick presets */}
        <div>
          <p className="text-sm font-medium text-[#E8F4FA] mb-2">
            Durée rapide
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => setDays(preset.days)}
                className={[
                  'px-3 py-1.5 rounded-lg text-sm font-medium',
                  'transition-all duration-150 focus:outline-none',
                  'focus-visible:ring-2 focus-visible:ring-accent/60',
                  days === preset.days
                    ? 'bg-accent text-darkest'
                    : 'border border-accent/30 text-accent-off hover:border-accent/60 hover:text-accent',
                ].join(' ')}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Days input */}
        <div>
          <label
            htmlFor="extend-days"
            className="text-sm font-medium text-[#E8F4FA] block mb-1.5"
          >
            Nombre de jours
            <span className="ml-1 text-accent" aria-hidden="true">*</span>
          </label>
          <input
            id="extend-days"
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10) || 0)}
            required
            className={[
              'w-full bg-dark-apparent border rounded-xl',
              'px-4 py-2.5 text-sm text-[#E8F4FA]',
              'focus:outline-none transition-all duration-200',
              error
                ? 'border-red-500/60 focus:border-red-500'
                : 'border-accent/20 focus:border-accent focus:shadow-[0_0_10px_rgba(189,230,251,0.15)]',
            ].join(' ')}
          />
          <p className="text-xs text-accent-off mt-1">Entre 1 et 365 jours</p>
        </div>

        {/* Note */}
        <div>
          <label
            htmlFor="extend-note"
            className="text-sm font-medium text-[#E8F4FA] block mb-1.5"
          >
            Note <span className="text-accent-off font-normal">(optionnel)</span>
          </label>
          <textarea
            id="extend-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Raison de l'extension..."
            className={[
              'w-full bg-dark-apparent border border-accent/20 rounded-xl',
              'px-4 py-2.5 text-sm text-[#E8F4FA] placeholder:text-accent-off/60',
              'focus:outline-none focus:border-accent focus:shadow-[0_0_10px_rgba(189,230,251,0.15)]',
              'transition-all duration-200 resize-none',
            ].join(' ')}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 flex items-center gap-1.5">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="flex-1 justify-center"
          >
            Confirmer l&apos;extension
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 justify-center"
          >
            Annuler
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ExtendModal
