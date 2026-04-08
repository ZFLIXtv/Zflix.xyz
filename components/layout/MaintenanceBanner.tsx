'use client'

import React, { useState, useEffect } from 'react'

const STORAGE_KEY = 'zflix_maintenance_banner_dismissed'

export const MaintenanceBanner: React.FC = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isMaintenanceMode =
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'

    if (!isMaintenanceMode) return

    try {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      if (!dismissed) setVisible(true)
    } catch {
      // localStorage may be unavailable (private mode, etc.)
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
  }

  if (!visible) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'w-full flex items-center justify-between gap-4',
        'px-4 sm:px-6 py-3',
        'bg-yellow-500/15 border-b border-yellow-500/30',
        'text-yellow-300 text-sm',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Warning icon */}
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <p className="truncate sm:whitespace-normal">
          <span className="font-semibold">Maintenance prévue.</span>{' '}
          Certaines fonctionnalités peuvent être indisponibles.
        </p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer la bannière de maintenance"
        className={[
          'shrink-0 p-1 rounded-md text-yellow-400',
          'hover:text-yellow-200 hover:bg-yellow-500/20',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60',
        ].join(' ')}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}

export default MaintenanceBanner
