import Stripe from 'stripe'

// Lazy initialization — don't throw at import time (breaks Next.js build)
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key, { typescript: true })
  }
  return _stripe
}

export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    price: 0,
    annualPrice: 0,
    priceId: null,
  },
  founding: {
    name: 'Founding Beta',
    price: 17.29,
    annualPrice: null,
    priceId: process.env.STRIPE_PRICE_FOUNDING ?? null,
  },
  pro: {
    name: 'Pro',
    price: 27,
    annualPrice: 270,
    priceId: process.env.STRIPE_PRICE_PRO ?? null,
  },
  team: {
    name: 'Team',
    price: 91,
    annualPrice: 910,
    priceId: process.env.STRIPE_PRICE_TEAM ?? null,
  },
} as const

export type PlanId = keyof typeof PLAN_CONFIG

export const PUBLIC_SIGNUP_PLAN: PlanId = 'founding'
