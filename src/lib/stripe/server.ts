import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
})

export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    price: 0,
    annualPrice: 0,
    priceId: null,
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
