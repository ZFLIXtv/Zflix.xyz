'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'

/* ── Data ────────────────────────────────────────────────────────────────── */
interface Plan {
  id: string
  name: string
  tagline: string
  pricePerMonth: number
  total: number
  totalFormatted: string
  savingsPercent: number | null
  savingsAmount: number | null
  badgeText: string | null
  badgeStyle: 'gold' | 'purple' | 'coming' | null
  theme: 'cyan' | 'purple' | 'gold'
  featured: boolean
  comingSoon: boolean
  ctaText: string
}

const plans: Plan[] = [
  {
    id: '1month',
    name: '1 Mois',
    tagline: 'Accès flexible',
    pricePerMonth: 12,
    total: 12,
    totalFormatted: '12,00 €',
    savingsPercent: null,
    savingsAmount: null,
    badgeText: '🔜 Bientôt disponible',
    badgeStyle: 'coming',
    theme: 'cyan',
    featured: false,
    comingSoon: true,
    ctaText: 'Bientôt disponible',
  },
  {
    id: '6months',
    name: '6 Mois',
    tagline: 'Conseillé',
    pricePerMonth: 11,
    total: 66,
    totalFormatted: '66,00 €',
    savingsPercent: 8,
    savingsAmount: 6,
    badgeText: '⭐ Conseillé',
    badgeStyle: 'purple',
    theme: 'purple',
    featured: true,
    comingSoon: true,
    ctaText: 'Bientôt disponible',
  },
  {
    id: '12months',
    name: '12 Mois',
    tagline: 'Meilleure valeur',
    pricePerMonth: 10,
    total: 120,
    totalFormatted: '120,00 €',
    savingsPercent: 17,
    savingsAmount: 24,
    badgeText: '🔜 Bientôt disponible',
    badgeStyle: 'gold',
    theme: 'gold',
    featured: false,
    comingSoon: true,
    ctaText: 'Bientôt disponible',
  },
]

const features = [
  { icon: '🎬', text: 'Accès illimité en HD' },
  { icon: '📱', text: 'Multi-appareils (mobile, TV, PC)' },
  { icon: '⚡', text: 'Streaming sans publicité' },
  { icon: '🎭', text: '15 000+ titres (films, séries, animés)' },
  { icon: '🎧', text: 'Support prioritaire 7j/7' },
]

const trustBadges = [
  { icon: '🎁', text: 'Inscription gratuite' },
  { icon: '↩', text: 'Résiliation sans frais' },
  { icon: '✅', text: 'Sans engagement mensuel' },
  { icon: '🔜', text: 'Paiement bientôt disponible' },
]

/* ── Thème par plan ──────────────────────────────────────────────────────── */
const themeConfig = {
  cyan: {
    accent:  'rgb(var(--accent))',
    border:  'rgba(0,212,255,0.25)',
    glow:    '0 0 30px rgba(0,212,255,0.12)',
    badge:   { bg: 'rgba(0,212,255,0.12)', color: 'rgb(var(--accent))', border: 'rgba(0,212,255,0.25)' },
    savings: { bg: 'rgba(0,212,255,0.12)', color: 'rgb(var(--accent))' },
    btn:     'secondary' as const,
    bgCard:  'rgba(13,18,36,0.9)',
  },
  purple: {
    accent:  'rgb(var(--accent-purple))',
    border:  'rgba(139,92,246,0.35)',
    glow:    '0 0 40px rgba(139,92,246,0.18)',
    badge:   { bg: 'rgba(139,92,246,0.15)', color: 'rgb(var(--accent-purple))', border: 'rgba(139,92,246,0.35)' },
    savings: { bg: 'rgba(139,92,246,0.15)', color: 'rgb(var(--accent-purple))' },
    btn:     'secondary' as const,
    bgCard:  'rgba(13,18,36,0.9)',
  },
  gold: {
    accent:  'rgb(var(--accent-gold))',
    border:  'rgba(251,191,36,0.45)',
    glow:    '0 0 50px rgba(251,191,36,0.2), 0 0 120px rgba(251,191,36,0.08)',
    badge:   { bg: 'rgba(251,191,36,0.15)', color: 'rgb(var(--accent-gold))', border: 'rgba(251,191,36,0.4)' },
    savings: { bg: 'rgba(251,191,36,0.15)', color: 'rgb(var(--accent-gold))' },
    btn:     'primary' as const,
    bgCard:  'linear-gradient(135deg, rgba(13,18,36,0.95) 0%, rgba(20,16,6,0.95) 100%)',
  },
}

const badgeStyles = {
  gold: {
    bg: 'rgba(251,191,36,0.15)',
    color: 'rgb(var(--accent-gold))',
    border: 'rgba(251,191,36,0.4)',
    shadow: 'rgba(251,191,36,0.3)',
  },
  purple: {
    bg: 'rgba(139,92,246,0.15)',
    color: 'rgb(var(--accent-purple))',
    border: 'rgba(139,92,246,0.35)',
    shadow: 'rgba(139,92,246,0.25)',
  },
  coming: {
    bg: 'rgba(100,116,139,0.15)',
    color: 'rgb(148,163,184)',
    border: 'rgba(100,116,139,0.3)',
    shadow: 'rgba(100,116,139,0.15)',
  },
}

/* ── Composant carte ─────────────────────────────────────────────────────── */
function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const cfg = themeConfig[plan.theme]

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const badge = plan.badgeStyle ? badgeStyles[plan.badgeStyle] : null

  return (
    <div
      ref={ref}
      className={['relative flex flex-col transition-all duration-700', plan.featured ? 'z-10' : ''].join(' ')}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? plan.featured ? 'translateY(-12px)' : 'translateY(0)'
          : 'translateY(32px)',
        transitionDelay: `${index * 120}ms`,
      }}
    >
      {/* Badge flottant */}
      {plan.badgeText && badge && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
          style={{
            background: badge.bg,
            color: badge.color,
            border: `1px solid ${badge.border}`,
            boxShadow: `0 0 20px ${badge.shadow}`,
          }}
        >
          {plan.badgeText}
        </div>
      )}

      {/* Carte */}
      <div
        className={['flex-1 rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden', plan.comingSoon ? 'opacity-75' : ''].join(' ')}
        style={{
          background: plan.theme === 'purple'
            ? 'linear-gradient(145deg, rgba(16,12,28,0.98) 0%, rgba(13,18,36,0.98) 100%)'
            : plan.theme === 'gold'
            ? 'linear-gradient(145deg, rgba(20,16,8,0.98) 0%, rgba(13,18,36,0.98) 100%)'
            : 'rgba(13,18,36,0.95)',
          border: `1px solid ${cfg.border}`,
          boxShadow: plan.featured
            ? `${cfg.glow}, 0 24px 64px rgba(0,0,0,0.5)`
            : '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        {/* Orbe décoratif */}
        {plan.featured && (
          <div
            className="absolute -top-20 -right-20 rounded-full blur-3xl pointer-events-none"
            style={{
              width: 200,
              height: 200,
              background: `radial-gradient(circle, ${cfg.badge.bg} 0%, transparent 70%)`,
            }}
            aria-hidden="true"
          />
        )}

        {/* En-tête plan */}
        <div>
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-black text-2xl text-white">{plan.name}</h3>
            {plan.savingsPercent && (
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-bold ml-2 shrink-0"
                style={cfg.savings}
              >
                −{plan.savingsPercent}%
              </span>
            )}
          </div>
          <p className="text-sm text-accent-off">{plan.tagline}</p>
        </div>

        {/* Prix */}
        <div className="flex items-end gap-1.5">
          <span
            className="font-black text-4xl leading-none"
            style={{ color: plan.comingSoon ? 'rgba(255,255,255,0.4)' : cfg.accent }}
          >
            {plan.pricePerMonth.toFixed(2).replace('.', ',')} €
          </span>
          <div className="flex flex-col mb-1">
            <span className="text-accent-off text-sm">/mois</span>
          </div>
        </div>

        {/* Montant total */}
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-accent-off">Facturé en une fois</span>
          <span className="font-bold text-white">{plan.totalFormatted}</span>
        </div>

        {/* Économies */}
        {plan.savingsAmount && (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ background: cfg.savings.bg, color: cfg.savings.color }}
          >
            <span>✨</span>
            <span>Économisez {plan.savingsAmount} € vs mensuel</span>
          </div>
        )}

        {/* Features */}
        <ul className="flex flex-col gap-3 flex-1">
          {features.map((f) => (
            <li key={f.text} className="flex items-center gap-3 text-sm text-accent-off">
              <span className="text-base leading-none">{f.icon}</span>
              <span>{f.text}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-auto pt-2">
          {plan.comingSoon ? (
            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center opacity-40 cursor-not-allowed"
              disabled
            >
              🔜 Bientôt disponible
            </Button>
          ) : (
            <a
              href="/register"
              className="block w-full py-3.5 rounded-xl text-center font-bold text-base transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgba(0,150,200,1) 100%)',
                color: '#fff',
                boxShadow: '0 8px 30px rgba(0,212,255,0.25)',
              }}
            >
              S&apos;inscrire →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Section Pricing ─────────────────────────────────────────────────────── */
interface PricingSectionProps { id?: string }

export function PricingSection({ id }: PricingSectionProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerVisible, setHeaderVisible] = useState(false)

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setHeaderVisible(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      id={id}
      className="relative py-24 md:py-36 overflow-hidden"
      aria-labelledby="tarifs-heading"
      style={{ background: 'linear-gradient(180deg, rgb(var(--darkest)) 0%, rgba(8,6,18,1) 50%, rgb(var(--darkest)) 100%)' }}
    >
      {/* Fond décoratif */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 grid-lines opacity-60 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">

        {/* En-tête */}
        <div
          ref={headerRef}
          className="text-center mb-6 transition-all duration-700"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 tracking-widest uppercase"
            style={{ background: 'rgba(139,92,246,0.12)', color: 'rgb(var(--accent-purple))', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            💎 Abonnements
          </div>

          <h2 id="tarifs-heading" className="font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 leading-tight">
            Choisissez votre{' '}
            <span className="text-gradient-purple">abonnement</span>
          </h2>
          <p className="text-accent-off text-lg max-w-xl mx-auto">
            L&apos;inscription est{' '}
            <span className="text-accent font-semibold">entièrement gratuite</span>{' '}
            — aucune carte bancaire requise.
          </p>
        </div>

        {/* Grille plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6 mt-16 items-start max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} index={i} />
          ))}
        </div>

        {/* Bloc inscription gratuite */}
        <div
          className="mt-12 max-w-2xl mx-auto rounded-2xl p-5 sm:p-8 text-center relative overflow-hidden transition-all duration-700"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.07) 0%, rgba(0,180,220,0.04) 100%)',
            border: '1px solid rgba(0,212,255,0.2)',
            boxShadow: '0 0 40px rgba(0,212,255,0.06)',
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: '300ms',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.05) 0%, transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 tracking-wide"
              style={{ background: 'rgba(0,212,255,0.1)', color: 'rgb(var(--accent))', border: '1px solid rgba(0,212,255,0.25)' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              Disponible maintenant
            </div>
            <h3 className="font-black text-2xl md:text-3xl text-white mb-2">
              Inscription gratuite{' '}
              <span className="text-gradient">pour l&apos;instant !</span>
            </h3>
            <p className="text-accent-off mb-6 max-w-md mx-auto">
              Les abonnements payants arrivent bientôt. En attendant, créez votre compte gratuitement et profitez de l&apos;accès complet dès aujourd&apos;hui.
            </p>
            <a
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgba(0,150,200,1) 100%)',
                color: '#fff',
                boxShadow: '0 8px 30px rgba(0,212,255,0.25)',
              }}
            >
              Créer mon compte gratuitement →
            </a>
          </div>
        </div>

        {/* Trust badges */}
        <div
          className="mt-14 flex flex-wrap justify-center gap-4 md:gap-8 transition-all duration-700"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(16px)',
            transitionDelay: '400ms',
          }}
        >
          {trustBadges.map((b) => (
            <div key={b.text} className="flex items-center gap-2 text-sm text-accent-off">
              <span className="text-base">{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>

        {/* Bannière "Pas encore convaincu" — désactivée jusqu'à l'intégration des paiements */}
        {/* <div
          className="mt-14 rounded-2xl p-8 md:p-10 text-center relative overflow-hidden transition-all duration-700"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(139,92,246,0.08) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            opacity: headerVisible ? 1 : 0,
            transitionDelay: '500ms',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(0,212,255,0.04) 0%, transparent 70%)' }}
            aria-hidden="true"
          />
          <h3 className="font-black text-2xl text-white mb-2">
            Pas encore convaincu ?
          </h3>
          <p className="text-accent-off mb-6 max-w-md mx-auto">
            Créez votre compte ZFlix gratuitement dès maintenant. Aucune carte bancaire requise.
            Les abonnements payants arrivent bientôt.
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgba(0,150,200,1) 100%)',
              color: '#fff',
              boxShadow: '0 8px 30px rgba(0,212,255,0.25)',
            }}
          >
            Créer mon compte gratuitement →
          </a>
        </div> */}
      </div>
    </section>
  )
}

export default PricingSection
