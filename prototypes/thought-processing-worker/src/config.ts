import "dotenv/config";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export const config = {
  supabaseUrl: req("SUPABASE_URL"),
  supabaseServiceRoleKey: req("SUPABASE_SERVICE_ROLE_KEY"),
  databaseUrl: req("DATABASE_URL"),

  queueName: process.env.QUEUE_NAME ?? "thought_processing",
  pollVtSeconds: Number(process.env.POLL_VT_SECONDS ?? 30),
  pollBatchSize: Number(process.env.POLL_BATCH_SIZE ?? 5),
  pollIdleMs: Number(process.env.POLL_IDLE_MS ?? 2000),

  /** Cosine distance threshold for "close neighbor" (pgvector `<=>` on normalized vectors ~ [0,2]) */
  similarityThreshold: Number(process.env.SIMILARITY_THRESHOLD ?? 0.35),

  embeddingMode: (process.env.EMBEDDING_MODE ?? "stub") as "stub" | "xenova",

  port: Number(process.env.PORT ?? 8080),
};
