/**
 * Optional path: `pnpm add @xenova/transformers` and set EMBEDDING_MODE=xenova.
 * Model download on first cold start — size/CPU implications for Cloud Run.
 */
export async function embedGteSmall(text: string): Promise<number[]> {
  const { pipeline } = await import("@xenova/transformers");
  const extractor = await pipeline("feature-extraction", "Xenova/gte-small");
  const out = await extractor(text, { pooling: "mean", normalize: true });
  const data = out.data as Float32Array | number[];
  const arr = Array.from(data);
  if (arr.length !== 384) {
    throw new Error(`Expected 384-d embedding, got ${arr.length}`);
  }
  return arr;
}
