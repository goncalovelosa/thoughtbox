import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

/**
 * Optional: subscribe to Postgres Changes on `thoughts` (table is in Realtime publication
 * per `20260408033928_add_hub_tables_vectors_pgmq_realtime.sql`).
 *
 * Use for observability or coalescing work — not required for correctness, since this
 * worker is already driven by PGMQ. MCP / web clients consume the same Realtime stream
 * when `thoughts` rows update (e.g. after embedding write).
 */
export function subscribeThoughtsChanges(
  supabase: SupabaseClient,
  logLabel: string
): RealtimeChannel {
  return supabase
    .channel("thought-processing-worker-monitor")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "thoughts" },
      (payload) => {
        const id =
          (payload.new as { id?: string } | null)?.id ??
          (payload.old as { id?: string } | null)?.id;
        console.info(`[${logLabel}] realtime ${payload.eventType} thought_id=${id ?? "?"}`);
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.info(`[${logLabel}] realtime subscribed`);
      }
    });
}
