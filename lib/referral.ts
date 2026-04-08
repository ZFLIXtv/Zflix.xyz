import { nanoid } from 'nanoid'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { sendReferralRewardEmail } from '@/lib/email'

// ─── Constants ────────────────────────────────────────────────────────────────

const REWARD_DAYS = parseInt(process.env.REFERRAL_REWARD_DAYS ?? '30', 10)

// ─── applyReferralReward ──────────────────────────────────────────────────────

/**
 * Apply a referral reward when a new user registers with a referral code.
 * Gives REWARD_DAYS to the referrer and records it in ReferralReward.
 * Also sends a reward email to the referrer.
 */
export async function applyReferralReward(
  referrerId: string,
  referredId: string,
): Promise<void> {
  const referrer = await prisma.user.findUnique({
    where: { id: referrerId },
    select: { id: true, email: true, subscriptionExpiresAt: true, isSubscribed: true },
  })

  if (!referrer) {
    console.warn(`[referral] Referrer not found: ${referrerId}`)
    return
  }

  const referred = await prisma.user.findUnique({
    where: { id: referredId },
    select: { email: true },
  })

  const referredEmail = referred?.email ?? 'un nouvel utilisateur'

  // Calculate new expiry: extend existing subscription or start from now
  const base =
    referrer.isSubscribed && referrer.subscriptionExpiresAt
      ? referrer.subscriptionExpiresAt
      : new Date()

  const newExpiry = new Date(base.getTime() + REWARD_DAYS * 24 * 60 * 60 * 1000)

  // Persist reward and update referrer subscription atomically
  await prisma.$transaction([
    prisma.referralReward.create({
      data: {
        referrerId,
        referredId,
        rewardDays: REWARD_DAYS,
      },
    }),
    prisma.user.update({
      where: { id: referrerId },
      data: {
        subscriptionExpiresAt: newExpiry,
        isSubscribed: true,
      },
    }),
  ])

  // Log audit
  await logAudit({
    userId: referrerId,
    action: 'REFERRAL_REWARD',
    details: { referredId, referredEmail, rewardDays: REWARD_DAYS },
  })

  // Notify referrer by email (non-blocking)
  if (!referrer.email) return
  sendReferralRewardEmail(referrer.email, REWARD_DAYS, referredEmail).catch(
    (err: unknown) => {
      console.error('[referral] Failed to send reward email:', err)
    },
  )
}

// ─── getUserByReferralCode ────────────────────────────────────────────────────

/**
 * Find a user by their referral code.
 * Returns null if the referrer has never paid (trial-only accounts cannot refer).
 */
export async function getUserByReferralCode(
  code: string,
): Promise<{ id: string; email: string } | null> {
  const user = await prisma.user.findUnique({
    where: { referralCode: code },
    select: {
      id: true,
      email: true,
      payments: { where: { status: 'succeeded' }, select: { id: true }, take: 1 },
    },
  })

  if (!user) return null
  if (user.payments.length === 0) return null

  return { id: user.id, email: user.email ?? '' }
}

// ─── generateUniqueReferralCode ───────────────────────────────────────────────

/**
 * Generate a unique referral code using nanoid(8).
 * Retries up to 5 times on collision.
 */
export async function generateUniqueReferralCode(): Promise<string> {
  const MAX_ATTEMPTS = 5

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = nanoid(8)

    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    })

    if (!existing) return code
  }

  throw new Error(
    'Impossible de générer un code de parrainage unique après plusieurs tentatives.',
  )
}
