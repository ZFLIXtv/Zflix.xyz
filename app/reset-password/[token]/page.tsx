'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ApiResponse {
  success: boolean
  error?: string
}

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

export default function ResetPasswordTokenPage() {
  const router = useRouter()
  const params = useParams<{ token: string }>()
  const token = params.token

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const [success, setSuccess] = useState(false)

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (password.length < 8) {
      errors['password'] = 'Le mot de passe doit contenir au moins 8 caractères.'
    }

    if (confirmPassword !== password) {
      errors['confirmPassword'] = 'Les mots de passe ne correspondent pas.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password, confirmPassword }),
      })

      const data = (await res.json()) as ApiResponse

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Lien invalide ou expiré. Veuillez faire une nouvelle demande.')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setError('Impossible de réinitialiser le mot de passe. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-darkest flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="font-[Outfit] font-bold text-3xl text-accent inline-block focus-visible:outline-accent rounded"
          >
            ZFlix
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-[#E8F4FA] font-[Outfit]">
            Nouveau mot de passe
          </h1>
          <p className="mt-1 text-sm text-accent-off">
            Choisissez un mot de passe sécurisé pour votre compte
          </p>
        </div>

        <div className="bg-dark-apparent/70 border border-accent/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          {success ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[#E8F4FA] font-medium">Mot de passe mis à jour</p>
                <p className="text-sm text-accent-off mt-1">
                  Redirection vers la connexion dans quelques secondes…
                </p>
              </div>
              <Link href="/login" className="text-sm text-accent hover:underline">
                Se connecter maintenant
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {error && (
                <div role="alert" className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Nouveau mot de passe"
                placeholder="Min. 8 caractères"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })) }}
                error={fieldErrors['password']}
                autoComplete="new-password"
                required
                disabled={loading}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                    className="text-accent-off hover:text-accent transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                }
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                label="Confirmer le mot de passe"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: undefined })) }}
                error={fieldErrors['confirmPassword']}
                autoComplete="new-password"
                required
                disabled={loading}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                    className="text-accent-off hover:text-accent transition-colors focus:outline-none"
                  >
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full justify-center"
              >
                Enregistrer le mot de passe
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-accent-off">
          <Link href="/reset-password" className="text-accent hover:underline focus-visible:outline-accent">
            ← Nouvelle demande de réinitialisation
          </Link>
        </p>
      </div>
    </div>
  )
}
