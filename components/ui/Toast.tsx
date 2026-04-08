'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { createPortal } from 'react-dom'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, duration?: number) => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Icon map ────────────────────────────────────────────────────────────────

const icons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const typeClasses: Record<ToastType, { wrapper: string; icon: string; bar: string }> = {
  success: {
    wrapper: 'border-green-500/30 bg-dark',
    icon: 'text-green-400',
    bar: 'bg-green-500',
  },
  error: {
    wrapper: 'border-red-500/30 bg-dark',
    icon: 'text-red-400',
    bar: 'bg-red-500',
  },
  warning: {
    wrapper: 'border-yellow-500/30 bg-dark',
    icon: 'text-yellow-400',
    bar: 'bg-yellow-500',
  },
  info: {
    wrapper: 'border-accent/30 bg-dark',
    icon: 'text-accent',
    bar: 'bg-accent',
  },
}

// ─── Single Toast ─────────────────────────────────────────────────────────────

interface SingleToastProps {
  toast: ToastItem
  onRemove: (id: string) => void
}

const SingleToast: React.FC<SingleToastProps> = ({ toast, onRemove }) => {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(100)
  const startTimeRef = useRef<number>(Date.now())
  const animFrameRef = useRef<number | null>(null)

  // Slide-in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // Progress bar
  useEffect(() => {
    startTimeRef.current = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100)
      setProgress(remaining)

      if (remaining > 0) {
        animFrameRef.current = requestAnimationFrame(tick)
      } else {
        handleDismiss()
      }
    }

    animFrameRef.current = requestAnimationFrame(tick)
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDismiss = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    setVisible(false)
    setTimeout(() => onRemove(toast.id), 250)
  }, [onRemove, toast.id])

  const styles = typeClasses[toast.type]

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'relative overflow-hidden rounded-xl border shadow-2xl min-w-[300px] max-w-sm',
        'transition-all duration-250',
        styles.wrapper,
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
      ].join(' ')}
    >
      <div className="flex items-start gap-3 p-4">
        <span className={`shrink-0 mt-0.5 ${styles.icon}`}>{icons[toast.type]}</span>
        <p className="flex-1 text-sm text-[#E8F4FA] leading-snug">{toast.message}</p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fermer"
          className="shrink-0 text-accent-off hover:text-[#E8F4FA] transition-colors mt-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 transition-none ${styles.bar}`}
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((prev) => [...prev, { id, message, type, duration }])
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const portal =
    mounted
      ? createPortal(
          <div
            aria-label="Notifications"
            className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 items-end"
          >
            {toasts.map((toast) => (
              <SingleToast key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
          </div>,
          document.body
        )
      : null

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {portal}
    </ToastContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>')
  }
  return ctx
}

// ─── Standalone createToast (requires provider) ───────────────────────────────
// For convenience: call useToast().addToast or import createToast helper below.

let _addToast: ToastContextValue['addToast'] | null = null

/** Internal: registers the addToast function from provider for standalone use */
export const _registerToastFn = (fn: ToastContextValue['addToast']) => {
  _addToast = fn
}

/**
 * Imperative helper — only works when <ToastProvider> is mounted.
 * Prefer useToast() inside components.
 */
export const createToast = (message: string, type: ToastType = 'info', duration = 4000) => {
  if (!_addToast) {
    // eslint-disable-next-line no-console
    console.warn('createToast: ToastProvider is not mounted')
    return
  }
  _addToast(message, type, duration)
}

export default ToastProvider
