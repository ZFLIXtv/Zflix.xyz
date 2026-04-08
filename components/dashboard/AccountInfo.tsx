import React from 'react'
import type { DashboardUser } from '@/app/dashboard/page'
import Badge from '@/components/ui/Badge'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getDaysRemaining(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function getDaysTotal(createdAt: string, expiresAt: string): number {
  const diff =
    new Date(expiresAt).getTime() - new Date(createdAt).getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// ─── Subscription Status Card ─────────────────────────────────────────────────

const SubscriptionStatus: React.FC<{ user: DashboardUser }> = ({ user }) => {
  const now = new Date()
  const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const isExpired = !user.isSubscribed || (expiresAt !== null && expiresAt < now)
  const isTrial = user.isSubscribed && !user.hasPaid && (expiresAt === null || expiresAt <= oneMonthFromNow) && !isExpired
  const isActive = user.isSubscribed && !isExpired

  if (isActive && expiresAt && user.subscriptionExpiresAt) {
    const daysLeft = getDaysRemaining(user.subscriptionExpiresAt)
    const daysTotal = getDaysTotal(user.createdAt, user.subscriptionExpiresAt)
    const progress = Math.min(100, Math.round(((daysTotal - daysLeft) / daysTotal) * 100))

    return (
      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="success">Abonnement actif</Badge>
          {isTrial && <Badge variant="info">Période d&apos;essai</Badge>}
        </div>
        <p className="text-sm text-accent-off mb-1">
          Expire le{' '}
          <span className="text-[#E8F4FA] font-medium">
            {formatDateFr(user.subscriptionExpiresAt)}
          </span>
        </p>
        <p className="text-sm text-accent-off mb-4">
          <span className="text-green-400 font-semibold">{daysLeft} jour{daysLeft !== 1 ? 's' : ''}</span>{' '}
          restant{daysLeft !== 1 ? 's' : ''}
        </p>
        {/* Progress bar */}
        <div className="w-full bg-dark rounded-full h-1.5">
          <div
            className="bg-green-400 h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
            aria-label={`${progress}% de la période écoulée`}
          />
        </div>
        <p className="text-xs text-accent-off mt-2">{progress}% de la période écoulée</p>
      </div>
    )
  }

  if (isTrial && expiresAt && user.subscriptionExpiresAt) {
    const daysLeft = getDaysRemaining(user.subscriptionExpiresAt)
    return (
      <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="info">Période d&apos;essai</Badge>
        </div>
        <p className="text-sm text-accent-off">
          <span className="text-sky-400 font-semibold">{daysLeft} jour{daysLeft !== 1 ? 's' : ''}</span>{' '}
          restant{daysLeft !== 1 ? 's' : ''} dans votre période d&apos;essai
        </p>
      </div>
    )
  }

  // Expired
  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="danger">Expiré</Badge>
      </div>
      <p className="text-sm text-accent-off mb-4">
        Votre abonnement a expiré. Renouvelez pour continuer à profiter de ZFlix.
      </p>
      <a
        href="/dashboard?tab=renouveler"
        className={[
          'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold',
          'bg-accent text-darkest hover:shadow-[0_0_20px_rgba(189,230,251,0.4)]',
          'transition-all duration-200',
        ].join(' ')}
      >
        Renouvelez votre abonnement
      </a>
    </div>
  )
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-accent/5 last:border-0">
    <span className="text-sm text-accent-off">{label}</span>
    <span className="text-sm text-[#E8F4FA] font-medium">{value}</span>
  </div>
)

// ─── AccountInfo ──────────────────────────────────────────────────────────────

const AccountInfo: React.FC<{ user: DashboardUser }> = ({ user }) => {
  const now = new Date()
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null
  const isTrialAccount = user.isSubscribed && !user.hasPaid && (expiresAt === null || expiresAt <= oneMonthFromNow)

  const accountType = user.isAdmin
    ? 'Administrateur'
    : user.isSubscribed
    ? isTrialAccount
      ? 'Essai'
      : 'Abonné'
    : 'Gratuit'

  const accountBadgeVariant = user.isAdmin
    ? 'warning'
    : user.isSubscribed
    ? 'success'
    : 'default'

  return (
    <div className="space-y-6">
      {/* Account Details Card */}
      <div className="bg-dark-apparent/80 border border-accent/10 rounded-xl p-6 backdrop-blur-md">
        <h3 className="text-lg font-semibold text-[#E8F4FA] font-[Outfit] mb-4">
          Informations du compte
        </h3>
        <div>
          <InfoRow
            label="Nom d'utilisateur"
            value={<span className="font-mono">@{user.username}</span>}
          />
          {user.email && (
            <InfoRow
              label="Adresse e-mail"
              value={<span className="font-mono">{user.email}</span>}
            />
          )}
          <InfoRow
            label="Nom d'utilisateur Jellyfin"
            value={
              user.jellyfinUsername ? (
                <span className="font-mono">{user.jellyfinUsername}</span>
              ) : (
                <span className="text-accent-off italic">Non configuré</span>
              )
            }
          />
          <InfoRow
            label="Membre depuis"
            value={formatDateFr(user.createdAt)}
          />
          <InfoRow
            label="Type de compte"
            value={
              <Badge variant={accountBadgeVariant}>{accountType}</Badge>
            }
          />
        </div>
      </div>

      {/* Subscription Status */}
      <div className="bg-dark-apparent/80 border border-accent/10 rounded-xl p-6 backdrop-blur-md">
        <h3 className="text-lg font-semibold text-[#E8F4FA] font-[Outfit] mb-4">
          Statut de l&apos;abonnement
        </h3>
        <SubscriptionStatus user={user} />
      </div>
    </div>
  )
}

export default AccountInfo
