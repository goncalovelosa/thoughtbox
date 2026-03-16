CREATE TABLE api_keys (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  key_prefix         TEXT NOT NULL,
  key_hash           TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked')),
  last_used_at       TIMESTAMPTZ,
  expires_at         TIMESTAMPTZ,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  revoked_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_keys_select_own ON api_keys
  FOR SELECT USING (created_by_user_id = auth.uid());
CREATE POLICY api_keys_insert_own ON api_keys
  FOR INSERT WITH CHECK (created_by_user_id = auth.uid());
CREATE POLICY api_keys_update_own ON api_keys
  FOR UPDATE USING (created_by_user_id = auth.uid());
CREATE POLICY api_keys_service_role ON api_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_api_keys_user ON api_keys(created_by_user_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_status ON api_keys(created_by_user_id, status);
