/**
 * Local Deno smoke test for Xenova gte-small (384-d). Not bundled into the Edge worker.
 *
 * Verified on developer machines with network; Supabase Edge runtime rejects onnxruntime-node
 * native bindings — use this script outside `supabase functions serve` to validate the model.
 *
 *   cd supabase/functions/process-thought-queue && deno run -A smoke_gte_small.ts "hello world"
 */

import { pipeline } from "npm:@xenova/transformers@2.17.2";

const MODEL = "Xenova/gte-small";
const DIM = 384;

async function main() {
  const text = Deno.args[0] ?? "That is a happy person";
  const extractor = await pipeline("feature-extraction", MODEL);
  const out = await extractor(text, { pooling: "mean", normalize: true });
  const data = out.data as Float32Array;
  console.log("dims", out.dims, "len", data.length, "sample", Array.from(data.slice(0, 5)));
  if (data.length !== DIM) {
    throw new Error(`expected ${DIM} dims`);
  }
}

main().catch((e) => {
  console.error(e);
  Deno.exit(1);
});
