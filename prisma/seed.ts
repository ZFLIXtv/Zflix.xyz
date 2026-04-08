import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main(): Promise<void> {
  console.log('🌱 Seeding database...')

  // ─── Admin user ──────────────────────────────────────────────────────────
  const adminEmail =
    process.env.ADMIN_EMAILS?.split(',')[0]?.trim() ?? 'admin@zflix.com'

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      username: 'admin',
      email: adminEmail,
      passwordHash: await hashPassword('Admin1234!'),
      jellyfinUsername: 'admin_zflix',
      isAdmin: true,
      isSubscribed: true,
      emailVerified: true,
      trialUsed: false,
      referralCode: nanoid(8),
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  })
  console.log(`  ✓ Admin: ${admin.email}`)

  // ─── Test users ───────────────────────────────────────────────────────────

  // 1. Active subscriber
  const activeSubscriber = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: await hashPassword('Test1234!'),
      jellyfinUsername: 'alice_zflix',
      isSubscribed: true,
      trialUsed: true,
      emailVerified: true,
      referralCode: nanoid(8),
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
  console.log(`  ✓ Active subscriber: ${activeSubscriber.email}`)

  // 2. Expired subscriber
  const expiredSubscriber = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      username: 'bob',
      email: 'bob@example.com',
      passwordHash: await hashPassword('Test1234!'),
      jellyfinUsername: 'bob_zflix',
      isSubscribed: false,
      trialUsed: true,
      emailVerified: true,
      referralCode: nanoid(8),
      subscriptionExpiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  })
  console.log(`  ✓ Expired subscriber: ${expiredSubscriber.email}`)

  // 3. Trial active (subscribed, trialUsed=false treated as first sub)
  const trialActive = await prisma.user.upsert({
    where: { email: 'carol@example.com' },
    update: {},
    create: {
      username: 'carol',
      email: 'carol@example.com',
      passwordHash: await hashPassword('Test1234!'),
      jellyfinUsername: 'carol_zflix',
      isSubscribed: true,
      trialUsed: false,
      emailVerified: true,
      referralCode: nanoid(8),
      subscriptionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })
  console.log(`  ✓ Trial active: ${trialActive.email}`)

  // 4. Trial expired
  const trialExpired = await prisma.user.upsert({
    where: { email: 'dave@example.com' },
    update: {},
    create: {
      username: 'dave',
      email: 'dave@example.com',
      passwordHash: await hashPassword('Test1234!'),
      jellyfinUsername: 'dave_zflix',
      isSubscribed: false,
      trialUsed: true,
      emailVerified: true,
      referralCode: nanoid(8),
      subscriptionExpiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  })
  console.log(`  ✓ Trial expired: ${trialExpired.email}`)

  // 5. Brand new user (no subscription, unverified)
  const newUser = await prisma.user.upsert({
    where: { email: 'eve@example.com' },
    update: {},
    create: {
      username: 'eve',
      email: 'eve@example.com',
      passwordHash: await hashPassword('Test1234!'),
      isSubscribed: false,
      trialUsed: false,
      emailVerified: false,
      referralCode: nanoid(8),
      emailVerifyToken: nanoid(32),
    },
  })
  console.log(`  ✓ New user: ${newUser.email}`)

  // ─── Payment records ──────────────────────────────────────────────────────

  const payment1 = await prisma.payment.create({
    data: {
      userId: activeSubscriber.id,
      stripePaymentId: 'pi_test_alice_001',
      amount: 499,
      durationDays: 30,
      status: 'succeeded',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  })
  console.log(`  ✓ Payment for alice: ${payment1.id}`)

  const payment2 = await prisma.payment.create({
    data: {
      userId: expiredSubscriber.id,
      stripePaymentId: 'pi_test_bob_001',
      amount: 2394,
      durationDays: 180,
      status: 'succeeded',
      createdAt: new Date(Date.now() - 190 * 24 * 60 * 60 * 1000),
    },
  })
  console.log(`  ✓ Payment for bob: ${payment2.id}`)

  const payment3 = await prisma.payment.create({
    data: {
      userId: trialExpired.id,
      stripePaymentId: null,
      amount: 0,
      durationDays: 7,
      status: 'trial',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
  })
  console.log(`  ✓ Trial payment for dave: ${payment3.id}`)

  // ─── Referral reward ──────────────────────────────────────────────────────

  const referralReward = await prisma.referralReward.create({
    data: {
      referrerId: activeSubscriber.id,
      referredId: trialActive.id,
      rewardDays: 30,
    },
  })
  console.log(`  ✓ Referral reward: ${referralReward.id}`)

  // Link carol to alice as referrer
  await prisma.user.update({
    where: { id: trialActive.id },
    data: { referredById: activeSubscriber.id },
  })

  // ─── Audit logs ───────────────────────────────────────────────────────────

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'LOGIN',
        details: JSON.stringify({ method: 'password' }),
        ipAddress: '127.0.0.1',
      },
      {
        userId: activeSubscriber.id,
        action: 'REGISTER',
        details: JSON.stringify({ email: activeSubscriber.email }),
        ipAddress: '192.168.1.10',
      },
      {
        userId: activeSubscriber.id,
        action: 'PAYMENT_SUCCESS',
        details: JSON.stringify({ amount: 499, durationDays: 30 }),
        ipAddress: '192.168.1.10',
      },
      {
        userId: expiredSubscriber.id,
        action: 'REGISTER',
        details: JSON.stringify({ email: expiredSubscriber.email }),
        ipAddress: '192.168.1.20',
      },
      {
        userId: expiredSubscriber.id,
        action: 'SUBSCRIPTION_EXPIRE',
        details: JSON.stringify({ email: expiredSubscriber.email }),
        ipAddress: null,
      },
      {
        userId: trialActive.id,
        action: 'REGISTER',
        details: JSON.stringify({
          email: trialActive.email,
          referredBy: activeSubscriber.email,
        }),
        ipAddress: '192.168.1.30',
      },
      {
        userId: activeSubscriber.id,
        action: 'REFERRAL_REWARD',
        details: JSON.stringify({
          referredEmail: trialActive.email,
          rewardDays: 30,
        }),
        ipAddress: null,
      },
      {
        userId: trialExpired.id,
        action: 'SUBSCRIPTION_EXPIRE',
        details: JSON.stringify({ email: trialExpired.email }),
        ipAddress: null,
      },
      {
        userId: newUser.id,
        action: 'REGISTER',
        details: JSON.stringify({ email: newUser.email }),
        ipAddress: '10.0.0.5',
      },
      {
        userId: null,
        action: 'JELLYFIN_ERROR',
        details: JSON.stringify({ error: 'Connection timeout', url: '/Users' }),
        ipAddress: null,
      },
    ],
  })
  console.log('  ✓ Audit logs created')

  console.log('\n✅ Seed complete.')
  console.log(`\n  Admin email : ${adminEmail}`)
  console.log('  Admin pass  : Admin1234!')
  console.log('\n  Test users (password: Test1234!):')
  console.log('    alice@example.com  — active subscriber')
  console.log('    bob@example.com    — expired subscriber')
  console.log('    carol@example.com  — trial active')
  console.log('    dave@example.com   — trial expired')
  console.log('    eve@example.com    — new user (unverified)')
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
