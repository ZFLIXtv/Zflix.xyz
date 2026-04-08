'use client'

import React, { useState, useEffect } from 'react'

interface Library {
  id: string
  name: string
  collectionType: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  jellyfinId: string
  username: string
  onSuccess: () => void
}

const COLLECTION_ICONS: Record<string, string> = {
  movies: '🎬',
  tvshows: '📺',
  music: '🎵',
  books: '📚',
  photos: '🖼',
  homevideos: '📹',
  unknown: '📁',
}

const MediaAccessModal: React.FC<Props> = ({ isOpen, onClose, jellyfinId, username, onSuccess }) => {
  const [libraries, setLibraries] = useState<Library[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setError(null)
    setFeedback(null)

    fetch(`/api/admin/jellyfin-libraries?jellyfinId=${encodeURIComponent(jellyfinId)}`, { credentials: 'include' })
      .then((r) => r.json() as Promise<{
        success: boolean
        error?: string
        data?: { libraries: Library[]; userPolicy: { EnableAllFolders: boolean; EnabledFolders: string[] } | null }
      }>)
      .then((json) => {
        if (json.success && json.data) {
          setLibraries(json.data.libraries)
          const policy = json.data.userPolicy
          if (policy?.EnableAllFolders) {
            // Tout accès → tout cocher
            setSelected(new Set(json.data.libraries.map((l) => l.id)))
          } else {
            setSelected(new Set(policy?.EnabledFolders ?? []))
          }
        } else {
          setError(json.error ?? 'Erreur inconnue')
        }
      })
      .catch(() => setError('Impossible de contacter Jellyfin'))
      .finally(() => setLoading(false))
  }, [isOpen, jellyfinId])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(libraries.map((l) => l.id)))
  const clearAll = () => setSelected(new Set())

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/set-media-access', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jellyfinId, folderIds: Array.from(selected), username }),
      })
      const json = (await res.json()) as { success: boolean; error?: string }
      if (json.success) {
        setFeedback('Accès mis à jour')
        onSuccess()
        setTimeout(onClose, 1200)
      } else {
        setError(json.error ?? 'Erreur')
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(12,14,40,0.98)',
          border: '1px solid rgba(0,212,255,0.18)',
          boxShadow: '0 0 60px rgba(0,212,255,0.1), 0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}
        >
          <div>
            <h2 className="text-base font-bold text-[#E8F4FA]">Accès aux médias</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(110,125,175)' }}>@{username}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'rgb(110,125,175)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-red-400 text-center py-4">{error}</p>
          ) : (
            <>
              {/* Select all / clear */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgb(110,125,175)' }}>
                  Bibliothèques Jellyfin
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs px-2 py-0.5 rounded transition-colors hover:bg-white/5"
                    style={{ color: 'rgb(0,212,255)' }}
                  >
                    Tout
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs px-2 py-0.5 rounded transition-colors hover:bg-white/5"
                    style={{ color: 'rgb(110,125,175)' }}
                  >
                    Aucun
                  </button>
                </div>
              </div>

              {libraries.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'rgb(110,125,175)' }}>
                  Aucune bibliothèque trouvée
                </p>
              ) : (
                <div className="space-y-2">
                  {libraries.map((lib) => {
                    const checked = selected.has(lib.id)
                    const icon = COLLECTION_ICONS[lib.collectionType] ?? COLLECTION_ICONS.unknown
                    return (
                      <button
                        key={lib.id}
                        type="button"
                        onClick={() => toggle(lib.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                        style={{
                          background: checked ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${checked ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {/* Checkbox */}
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all"
                          style={{
                            background: checked ? 'rgb(0,212,255)' : 'transparent',
                            border: `1.5px solid ${checked ? 'rgb(0,212,255)' : 'rgba(110,125,175,0.5)'}`,
                          }}
                        >
                          {checked && (
                            <svg className="w-2.5 h-2.5" fill="none" stroke="rgb(0,0,40)" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-lg">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#E8F4FA] truncate">{lib.name}</p>
                          <p className="text-[10px] capitalize" style={{ color: 'rgb(110,125,175)' }}>
                            {lib.collectionType}
                          </p>
                          <p className="text-[9px] font-mono mt-0.5 select-all" style={{ color: 'rgba(110,125,175,0.5)' }}>
                            {lib.id}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Feedback */}
          {feedback && (
            <p className="text-sm text-center font-medium" style={{ color: 'rgb(74,222,128)' }}>{feedback}</p>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div
            className="flex gap-3 px-6 py-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                background: 'rgba(0,212,255,0.15)',
                border: '1px solid rgba(0,212,255,0.3)',
                color: 'rgb(0,212,255)',
              }}
            >
              {saving ? 'Sauvegarde…' : `Appliquer (${selected.size} bibliothèque${selected.size !== 1 ? 's' : ''})`}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgb(110,125,175)' }}
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MediaAccessModal
