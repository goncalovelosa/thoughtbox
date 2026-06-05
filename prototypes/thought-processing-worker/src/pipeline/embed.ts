import { createHash } from "node:crypto";
import { config } from "../config.js";

const DIM = 384;

/**
 * Deterministic 384-d unit vector. Replace with Xenova `gte-small` (or hosted API)
 * for production semantic quality. Migration targets `vector(384)` per
 * `20260408033928_add_hub_tables_vectors_pgmq_realtime.sql`.
 */
export function stubEmbedding384(text: string): number[] {
  const out = new Array<number>(DIM);
  let buf = createHash("sha256").update(text, "utf8").digest();
  for (let i = 0; i < DIM; i++) {
    if (i > 0 && i % 32 === 0) {
      buf = createHash("sha256").update(buf).update(String(i)).digest();
    }
    const b = buf[i % 32]! ^ buf[(i + 7) % 32]!;
    out[i] = (b / 255) * 2 - 1;
  }
  const norm = Math.sqrt(out.reduce((s, x) => s + x * x, 0)) || 1;
  return out.map((x) => x / norm);
}

export async function embedText(text: string): Promise<number[]> {
  if (config.embeddingMode === "xenova") {
    const mod = await import("./embed-xenova.js");
    return mod.embedGteSmall(text);
  }
  return stubEmbedding384(text);
}

export function vectorLiteral(values: number[]): string {
  return `[${values.map((v) => Number(v.toFixed(8))).join(",")}]`;
}
