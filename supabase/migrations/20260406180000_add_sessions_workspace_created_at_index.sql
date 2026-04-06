-- Support ordering sessions by created_at DESC per workspace (runs list page)
CREATE INDEX IF NOT EXISTS idx_sessions_workspace_created_at
ON sessions (workspace_id, created_at DESC);
