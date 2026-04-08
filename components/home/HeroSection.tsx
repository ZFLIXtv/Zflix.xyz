'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import type { TrendingMovie } from '@/app/api/movies/trending/route'

/* ── Affiches fallback (CSS) ─────────────────────────────────────────────── */
const floatClasses = ['animate-float', 'animate-float-2', 'animate-float-3']
const tilts = ['rotate(-3deg)', 'rotate(2deg)', 'rotate(-1.5deg)', 'rotate(1.5deg)', 'rotate(-2deg)', 'rotate(3deg)']
const fallbackCards = [
  { title: 'NEXUS',    genre: 'Science-Fiction', rating: '9.2', year: '2024', bg: 'linear-gradient(160deg,#06081e,#0d0a2e,#080e24)', orb: 'rgba(0,212,255,0.25)',    color: '#00d4ff' },
  { title: 'SHADOW',   genre: 'Thriller',        rating: '8.7', year: '2024', bg: 'linear-gradient(160deg,#180404,#250606,#0a0808)', orb: 'rgba(236,72,153,0.22)',   color: '#ec4899' },
  { title: 'AURORA',   genre: 'Aventure',        rating: '8.9', year: '2023', bg: 'linear-gradient(160deg,#060e1c,#100828,#0a0e18)', orb: 'rgba(139,92,246,0.28)',   color: '#8b5cf6' },
  { title: 'CIPHER',   genre: 'Crime',           rating: '8.5', year: '2024', bg: 'linear-gradient(160deg,#0e0c02,#1e1800,#0c0a02)', orb: 'rgba(251,191,36,0.25)',   color: '#fbbf24' },
  { title: 'VOID',     genre: 'Horreur',         rating: '8.1', year: '2023', bg: 'linear-gradient(160deg,#0c0008,#180014,#0a0008)', orb: 'rgba(139,92,246,0.25)',   color: '#8b5cf6' },
  { title: 'TITAN',    genre: 'Action',          rating: '8.8', year: '2024', bg: 'linear-gradient(160deg,#060e06,#0c1a0c,#060e06)', orb: 'rgba(34,197,94,0.25)',    color: '#22c55e' },
]

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'
const mediaLabel: Record<string, string> = { movie: 'Film', tv: 'Série' }

/* ── Carte avec affiche réelle TMDB ─────────────────────────────────────── */
function RealPosterCard({ movie, index, className }: { movie: TrendingMovie; index: number; className?: string }) {
  const [imgError, setImgError] = useState(false)
  const fb = fallbackCards[index % 3]

  if (!movie.posterPath || imgError) {
    return <FallbackCard fb={fb} index={index} className={className} />
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-2xl select-none ${floatClasses[index % 3]} ${className ?? ''}`}
      style={{ width: 160, height: 240, transform: tilts[index % 3] }}
      aria-hidden="true"
    >
      <Image
        src={`${TMDB_IMG}${movie.posterPath}`}
        alt={movie.title}
        fill
        className="object-cover"
        sizes="160px"
        onError={() => setImgError(true)}
      />
      {/* Overlay gradient bas */}
      <div
        className="absolute bottom-0 left-0 right-0 p-3"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)' }}
      >
        <p className="font-black text-[11px] tracking-wider text-white leading-tight truncate">
          {movie.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-yellow-400 text-[10px]">★</span>
          <span className="text-white/70 text-[10px]">{movie.rating} · {movie.year}</span>
        </div>
      </div>
      {/* Badge type */}
      <div
        className="absolute top-3 left-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
        style={{ background: 'rgba(0,0,0,0.65)', color: 'rgb(var(--accent))', border: '1px solid rgba(var(--accent),0.35)' }}
      >
        {mediaLabel[movie.mediaType] ?? 'Film'}
      </div>
    </div>
  )
}

/* ── Carte fallback CSS ──────────────────────────────────────────────────── */
function FallbackCard({ fb, index, className }: { fb: typeof fallbackCards[0]; index: number; className?: string }) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-2xl select-none ${floatClasses[index % 3]} ${className ?? ''}`}
      style={{ width: 160, height: 240, background: fb.bg, transform: tilts[index % 3] }}
      aria-hidden="true"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{ width: 110, height: 110, background: fb.orb }} />
      <div className="absolute inset-0"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.015) 0px,rgba(255,255,255,0.015) 1px,transparent 1px,transparent 4px)' }} />
      <div className="absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
        style={{ background: 'rgba(0,0,0,0.55)', color: fb.color, border: `1px solid ${fb.color}55` }}>
        {fb.genre}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3"
        style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.9) 0%,transparent 100%)' }}>
        <p className="font-black text-base tracking-widest text-white leading-none">{fb.title}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-yellow-400 text-[10px]">★</span>
          <span className="text-white/70 text-[10px]">{fb.rating} · {fb.year}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Section Hero ─────────────────────────────────────────────────────────── */
export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [movies, setMovies] = useState<TrendingMovie[]>([])

  useEffect(() => {
    setMounted(true)
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => { if (r.ok) setIsLoggedIn(true) })
      .catch(() => {})
    fetch('/api/movies/trending')
      .then((r) => r.json())
      .then((d: { success: boolean; data?: TrendingMovie[] }) => {
        if (d.success && d.data) setMovies(d.data.slice(0, 6))
      })
      .catch(() => {})
  }, [])

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-darkest"
      aria-label="Présentation de ZFlix"
    >
      {/* ── Fond "deep space" ── */}
      <div className="absolute inset-0 grid-lines opacity-100 pointer-events-none" aria-hidden="true" />

      {/* Orbes de lumière ambiance */}
      <div
        className="absolute pointer-events-none animate-orb-drift"
        style={{
          width: 700,
          height: 700,
          top: '-20%',
          left: '-15%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          bottom: '-20%',
          right: '-15%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)',
          animation: 'orb-drift 22s ease-in-out infinite reverse',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400,
          height: 400,
          top: '30%',
          right: '10%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 65%)',
          animation: 'orb-drift 28s ease-in-out infinite',
          animationDelay: '5s',
        }}
        aria-hidden="true"
      />

      {/* ── Contenu principal ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

        {/* Colonne texte */}
        <div
          className={[
            'flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-7',
            mounted ? 'animate-fade-in-up' : 'opacity-0',
          ].join(' ')}
        >
          {/* Pill "en direct" */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-wide border-glow"
            style={{ background: 'rgba(0,212,255,0.06)', color: 'rgb(var(--accent))' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Streaming HD disponible maintenant
          </div>

          {/* Titre */}
          <h1 className="font-black leading-[1.05] text-[2rem] sm:text-[2.8rem] md:text-[3.6rem] lg:text-[4.8rem] tracking-tight">
            <span className="text-gradient">Streamez</span>
            <br />
            <span className="text-white">l&apos;infini.</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-lg sm:text-xl text-accent-off max-w-lg leading-relaxed">
            Films, séries et animés en{' '}
            <span className="text-accent font-semibold">qualité HD</span> — sur tous
            vos appareils, sans publicité, sans limites.
          </p>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {isLoggedIn ? (
              <>
                <Button href="/dashboard" variant="primary" size="lg" className="w-full sm:w-auto">
                  Mon espace
                </Button>
                <Button
                  href="/#tarifs"
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault()
                    document.querySelector('#tarifs')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Voir les abonnements
                </Button>
              </>
            ) : (
              <>
                <a
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-base transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgba(0,150,200,1) 100%)',
                    color: '#fff',
                    boxShadow: '0 8px 30px rgba(0,212,255,0.25)',
                  }}
                >
                  Commencer gratuitement →
                </a>
                <Button
                  href="#tarifs"
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault()
                    document.querySelector('#tarifs')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Voir les abonnements
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-x-4 sm:gap-x-8 gap-y-2 sm:gap-y-3 pt-2">
            {[
              { value: '15 000+', label: 'titres disponibles' },
              { value: 'HD', label: 'qualité maximale' },
              { value: '2', label: 'appareils connectés' },
              { value: '100%', label: 'gratuit' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center lg:items-start">
                <span className="text-accent font-black text-xl leading-none">{value}</span>
                <span className="text-accent-off text-xs mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne affiches flottantes — 2 rangées de 3 */}
        <div
          className={[
            'hidden lg:grid grid-cols-3 gap-4 shrink-0',
            mounted ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          style={{ transition: 'opacity 0.8s ease 0.4s' }}
          aria-hidden="true"
        >
          {(movies.length >= 6 ? movies : fallbackCards).map((item, i) => {
            const rowOffsets = ['translate-y-4', 'translate-y-0', 'translate-y-6', 'translate-y-2', 'translate-y-8', 'translate-y-0']
            return movies.length >= 6
              ? <RealPosterCard key={(item as TrendingMovie).id} movie={item as TrendingMovie} index={i} className={rowOffsets[i]} />
              : <FallbackCard key={(item as typeof fallbackCards[0]).title} fb={item as typeof fallbackCards[0]} index={i} className={rowOffsets[i]} />
          })}
        </div>
      </div>

      {/* Dégradé bas */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgb(var(--darkest)), transparent)' }}
        aria-hidden="true"
      />

      {/* Indicateur de défilement */}
      <div
        className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center gap-2 animate-float opacity-60"
        aria-hidden="true"
      >
        <span className="text-accent-off text-xs tracking-widest uppercase text-center block">Découvrir</span>
        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}

export default HeroSection
