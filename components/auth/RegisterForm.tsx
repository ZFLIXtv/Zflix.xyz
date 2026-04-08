'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Input } from '@/components/ui/Input'

interface ApiResponse {
  success: boolean
  error?: string
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (password.length === 0) return { score: 0, label: '', color: '' }
  if (password.length < 8) return { score: 1, label: 'Trop court', color: 'bg-red-500' }

  let score = 1
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score: 2, label: 'Faible', color: 'bg-red-500' }
  if (score <= 3) return { score: 3, label: 'Moyen', color: 'bg-yellow-500' }
  return { score: 4, label: 'Fort', color: 'bg-green-500' }
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

function RegisterFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setReferralCode(ref)
  }, [searchParams])

  const strength = getPasswordStrength(password)

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!username.trim()) {
      errors['username'] = "Le nom d'utilisateur est requis."
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
      errors['username'] = "3 à 20 caractères : lettres, chiffres, underscore uniquement."
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors['email'] = 'Adresse e-mail invalide.'
    }

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
      const body: Record<string, string> = {
        username: username.trim(),
        password,
        confirmPassword,
      }
      if (email.trim()) body['email'] = email.trim().toLowerCase()
      if (referralCode.trim()) body['referralCode'] = referralCode.trim()

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as ApiResponse
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Une erreur est survenue. Veuillez réessayer.')
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Impossible de créer le compte. Vérifiez votre connexion internet.')
    } finally {
      setLoading(false)
    }
  }

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  return (
    <div className="relative min-h-screen bg-darkest flex items-center justify-center px-4 py-12 overflow-hidden">

      {/* Grille de fond */}
      <div className="absolute inset-0 grid-lines opacity-100 pointer-events-none" aria-hidden="true" />

      {/* Orbes ambiants */}
      <div
        className="absolute pointer-events-none animate-orb-drift"
        style={{
          width: 600, height: 600,
          top: '-15%', right: '-12%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 500, height: 500,
          bottom: '-15%', left: '-10%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 65%)',
          animation: 'orb-drift 25s ease-in-out infinite reverse',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 350, height: 350,
          top: '30%', left: '5%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 65%)',
          animation: 'orb-drift 30s ease-in-out infinite',
          animationDelay: '6s',
        }}
        aria-hidden="true"
      />

      {/* Contenu */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Logo + titre */}
        <div className="flex flex-col items-center text-center mb-7 gap-0">
          {/* Pill */}


          <Link
            href="/"
            className="focus-visible:outline-accent rounded inline-block"
          >
            <Image src="/logo01.png" alt="ZFlix" width={90} height={90} className="rounded" priority />
          </Link>
          <div
            className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold tracking-wide border-glow"
            style={{ background: 'rgba(0,212,255,0.06)', color: 'rgb(var(--accent))' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Accès gratuit — sans carte bancaire
          </div>

          <h1 className="mt-4 text-2xl font-black text-[#E8F4FA] tracking-tight">
            Créer un compte
          </h1>
          <p className="mt-1 text-sm text-accent-off">
            Rejoignez{' '}
            <span className="text-accent font-semibold">ZFlix</span>
            {' '}et streamez l'infini
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-4 sm:p-6 backdrop-blur-sm"
          style={{
            background: 'rgba(16,18,50,0.75)',
            border: '1px solid rgba(139,92,246,0.18)',
            boxShadow: '0 0 40px rgba(139,92,246,0.08), 0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {error && (
              <div
                role="alert"
                className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                {error}
              </div>
            )}

            <Input
              id="username"
              name="username"
              type="text"
              label="Nom d'utilisateur"
              placeholder="votre_pseudo"
              value={username}
              onChange={(e) => { setUsername(e.target.value); clearFieldError('username') }}
              error={fieldErrors['username']}
              hint="3 à 20 caractères (lettres, chiffres, _)"
              autoComplete="username"
              required
              disabled={loading}
            />

            <Input
              id="email"
              name="email"
              type="email"
              label="Adresse e-mail (optionnel)"
              placeholder="vous@exemple.fr"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldError('email') }}
              error={fieldErrors['email']}
              hint="Pour la récupération de mot de passe"
              autoComplete="email"
              disabled={loading}
            />

            <div className="flex flex-col gap-2">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Mot de passe"
                placeholder="Min. 8 caractères"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError('password') }}
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

              {password.length > 0 && (
                <div className="flex flex-col gap-1.5" aria-live="polite">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={[
                          'flex-1 rounded-full transition-all duration-300',
                          strength.score >= level ? strength.color : 'bg-dark-highlight',
                        ].join(' ')}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="text-xs text-accent-off">
                      Force :{' '}
                      <span
                        className={
                          strength.score >= 4 ? 'text-green-400'
                          : strength.score >= 3 ? 'text-yellow-400'
                          : 'text-red-400'
                        }
                      >
                        {strength.label}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword') }}
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

            <Input
              id="referralCode"
              name="referralCode"
              type="text"
              label="Code parrain (optionnel)"
              placeholder="Code de parrainage"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              hint="Vous profiterez d'un mois offert si votre parrain en bénéficie"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 mt-2 px-7 py-3.5 rounded-xl font-bold text-base transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                background: 'linear-gradient(135deg, rgb(0,212,255) 0%, rgba(0,150,200,1) 100%)',
                color: '#fff',
                boxShadow: '0 8px 30px rgba(0,212,255,0.25)',
              }}
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              <span className={loading ? 'opacity-80' : ''}>Créer mon compte →</span>
            </button>
          </form>
        </div>

        {/* Garanties */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-5 mt-5">
          {[
            { icon: '✦', label: 'Sans engagement' },
            { icon: '✦', label: 'Annulation libre' },
            { icon: '✦', label: '15 000+ titres' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-accent text-[10px]">{icon}</span>
              <span className="text-accent-off text-[10px]">{label}</span>
            </div>
          ))}
        </div>

        {/* Login link */}
        <p className="mt-5 text-center text-sm text-accent-off">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-accent hover:underline focus-visible:outline-accent font-semibold">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export function RegisterForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-darkest flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    }>
      <RegisterFormInner />
    </Suspense>
  )
}

export default RegisterForm
