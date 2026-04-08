import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Maintenance — ZFlix',
  description: 'ZFlix est temporairement en maintenance.',
}

const WrenchIcon = () => (
  <svg
    className="w-10 h-10 text-accent-off"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
)

export default function MaintenancePage() {
  // In a server component we can check env directly
  const isAdmin = process.env.NEXT_PUBLIC_ADMIN_HINT === 'true'

  return (
    <div className="min-h-screen bg-darkest flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="font-[Outfit] font-bold text-3xl text-accent focus-visible:outline-accent rounded"
        >
          ZFlix
        </Link>

        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-dark-apparent/80 border border-accent/15 flex items-center justify-center">
          <WrenchIcon />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3">
          <h1 className="font-[Outfit] font-bold text-2xl sm:text-3xl text-[#E8F4FA]">
            Maintenance en cours
          </h1>
          <p className="text-accent-off text-sm leading-relaxed max-w-sm mx-auto">
            Notre équipe travaille pour améliorer votre expérience.
            Nous serons de retour très bientôt.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          <span className="text-xs text-accent-off">En cours de mise à jour…</span>
        </div>

        {/* Admin link */}
        {isAdmin && (
          <Link
            href="/admin"
            className="text-xs text-accent-off/60 hover:text-accent transition-colors underline underline-offset-2 focus-visible:outline-accent"
          >
            Accès administration →
          </Link>
        )}

        {/* Decorative elements */}
        <div className="flex gap-2 mt-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent/30 animate-pulse"
              style={{ animationDelay: `${i * 300}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
