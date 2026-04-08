'use client'

import React, { useEffect, useRef, useState } from 'react'

/* ── Données affiches ────────────────────────────────────────────────────── */
interface Poster {
  title: string
  genre: string
  year: number
  rating: string
  bg: string
  orb: string
  accentColor: string
  shape: 'circle' | 'triangle' | 'rect' | 'cross'
}

const posters: Poster[] = [
  {
    title: 'NEXUS',      genre: 'Sci-Fi',       year: 2024, rating: '9.2',
    bg: 'linear-gradient(160deg, #05071c 0%, #0c0a28 60%, #070e1e 100%)',
    orb: 'rgba(0,212,255,0.3)', accentColor: '#00d4ff', shape: 'circle',
  },
  {
    title: 'BLACKOUT',   genre: 'Thriller',     year: 2024, rating: '8.7',
    bg: 'linear-gradient(160deg, #180404 0%, #220606 60%, #0c0808 100%)',
    orb: 'rgba(236,72,153,0.3)', accentColor: '#ec4899', shape: 'rect',
  },
  {
    title: 'STEEL',      genre: 'Action',       year: 2023, rating: '8.4',
    bg: 'linear-gradient(160deg, #060e1e 0%, #0e1e36 60%, #081428 100%)',
    orb: 'rgba(59,130,246,0.3)', accentColor: '#3b82f6', shape: 'triangle',
  },
  {
    title: 'CIPHER',     genre: 'Crime',        year: 2024, rating: '8.9',
    bg: 'linear-gradient(160deg, #0e0c02 0%, #1e1800 60%, #0c0a02 100%)',
    orb: 'rgba(251,191,36,0.3)', accentColor: '#fbbf24', shape: 'cross',
  },
  {
    title: 'VOID',       genre: 'Horreur',      year: 2023, rating: '8.1',
    bg: 'linear-gradient(160deg, #0c0008 0%, #180014 60%, #0a0008 100%)',
    orb: 'rgba(139,92,246,0.3)', accentColor: '#8b5cf6', shape: 'circle',
  },
  {
    title: 'SOLEIL',     genre: 'Drame',        year: 2024, rating: '9.0',
    bg: 'linear-gradient(160deg, #120a00 0%, #201200 60%, #0e0800 100%)',
    orb: 'rgba(249,115,22,0.3)', accentColor: '#f97316', shape: 'rect',
  },
  {
    title: 'AURORA',     genre: 'Aventure',     year: 2023, rating: '8.6',
    bg: 'linear-gradient(160deg, #060e14 0%, #0a1a20 60%, #061018 100%)',
    orb: 'rgba(16,185,129,0.3)', accentColor: '#10b981', shape: 'triangle',
  },
  {
    title: 'PRISME',     genre: 'Comédie',      year: 2024, rating: '8.3',
    bg: 'linear-gradient(160deg, #140614 0%, #200a20 60%, #100610 100%)',
    orb: 'rgba(236,72,153,0.25)', accentColor: '#ec4899', shape: 'cross',
  },
  {
    title: 'TITAN',      genre: 'Action',       year: 2023, rating: '8.8',
    bg: 'linear-gradient(160deg, #060e06 0%, #0c1a0c 60%, #060e06 100%)',
    orb: 'rgba(34,197,94,0.3)', accentColor: '#22c55e', shape: 'circle',
  },
  {
    title: 'NOVA',       genre: 'Romance',      year: 2024, rating: '8.5',
    bg: 'linear-gradient(160deg, #140810 0%, #200e1c 60%, #100610 100%)',
    orb: 'rgba(244,114,182,0.3)', accentColor: '#f472b6', shape: 'rect',
  },
  {
    title: 'FANTÔME',    genre: 'Horreur',      year: 2023, rating: '8.2',
    bg: 'linear-gradient(160deg, #080812 0%, #10101e 60%, #08080e 100%)',
    orb: 'rgba(99,102,241,0.3)', accentColor: '#6366f1', shape: 'triangle',
  },
  {
    title: 'HORIZON',    genre: 'Sci-Fi',       year: 2024, rating: '9.1',
    bg: 'linear-gradient(160deg, #040e18 0%, #081824 60%, #040c14 100%)',
    orb: 'rgba(6,182,212,0.3)', accentColor: '#06b6d4', shape: 'cross',
  },
]

/* ── Formes décoratives dans les affiches ─────────────────────────────────── */
function PosterShape({ shape, color }: { shape: Poster['shape']; color: string }) {
  const style = { fill: 'none', stroke: color, strokeWidth: 1.5, opacity: 0.4 }

  if (shape === 'circle')
    return (
      <svg className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-16 h-16 opacity-30" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="26" {...style} />
        <circle cx="32" cy="32" r="14" {...style} opacity={0.2} />
      </svg>
    )

  if (shape === 'rect')
    return (
      <svg className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-14 h-14 opacity-30" viewBox="0 0 56 56" aria-hidden="true">
        <rect x="8" y="8" width="40" height="40" rx="4" {...style} transform="rotate(15 28 28)" />
      </svg>
    )

  if (shape === 'triangle')
    return (
      <svg className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-16 h-16 opacity-30" viewBox="0 0 64 64" aria-hidden="true">
        <polygon points="32,6 58,56 6,56" {...style} />
      </svg>
    )

  return (
    <svg className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-14 h-14 opacity-30" viewBox="0 0 56 56" aria-hidden="true">
      <line x1="28" y1="4" x2="28" y2="52" {...style} />
      <line x1="4" y1="28" x2="52" y2="28" {...style} />
    </svg>
  )
}

/* ── Carte affiche ───────────────────────────────────────────────────────── */
function PosterCard({ poster, delay }: { poster: Poster; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.05 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="poster-card group cursor-pointer"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, box-shadow 0.35s ease`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.7), 0 0 20px ${poster.orb}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)'
      }}
    >
      {/* Fond poster */}
      <div className="absolute inset-0" style={{ background: poster.bg }} />

      {/* Orbe lumineux */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{ width: '80%', height: '60%', background: poster.orb }}
        aria-hidden="true"
      />

      {/* Scan-lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 5px)',
        }}
        aria-hidden="true"
      />

      {/* Forme décorative */}
      <PosterShape shape={poster.shape} color={poster.accentColor} />

      {/* Badge genre */}
      <div
        className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
        style={{
          background: 'rgba(0,0,0,0.6)',
          color: poster.accentColor,
          border: `1px solid ${poster.accentColor}44`,
        }}
      >
        {poster.genre}
      </div>

      {/* Overlay play au survol */}
      <div className="play-overlay" aria-hidden="true">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Pied de l'affiche */}
      <div
        className="absolute bottom-0 left-0 right-0 p-3"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)' }}
      >
        <p
          className="font-black text-sm tracking-widest text-white leading-none truncate"
          style={{ textShadow: `0 0 20px ${poster.accentColor}88` }}
        >
          {poster.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-yellow-400 text-[9px]">★</span>
          <span className="text-white/60 text-[9px]">{poster.rating} · {poster.year}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Statistiques catalogue ──────────────────────────────────────────────── */
const catalogStats = [
  { value: '1 200+', label: 'Films', icon: '🎬' },
  { value: '500+',   label: 'Séries', icon: '📺' },
  { value: '800+',   label: 'Animés', icon: '⭐' },
  { value: 'HD',     label: 'Qualité', icon: '💎' },
]

/* ── Section Catalogue ───────────────────────────────────────────────────── */
interface CatalogSectionProps { id?: string }

export function CatalogSection({ id }: CatalogSectionProps) {
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
    <section id={id} className="py-20 md:py-28 bg-darkest" aria-labelledby="catalogue-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* En-tête */}
        <div
          ref={headerRef}
          className="text-center mb-12 transition-all duration-700"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 tracking-widest uppercase"
            style={{ background: 'rgba(0,212,255,0.08)', color: 'rgb(var(--accent))', border: '1px solid rgba(0,212,255,0.2)' }}
          >
            🎬 Catalogue
          </div>
          <h2
            id="catalogue-heading"
            className="font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 leading-tight"
          >
            Un catalogue{' '}
            <span className="text-gradient">immense</span>
          </h2>
          <p className="text-accent-off text-lg max-w-xl mx-auto">
            Du blockbuster hollywoodien à l&apos;animation japonaise — tout ce que vous aimez,
            en un seul endroit, mis à jour chaque semaine.
          </p>
        </div>

        {/* Stats barre */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 transition-all duration-700"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(16px)',
            transitionDelay: '120ms',
          }}
        >
          {catalogStats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 rounded-2xl py-5 px-4 text-center"
              style={{ background: 'rgba(13,18,36,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="text-2xl">{s.icon}</span>
              <span className="font-black text-2xl text-accent leading-none">{s.value}</span>
              <span className="text-accent-off text-sm">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Grille affiches */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {posters.map((poster, i) => (
            <PosterCard key={poster.title} poster={poster} delay={i * 60} />
          ))}
        </div>

        {/* Note bas */}
        <div
          className="mt-8 text-center text-sm text-accent-off flex items-center justify-center gap-2 transition-all duration-700"
          style={{ opacity: headerVisible ? 1 : 0, transitionDelay: '300ms' }}
        >
          <svg className="w-3.5 h-3.5 text-accent/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Catalogue enrichi chaque semaine · VOSTFR & VF disponibles</span>
        </div>
      </div>
    </section>
  )
}

export default CatalogSection
