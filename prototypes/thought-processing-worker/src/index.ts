import { config } from "./config.js";
import { createPool } from "./db/pool.js";
import { pgmqArchive, pgmqDelete, pgmqRead } from "./db/pgmq.js";
import { createServiceClient } from "./db/supabase.js";
import { embedText } from "./pipeline/embed.js";
import { runIntelPipeline, type ThoughtRow } from "./pipeline/intel.js";
import { subscribeThoughtsChanges } from "./realtime/monitor.js";
import { startHealthServer } from "./http/health.js";

const MAX_READ_CT = 8;

function parseQueueMessage(raw: Record<string, unknown>): { thoughtId: string } | null {
  const thoughtId = raw.thought_id;
  if (typeof thoughtId === "string" && thoughtId.length > 0) {
    return { thoughtId };
  }
  return null;
}

async function loadThought(
  supabase: ReturnType<typeof createServiceClient>,
  thoughtId: string
): Promise<ThoughtRow | null> {
  const { data, error } = await supabase
    .from("thoughts")
    .select(
      "id, session_id, workspace_id, thought, thought_number, thought_type, is_revision, revises_thought"
    )
    .eq("id", thoughtId)
    .maybeSingle();

  if (error) {
    console.error("loadThought error", error);
    return null;
  }
  if (!data) return null;
  return data as ThoughtRow;
}

async function main(): Promise<void> {
  const pool = createPool(config.databaseUrl);
  const supabase = createServiceClient(
    config.supabaseUrl,
    config.supabaseServiceRoleKey
  );

  const health = startHealthServer(config.port);

  const realtimeOn = process.env.REALTIME_MONITOR === "1";
  if (realtimeOn) {
    subscribeThoughtsChanges(supabase, "intel-worker");
  }

  const shutdown = (): void => {
    health.close();
    void pool.end().then(() => process.exit(0));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  console.info("thought-processing worker started", {
    queue: config.queueName,
    vt: config.pollVtSeconds,
    batch: config.pollBatchSize,
    embeddingMode: config.embeddingMode,
  });

  for (;;) {
    let messages;
    try {
      messages = await pgmqRead(
        pool,
        config.queueName,
        config.pollVtSeconds,
        config.pollBatchSize
      );
    } catch (e) {
      console.error("pgmq read failed", e);
      await sleep(config.pollIdleMs);
      continue;
    }

    if (messages.length === 0) {
      await sleep(config.pollIdleMs);
      continue;
    }

    for (const row of messages) {
      const msgId = BigInt(String(row.msg_id));
      const readCt = Number(row.read_ct ?? 0);
      const parsed = parseQueueMessage(row.message ?? {});

      if (!parsed) {
        console.warn("skip invalid message", row.message);
        await pgmqDelete(pool, config.queueName, msgId);
        continue;
      }

      if (readCt >= MAX_READ_CT) {
        console.error("poison message, deleting", { msgId: String(msgId), readCt });
        await pgmqDelete(pool, config.queueName, msgId);
        continue;
      }

      try {
        const thought = await loadThought(supabase, parsed.thoughtId);
        if (!thought) {
          console.warn("thought not found, archiving", parsed.thoughtId);
          await pgmqArchive(pool, config.queueName, msgId);
          continue;
        }

        const result = await runIntelPipeline(pool, thought, embedText);
        console.info("processed", {
          thoughtId: thought.id,
          dims: result.embeddingDims,
          neighbors: result.neighbors.length,
          evolution: result.evolutionHints,
          contradiction: result.contradictionHints,
        });

        await pgmqArchive(pool, config.queueName, msgId);
      } catch (e) {
        console.error("process failed (will retry after VT)", {
          msgId: String(msgId),
          err: e,
        });
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
