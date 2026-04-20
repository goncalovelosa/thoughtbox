-- =============================================================================
-- Billing & Plan Schema Extensions (Flat Rate Model)
-- =============================================================================

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS plan_id TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_id IN ('free', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index for lookup during Stripe webhooks
CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_sub ON workspaces(stripe_subscription_id);
