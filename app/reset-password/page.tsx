'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ApiResponse {
  success: boolean
  error?: string
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // If a ?token= query param is present, redirect to the path-based page
  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      router.replace(`/reset-password/${tokenParam}`)
    }
  }, [searchParams, router])

  const validate = (): boolean => {
    if (!email.trim()) {
      setEmailError("L'adresse e-mail est requise.")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Adresse e-mail invalide.')
      return false
    }
    setEmailError(undefined)
    return true
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerError(null)

    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = (await res.json()) as ApiResponse

      if (!res.ok && data.error) {
        setServerError(data.error)
        return
      }

      // Always show success to avoid email enumeration
      setSubmitted(true)
    } catch {
      setServerError("Impossible d'envoyer la demande. Vérifiez votre connexion.")
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
            Réinitialiser le mot de passe
          </h1>
          <p className="mt-1 text-sm text-accent-off">
            Entrez votre e-mail pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className="bg-dark-apparent/70 border border-accent/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[#E8F4FA] font-medium">E-mail envoyé</p>
                <p className="text-sm text-accent-off mt-1 leading-relaxed">
                  Si cet email est enregistré, vous recevrez un lien de réinitialisation dans
                  quelques minutes.
                </p>
              </div>
              <Link
                href="/login"
                className="text-sm text-accent hover:underline focus-visible:outline-accent mt-2"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {serverError && (
                <div
                  role="alert"
                  className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                >
                  {serverError}
                </div>
              )}

              <Input
                id="email"
                name="email"
                type="email"
                label="Adresse e-mail"
                placeholder="vous@exemple.fr"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError(undefined)
                }}
                error={emailError}
                autoComplete="email"
                required
                disabled={loading}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full justify-center"
              >
                Envoyer le lien
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-accent-off">
          <Link href="/login" className="text-accent hover:underline focus-visible:outline-accent">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-darkest flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
