'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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

export function LoginForm() {
  const router = useRouter()
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})

  const validate = (): boolean => {
    const errors: { username?: string; password?: string } = {}
    if (!username.trim()) errors.username = "Le nom d'utilisateur est requis."
    if (!password) errors.password = 'Le mot de passe est requis.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = (await res.json()) as ApiResponse
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Une erreur est survenue. Veuillez réessayer.')
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Impossible de se connecter. Vérifiez votre connexion internet.')
    } finally {
      setLoading(false)
    }
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
          top: '-20%', left: '-15%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 500, height: 500,
          bottom: '-20%', right: '-12%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 65%)',
          animation: 'orb-drift 22s ease-in-out infinite reverse',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 300, height: 300,
          top: '40%', right: '20%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 65%)',
          animation: 'orb-drift 28s ease-in-out infinite',
          animationDelay: '4s',
        }}
        aria-hidden="true"
      />

      {/* Contenu */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Logo + titre */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="focus-visible:outline-accent rounded inline-block"
          >
            <Image src="/logo01.png" alt="ZFlix" width={90} height={90} className="rounded" priority />
          </Link>

          <h1 className="mt-5 text-2xl font-black text-[#E8F4FA] tracking-tight">
            Connexion
          </h1>
          <p className="mt-1 text-sm text-accent-off">
            Accédez à votre espace streaming
          </p>
        </div>

        {/* Maintenance */}
        {isMaintenanceMode && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm text-center">
            Connexions temporairement suspendues. Revenez bientôt.
          </div>
        )}

        {/* Card */}
        <div
          className="rounded-2xl p-6 backdrop-blur-sm"
          style={{
            background: 'rgba(16,18,50,0.75)',
            border: '1px solid rgba(0,212,255,0.15)',
            boxShadow: '0 0 40px rgba(0,212,255,0.07), 0 8px 32px rgba(0,0,0,0.4)',
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
              onChange={(e) => {
                setUsername(e.target.value)
                if (fieldErrors.username) setFieldErrors((f) => ({ ...f, username: undefined }))
              }}
              error={fieldErrors.username}
              autoComplete="username"
              required
              disabled={loading || isMaintenanceMode}
            />

            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Mot de passe"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }))
                }}
                error={fieldErrors.password}
                autoComplete="current-password"
                required
                disabled={loading || isMaintenanceMode}
                rightIcon={
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="text-accent-off hover:text-accent transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                }
              />
            </div>

            <div className="flex justify-end -mt-2">
              <Link
                href="/reset-password"
                className="text-xs text-accent-off hover:text-accent transition-colors focus-visible:outline-accent"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              disabled={isMaintenanceMode}
              className="w-full justify-center mt-1"
            >
              Se connecter
            </Button>
          </form>
        </div>

        {/* Stats mini */}
        <div className="flex justify-center gap-3 sm:gap-6 mt-6">
          {[
            { value: '15 000+', label: 'titres' },
            { value: 'HD', label: 'qualité' },
            { value: '100%', label: 'gratuit' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="text-accent font-black text-base leading-none">{value}</span>
              <span className="text-accent-off text-[10px] mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Register link */}
        <p className="mt-5 text-center text-sm text-accent-off">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-accent hover:underline focus-visible:outline-accent font-semibold">
            S'inscrire — accès gratuit
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginForm
