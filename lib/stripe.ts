import Stripe from 'stripe'

// ─── Feature flag ─────────────────────────────────────────────────────────────

export const stripeEnabled = process.env.STRIPE_ENABLED === 'true'

// ─── Stripe client (only initialised when enabled) ────────────────────────────

export const stripe: Stripe | null = stripeEnabled
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
  : null

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PLANS = {
  '1month': {
    price: process.env.STRIPE_PRICE_1MONTH,
    days: 30,
    amount: 1200, // 12,00 €
  },
  '6months': {
    price: process.env.STRIPE_PRICE_6MONTHS,
    days: 180,
    amount: 6600, // 66,00 €
  },
  '12months': {
    price: process.env.STRIPE_PRICE_12MONTHS,
    days: 365,
    amount: 12000, // 120,00 €
  },
} as const

export type PlanId = keyof typeof PLANS

// ─── createCheckoutSession ────────────────────────────────────────────────────

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  planId: PlanId,
  appUrl: string,
): Promise<string> {
  if (!stripe) {
    throw new Error(
      'Les paiements en ligne ne sont pas activés sur cette instance.',
    )
  }

  const plan = PLANS[planId]

  if (!plan.price) {
    throw new Error(`Le plan "${planId}" n'a pas de prix Stripe configuré.`)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: userEmail,
    line_items: [
      {
        price: plan.price,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard/subscription?success=1&plan=${planId}`,
    cancel_url: `${appUrl}/dashboard/subscription?cancelled=1`,
    metadata: {
      userId,
      planId,
      durationDays: String(plan.days),
    },
    payment_intent_data: {
      metadata: {
        userId,
        planId,
        durationDays: String(plan.days),
      },
    },
  })

  if (!session.url) {
    throw new Error('Stripe n\'a pas retourné d\'URL de paiement.')
  }

  return session.url
}

// ─── constructWebhookEvent ────────────────────────────────────────────────────

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Promise<Stripe.Event> {
  if (!stripe) {
    throw new Error('Stripe n\'est pas activé.')
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET n\'est pas configuré.')
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
