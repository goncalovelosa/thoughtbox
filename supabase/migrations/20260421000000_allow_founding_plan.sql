-- Extend workspaces.plan_id CHECK constraint to allow 'founding' tier.
-- The Founding Beta tier is the single paid-signup plan introduced alongside
-- Stripe-gated public signup. Launches 2026-04-21.

ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_plan_id_check;
ALTER TABLE workspaces
  ADD CONSTRAINT workspaces_plan_id_check
  CHECK (plan_id IN ('free', 'pro', 'enterprise', 'founding', 'team'));
