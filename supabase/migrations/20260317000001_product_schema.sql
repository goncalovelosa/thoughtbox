-- =============================================================================
-- sessions
-- =============================================================================

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project         TEXT NOT NULL, -- Logical grouping within a workspace
  title           TEXT NOT NULL,
  description     TEXT,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  thought_count   INTEGER NOT NULL DEFAULT 0,
  branch_count    INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_workspace ON sessions(workspace_id);
CREATE INDEX idx_sessions_updated ON sessions(workspace_id, updated_at DESC);
CREATE INDEX idx_sessions_tags ON sessions USING GIN(tags);

CREATE TRIGGER trigger_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- thoughts
-- =============================================================================

CREATE TABLE thoughts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  thought             TEXT NOT NULL,
  thought_number      INTEGER NOT NULL,
  total_thoughts      INTEGER NOT NULL,
  next_thought_needed BOOLEAN NOT NULL,
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT now(),

  is_revision         BOOLEAN DEFAULT false,
  revises_thought     INTEGER,
  branch_from_thought INTEGER,
  branch_id           TEXT,
  needs_more_thoughts BOOLEAN,

  thought_type        TEXT NOT NULL DEFAULT 'reasoning'
    CHECK (thought_type IN (
      'reasoning', 'decision_frame', 'action_report',
      'belief_snapshot', 'assumption_update',
      'context_snapshot', 'progress'
    )),

  confidence          TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  options             JSONB,
  action_result       JSONB,
  beliefs             JSONB,
  assumption_change   JSONB,
  context_data        JSONB,
  progress_data       JSONB,

  agent_id            TEXT,
  agent_name          TEXT,

  content_hash        TEXT,
  parent_hash         TEXT,

  critique            JSONB,

  UNIQUE NULLS NOT DISTINCT (session_id, thought_number, branch_id)
);

CREATE INDEX idx_thoughts_session ON thoughts(session_id, thought_number);
CREATE INDEX idx_thoughts_workspace ON thoughts(workspace_id);
CREATE INDEX idx_thoughts_branch ON thoughts(session_id, branch_id)
  WHERE branch_id IS NOT NULL;

-- Trigger to maintain denormalized counts on sessions.
CREATE OR REPLACE FUNCTION update_session_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.branch_id IS NULL THEN
      UPDATE sessions SET thought_count = thought_count + 1
      WHERE id = NEW.session_id;
    ELSE
      -- Increment branch_count only if this is the first thought for this branch
      IF NOT EXISTS (
        SELECT 1 FROM thoughts
        WHERE session_id = NEW.session_id
          AND branch_id = NEW.branch_id
          AND id != NEW.id
      ) THEN
        UPDATE sessions SET branch_count = branch_count + 1
        WHERE id = NEW.session_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.branch_id IS NULL THEN
      UPDATE sessions SET thought_count = thought_count - 1
      WHERE id = OLD.session_id;
    ELSE
      -- Decrement branch_count only if this was the last thought for this branch
      IF NOT EXISTS (
        SELECT 1 FROM thoughts
        WHERE session_id = OLD.session_id
          AND branch_id = OLD.branch_id
          AND id != OLD.id
      ) THEN
        UPDATE sessions SET branch_count = branch_count - 1
        WHERE id = OLD.session_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_counts
  AFTER INSERT OR DELETE ON thoughts
  FOR EACH ROW EXECUTE FUNCTION update_session_counts();

-- =============================================================================
-- api_keys
-- =============================================================================

CREATE TABLE api_keys (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
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

CREATE INDEX idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- =============================================================================
-- Row-Level Security (Workspace Membership Based)
-- =============================================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Helper to check if current user is a member of the workspace
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_memberships
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Sessions Policy
CREATE POLICY sessions_member_access ON sessions
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- Thoughts Policy
CREATE POLICY thoughts_member_access ON thoughts
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- API Keys Policy
CREATE POLICY api_keys_member_access ON api_keys
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- Service Role Bypass
CREATE POLICY service_role_bypass_sessions ON sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_bypass_thoughts ON thoughts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_bypass_api_keys ON api_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
