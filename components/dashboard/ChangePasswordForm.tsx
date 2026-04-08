'use client'

import React, { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

// ─── Password Strength ────────────────────────────────────────────────────────

interface StrengthLevel {
  score: number
  label: string
  color: string
  barColor: string
}

function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return { score: 0, label: '', color: '', barColor: '' }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: 'Très faible', color: 'text-red-400', barColor: 'bg-red-500' }
  if (score === 2) return { score: 2, label: 'Faible', color: 'text-orange-400', barColor: 'bg-orange-500' }
  if (score === 3) return { score: 3, label: 'Moyen', color: 'text-yellow-400', barColor: 'bg-yellow-500' }
  if (score === 4) return { score: 4, label: 'Fort', color: 'text-green-400', barColor: 'bg-green-500' }
  return { score: 5, label: 'Très fort', color: 'text-emerald-400', barColor: 'bg-emerald-500' }
}

// ─── Eye Icon ─────────────────────────────────────────────────────────────────

const EyeIcon: React.FC<{ visible: boolean; onClick: () => void }> = ({ visible, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-accent-off hover:text-accent transition-colors focus:outline-none"
    aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
  >
    {visible ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )}
  </button>
)

// ─── ChangePasswordForm ───────────────────────────────────────────────────────

const ChangePasswordForm: React.FC = () => {
  const { addToast } = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<'current' | 'new' | 'confirm' | 'form', string>>>({})

  const strength = getPasswordStrength(newPassword)

  const validate = (): boolean => {
    const errs: typeof errors = {}
    if (!currentPassword) errs.current = 'Mot de passe actuel requis'
    if (!newPassword) errs.new = 'Nouveau mot de passe requis'
    else if (newPassword.length < 8) errs.new = 'Minimum 8 caractères'
    if (!confirmPassword) errs.confirm = 'Confirmation requise'
    else if (newPassword !== confirmPassword) errs.confirm = 'Les mots de passe ne correspondent pas'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const json = (await res.json()) as { success: boolean; error?: string }

      if (json.success) {
        addToast('Mot de passe modifié avec succès.', 'success')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setErrors({ form: json.error ?? 'Une erreur est survenue.' })
        addToast(json.error ?? 'Erreur lors du changement de mot de passe.', 'error')
      }
    } catch {
      const msg = 'Impossible de contacter le serveur.'
      setErrors({ form: msg })
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-dark-apparent/80 border border-accent/10 rounded-xl p-6 backdrop-blur-md max-w-lg">
      <h3 className="text-lg font-semibold text-[#E8F4FA] font-[Outfit] mb-1">
        Changer le mot de passe
      </h3>
      <p className="text-sm text-accent-off mb-6">
        Choisissez un mot de passe fort d&apos;au moins 8 caractères.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Current password */}
        <Input
          label="Mot de passe actuel"
          id="current-password"
          name="currentPassword"
          type={showCurrent ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={errors.current}
          autoComplete="current-password"
          required
          rightIcon={
            <EyeIcon visible={showCurrent} onClick={() => setShowCurrent((v) => !v)} />
          }
        />

        {/* New password */}
        <div>
          <Input
            label="Nouveau mot de passe"
            id="new-password"
            name="newPassword"
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={errors.new}
            autoComplete="new-password"
            required
            rightIcon={
              <EyeIcon visible={showNew} onClick={() => setShowNew((v) => !v)} />
            }
          />

          {/* Strength indicator */}
          {newPassword && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={[
                      'flex-1 h-1 rounded-full transition-all duration-300',
                      i <= strength.score ? strength.barColor : 'bg-dark',
                    ].join(' ')}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${strength.color}`}>{strength.label}</p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <Input
          label="Confirmer le nouveau mot de passe"
          id="confirm-password"
          name="confirmPassword"
          type={showConfirm ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirm}
          autoComplete="new-password"
          required
          rightIcon={
            <EyeIcon visible={showConfirm} onClick={() => setShowConfirm((v) => !v)} />
          }
        />

        {/* Form-level error */}
        {errors.form && (
          <p className="text-sm text-red-400 flex items-center gap-1.5">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.form}
          </p>
        )}

        <Button type="submit" variant="primary" loading={loading}>
          Changer le mot de passe
        </Button>
      </form>
    </div>
  )
}

export default ChangePasswordForm
