import React from 'react'
import type { AdminTableUser } from '@/components/admin/UserTable'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface UserRowProps {
  user: AdminTableUser
  onExtend: (userId: string) => void
}

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function daysLeft(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

interface StatusInfo {
  label: string
  variant: BadgeVariant
  dot: string
}

function getStatusInfo(user: AdminTableUser): StatusInfo {
  const now = new Date()
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expires = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null

  const hasValidAccess = user.isSubscribed && (expires === null || expires > now)
  const isActive = user.hasPaid || (expires !== null && expires > oneMonthFromNow)

  if (!user.isSubscribed && !user.hasPaid) {
    return { label: 'Inactif', variant: 'default', dot: 'rgba(110,125,175,0.8)' }
  }
  if (hasValidAccess && isActive) {
    return { label: 'Actif', variant: 'success', dot: 'rgb(74,222,128)' }
  }
  if (hasValidAccess) {
    return { label: 'Essai', variant: 'info', dot: 'rgb(56,189,248)' }
  }
  return { label: 'Expiré', variant: 'danger', dot: 'rgb(251,146,60)' }
}

const statusStyles: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  success: { bg: 'rgba(74,222,128,0.12)', color: 'rgb(74,222,128)', border: 'rgba(74,222,128,0.25)' },
  info:    { bg: 'rgba(56,189,248,0.12)', color: 'rgb(56,189,248)', border: 'rgba(56,189,248,0.25)' },
  warning: { bg: 'rgba(250,204,21,0.12)', color: 'rgb(250,204,21)', border: 'rgba(250,204,21,0.25)' },
  danger:  { bg: 'rgba(251,146,60,0.12)', color: 'rgb(251,146,60)', border: 'rgba(251,146,60,0.25)' },
  default: { bg: 'rgba(110,125,175,0.1)', color: 'rgb(110,125,175)', border: 'rgba(110,125,175,0.2)' },
}

const UserRow: React.FC<UserRowProps> = ({ user, onExtend }) => {
  const now = new Date()
  const expires = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null
  const isExpired = expires !== null && expires < now
  const { label, variant, dot } = getStatusInfo(user)
  const styles = statusStyles[variant]
  const days = expires && !isExpired ? daysLeft(user.subscriptionExpiresAt!) : null

  return (
    <tr
      className="transition-colors"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,212,255,0.03)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      {/* Utilisateur */}
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-2.5">
          {/* Avatar initiale */}
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(0,212,255,0.12)', color: 'rgb(0,212,255)', border: '1px solid rgba(0,212,255,0.2)' }}
            aria-hidden="true"
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm text-[#E8F4FA]">@{user.username}</p>
            {user.email && (
              <p className="text-xs text-accent-off/70 mt-0.5">{user.email}</p>
            )}
            {user.jellyfinUsername && !user.email && (
              <p className="text-xs text-accent-off/60 mt-0.5 font-mono">Jellyfin: {user.jellyfinUsername}</p>
            )}
          </div>
        </div>
      </td>

      {/* Statut */}
      <td className="py-3.5 pr-4">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: styles.bg, color: styles.color, border: `1px solid ${styles.border}` }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
          {label}
        </span>
      </td>

      {/* Expiration */}
      <td className="py-3.5 pr-4">
        {expires ? (
          <div>
            <span className={`text-sm font-medium ${isExpired ? 'text-orange-400' : 'text-[#E8F4FA]'}`}>
              {formatDateFr(user.subscriptionExpiresAt!)}
            </span>
            {days !== null && days <= 7 && (
              <p className="text-xs text-yellow-400 mt-0.5">{days}j restant{days > 1 ? 's' : ''}</p>
            )}
            {isExpired && (
              <p className="text-xs text-orange-400/70 mt-0.5">expiré</p>
            )}
          </div>
        ) : (
          <span className="text-sm text-accent-off/50">—</span>
        )}
      </td>

      {/* Inscrit le */}
      <td className="py-3.5 pr-4 text-sm text-accent-off/70">
        {formatDateFr(user.createdAt)}
      </td>

      {/* Actions */}
      <td className="py-3.5">
        <button
          type="button"
          onClick={() => onExtend(user.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 focus:outline-none"
          style={{
            background: 'rgba(0,212,255,0.08)',
            border: '1px solid rgba(0,212,255,0.25)',
            color: 'rgb(0,212,255)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,212,255,0.18)'
            e.currentTarget.style.boxShadow = '0 0 12px rgba(0,212,255,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,212,255,0.08)'
            e.currentTarget.style.boxShadow = ''
          }}
        >
          Étendre
        </button>
      </td>
    </tr>
  )
}

export default UserRow
