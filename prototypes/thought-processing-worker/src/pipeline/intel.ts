import type pg from "pg";
import { config } from "../config.js";
import { vectorLiteral } from "./embed.js";

export type ThoughtRow = {
  id: string;
  session_id: string;
  workspace_id: string;
  thought: string;
  thought_number: number;
  thought_type: string;
  is_revision: boolean | null;
  revises_thought: number | null;
};

export type IntelResult = {
  embeddingDims: number;
  neighbors: Array<{ id: string; dist: number; thought_number: number }>;
  evolutionHints: string[];
  contradictionHints: string[];
};

async function fetchNeighbors(
  pool: pg.Pool,
  sessionId: string,
  excludeId: string,
  vec: number[]
): Promise<Array<{ id: string; dist: number; thought_number: number }>> {
  const literal = vectorLiteral(vec);
  const { rows } = await pool.query<{
    id: string;
    dist: number;
    thought_number: number;
  }>(
    `
    SELECT id,
           (embedding <=> $1::vector) AS dist,
           thought_number
    FROM public.thoughts
    WHERE session_id = $2::uuid
      AND id <> $3::uuid
      AND embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT 8
    `,
    [literal, sessionId, excludeId]
  );
  return rows.map((r) => ({
    id: r.id,
    dist: Number(r.dist),
    thought_number: r.thought_number,
  }));
}

function evolutionHintsFor(row: ThoughtRow): string[] {
  const hints: string[] = [];
  if (row.is_revision && row.revises_thought != null) {
    hints.push(
      `revision_chain:revises_thought=${row.revises_thought} (run thoughtbox-evolution classifier on pair)`
    );
  }
  return hints;
}

function contradictionHintsFor(
  row: ThoughtRow,
  neighbors: IntelResult["neighbors"]
): string[] {
  const hints: string[] = [];
  const close = neighbors.filter((n) => n.dist < config.similarityThreshold);
  if (close.length === 0) return hints;

  if (row.thought_type === "decision_frame") {
    hints.push(
      `near_duplicate_decision: ${close.length} neighbors within cosine-distance threshold — manual or LLM contradiction review`
    );
  }
  if (row.thought_type === "belief_snapshot") {
    hints.push(
      `belief_overlap: semantic neighbors present — check CONTRADICTS relations in knowledge graph`
    );
  }
  return hints;
}

export async function runIntelPipeline(
  pool: pg.Pool,
  row: ThoughtRow,
  embed: (text: string) => Promise<number[]>
): Promise<IntelResult> {
  const vec = await embed(row.thought);
  const literal = vectorLiteral(vec);

  await pool.query(`UPDATE public.thoughts SET embedding = $1::vector WHERE id = $2::uuid`, [
    literal,
    row.id,
  ]);

  const neighbors = await fetchNeighbors(pool, row.session_id, row.id, vec);
  const evolutionHints = evolutionHintsFor(row);
  const contradictionHints = contradictionHintsFor(row, neighbors);

  return {
    embeddingDims: vec.length,
    neighbors,
    evolutionHints,
    contradictionHints,
  };
}
