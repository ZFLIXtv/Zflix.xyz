'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'

interface NavUser {
  id: string
  email: string
  name?: string
}

interface NavLink {
  label: string
  href: string
}

const navLinks: NavLink[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Tarifs', href: '/#tarifs' },
  { label: 'Tutoriels', href: '/#tutoriels' },
  { label: 'Parrainage', href: '/#parrainage' },
]

const HamburgerIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <div className="relative w-5 h-5" aria-hidden="true">
    <span
      className={[
        'absolute left-0 h-0.5 w-5 bg-current rounded-full transition-all duration-300',
        open ? 'top-2 rotate-45' : 'top-1',
      ].join(' ')}
    />
    <span
      className={[
        'absolute left-0 top-2 h-0.5 w-5 bg-current rounded-full transition-all duration-300',
        open ? 'opacity-0 -translate-x-2' : 'opacity-100',
      ].join(' ')}
    />
    <span
      className={[
        'absolute left-0 h-0.5 w-5 bg-current rounded-full transition-all duration-300',
        open ? 'top-2 -rotate-45' : 'top-3',
      ].join(' ')}
    />
  </div>
)

export const Navbar: React.FC = () => {
  const [isHome, setIsHome] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [user, setUser] = useState<NavUser | null>(null)
  const [userLoading, setUserLoading] = useState(true)

  // Détection de la page courante (client uniquement)
  useEffect(() => {
    setIsHome(window.location.pathname === '/')
  }, [])

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fetch current user
  useEffect(() => {
    let cancelled = false
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (!cancelled && res.ok) {
          const data = (await res.json()) as { success: boolean; data?: { user: NavUser } }
          setUser(data.data?.user ?? null)
        }
      } catch {
        // unauthenticated or network error — stay null
      } finally {
        if (!cancelled) setUserLoading(false)
      }
    }
    void fetchUser()
    return () => { cancelled = true }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    closeDrawer()
    window.location.href = '/'
  }

  // Close drawer on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setDrawerOpen(false)
  }, [])

  useEffect(() => {
    if (drawerOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [drawerOpen, handleKeyDown])

  const closeDrawer = () => setDrawerOpen(false)

  const AuthButtons: React.FC<{ mobile?: boolean }> = ({ mobile = false }) => {
    if (userLoading) {
      return (
        <div
          className={`h-8 w-28 rounded-lg bg-dark-highlight/50 animate-pulse ${mobile ? 'w-full' : ''}`}
          aria-label="Chargement..."
        />
      )
    }

    if (user) {
      return (
        <div className={`flex gap-2 ${mobile ? 'flex-col w-full' : 'items-center'}`}>
          <Button
            href="/dashboard"
            variant="secondary"
            size="sm"
            className={mobile ? 'w-full justify-center' : ''}
            onClick={mobile ? closeDrawer : undefined}
          >
            Dashboard
          </Button>
          <Button
            variant="primary"
            size="sm"
            className={mobile ? 'w-full justify-center' : ''}
            onClick={handleLogout}
          >
            Déconnexion
          </Button>
        </div>
      )
    }

    return (
      <div className={`flex gap-2 ${mobile ? 'flex-col w-full' : 'items-center'}`}>
        <Button
          href="/login"
          variant="secondary"
          size="sm"
          className={mobile ? 'w-full justify-center' : ''}
          onClick={mobile ? closeDrawer : undefined}
        >
          Se connecter
        </Button>
        <Button
          href="/register"
          variant="primary"
          size="sm"
          className={mobile ? 'w-full justify-center' : ''}
          onClick={mobile ? closeDrawer : undefined}
        >
          Inscription
        </Button>
      </div>
    )
  }

  return (
    <>
      <header
        className={[
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          scrolled
            ? 'backdrop-blur-xl border-b shadow-2xl'
            : 'bg-transparent',
        ].join(' ')}
        style={scrolled ? {
          background: 'rgba(4,6,12,0.85)',
          borderColor: 'rgba(0,212,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        } : {}}
      >
        <nav
          className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16"
          aria-label="Navigation principale"
        >
          {/* Logo */}
          <Link
            href="/"
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded"
            aria-label="ZFlix — Accueil"
          >
            <Image src="/logo01.png" alt="ZFlix" width={64} height={64} className="rounded" priority />
          </Link>

          {/* Desktop center links */}
          <ul className="hidden md:flex items-center gap-1" role="list">
            {navLinks.map((link) => {
              const hash = link.href.startsWith('/#') ? link.href.slice(1) : null
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={isHome && hash ? (e) => {
                      e.preventDefault()
                      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
                    } : undefined}
                    className={[
                      'px-3 py-2 rounded-lg text-sm font-medium',
                      'text-accent-off hover:text-white hover:bg-dark-highlight/60',
                      'transition-all duration-200',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                    ].join(' ')}
                  >
                    {link.label}
                  </a>
                </li>
              )
            })}
          </ul>

          {/* Desktop right auth */}
          <div className="hidden md:flex items-center gap-2">
            <AuthButtons />
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            aria-label={drawerOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className={[
              'md:hidden p-2 rounded-lg text-accent-off hover:text-[#E8F4FA]',
              'hover:bg-dark-highlight/40 transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
              drawerOpen ? 'invisible' : '',
            ].join(' ')}
          >
            <HamburgerIcon open={drawerOpen} />
          </button>
        </nav>
      </header>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        id="mobile-drawer"
        role="dialog"
        aria-label="Menu de navigation"
        aria-modal="true"
        className={[
          'fixed top-0 right-0 bottom-0 z-50 w-72 bg-darkest border-l border-accent/10',
          'flex flex-col shadow-2xl md:hidden',
          'transition-transform duration-300',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-end px-5 h-16 border-b border-accent/10 shrink-0">
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Fermer le menu"
            className={[
              'p-2 rounded-lg text-accent-off hover:text-[#E8F4FA]',
              'hover:bg-dark-highlight/40 transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
            ].join(' ')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Menu mobile">
          <ul className="flex flex-col gap-1" role="list">
            {navLinks.map((link) => {
              const hash = link.href.startsWith('/#') ? link.href.slice(1) : null
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={isHome && hash ? (e) => {
                      e.preventDefault()
                      closeDrawer()
                      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
                    } : closeDrawer}
                    className={[
                      'flex items-center px-4 py-3 rounded-xl text-sm font-medium w-full',
                      'text-accent-off hover:text-[#E8F4FA] hover:bg-dark-highlight/50',
                      'transition-colors duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                    ].join(' ')}
                  >
                    {link.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Drawer auth */}
        <div className="px-4 pb-8 pt-4 border-t border-accent/10 shrink-0">
          <AuthButtons mobile />
        </div>
      </div>
    </>
  )
}

export default Navbar
