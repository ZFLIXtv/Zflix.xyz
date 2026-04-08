'use client'

import React, { useState, useRef, useEffect } from 'react'

interface Props {
  userId: string | null          // null = compte Jellyfin-only
  username: string
  jellyfinId: string | null
  isDisabled: boolean | null
  hasExpiration: boolean
  onAction: () => void
  onExtend: (() => void) | null  // null = pas de compte ZFlix
  onMediaAccess: (() => void) | null  // null = pas de compte Jellyfin
}

const MemberActions: React.FC<Props> = ({ userId, username, jellyfinId, isDisabled, hasExpiration, onAction, onExtend, onMediaAccess }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Ferme le menu si clic ailleurs
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const showFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3000)
  }

  const callApi = async (url: string, body: object) => {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.json() as Promise<{ success: boolean; error?: string; data?: { jellyfinError?: string | null } }>
  }

  const handleToggle = async () => {
    setOpen(false)
    setLoading('toggle')
    try {
      const json = await callApi('/api/admin/toggle-account', { userId: userId ?? undefined, jellyfinId, disabled: !isDisabled })
      if (json.success) {
        const msg = isDisabled ? `@${username} activé` : `@${username} désactivé`
        const warn = json.data?.jellyfinError ? ` (Jellyfin: ${json.data.jellyfinError})` : ''
        showFeedback(msg + warn, true)
        onAction()
      } else {
        showFeedback(json.error ?? 'Erreur', false)
      }
    } catch { showFeedback('Erreur réseau', false) }
    finally { setLoading(null) }
  }

  const handleClearExpiration = async () => {
    setOpen(false)
    if (!confirm(`Supprimer la date d'expiration de @${username} ? Le compte repassera en Essai (accès maintenu).`)) return
    setLoading('clearExpiration')
    try {
      const json = await callApi('/api/admin/clear-expiration', { userId })
      if (json.success) {
        showFeedback(`Expiration de @${username} supprimée`, true)
        onAction()
      } else {
        showFeedback(json.error ?? 'Erreur', false)
      }
    } catch { showFeedback('Erreur réseau', false) }
    finally { setLoading(null) }
  }

  const handleClear = async () => {
    setOpen(false)
    if (!confirm(`Supprimer l'abonnement de @${username} ?`)) return
    setLoading('clear')
    try {
      const json = await callApi('/api/admin/clear-subscription', { userId, jellyfinId })
      if (json.success) {
        showFeedback(`Abonnement de @${username} supprimé`, true)
        onAction()
      } else {
        showFeedback(json.error ?? 'Erreur', false)
      }
    } catch { showFeedback('Erreur réseau', false) }
    finally { setLoading(null) }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Feedback toast inline */}
      {feedback && (
        <div
          className="absolute right-0 bottom-full mb-2 z-50 whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{
            background: feedback.ok ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${feedback.ok ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: feedback.ok ? 'rgb(74,222,128)' : 'rgb(239,68,68)',
          }}
        >
          {feedback.msg}
        </div>
      )}

      {/* Bouton principal */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 focus:outline-none disabled:opacity-50"
        style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: 'rgb(0,212,255)' }}
        onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = 'rgba(0,212,255,0.18)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0,212,255,0.2)' }}}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.08)'; e.currentTarget.style.boxShadow = '' }}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        )}
        Actions
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden min-w-[180px]"
          style={{
            background: 'rgba(16,18,50,0.97)',
            border: '1px solid rgba(0,212,255,0.18)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,255,0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Étendre — uniquement si compte ZFlix */}
          {onExtend && (
            <>
              <button
                type="button"
                onClick={() => { setOpen(false); onExtend() }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-left transition-colors hover:bg-white/5 text-[#E8F4FA]"
              >
                <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgb(0,212,255)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Étendre l'abonnement
              </button>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </>
          )}

          {/* Accès aux médias — uniquement si compte Jellyfin */}
          {onMediaAccess && (
            <>
              <button
                type="button"
                onClick={() => { setOpen(false); onMediaAccess() }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-left transition-colors hover:bg-white/5 text-[#E8F4FA]"
              >
                <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgb(139,92,246)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                Accès aux médias
              </button>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </>
          )}

          {/* Activer / Désactiver */}
          <button
            type="button"
            onClick={handleToggle}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-left transition-colors hover:bg-white/5"
            style={{ color: isDisabled === true ? 'rgb(74,222,128)' : 'rgb(251,146,60)' }}
          >
            {isDisabled === true ? (
              <>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activer le compte
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Désactiver le compte
              </>
            )}
          </button>

          {/* Supprimer expiration / abonnement */}
          {hasExpiration && userId && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <button
                type="button"
                onClick={handleClearExpiration}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-left transition-colors hover:bg-white/5"
                style={{ color: 'rgb(250,204,21)' }}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Supprimer l'expiration
              </button>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <button
                type="button"
                onClick={handleClear}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-left transition-colors hover:bg-white/5"
                style={{ color: 'rgb(239,68,68)' }}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer l'abonnement
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default MemberActions
