import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildGraph } from "./lib/graph";
import { fetchAndPersistSnapshots } from "./lib/fetch";
import { normalizeSnapshots } from "./lib/normalize";
import { buildVerificationReport } from "./lib/verify";
import { writeViewerHtml } from "./lib/viewer";

async function writeJson(filePath: string, value: unknown) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  if (!process.env.COMPOSIO_API_KEY) {
    throw new Error("COMPOSIO_API_KEY is required");
  }

  const artifactDir = resolve(process.cwd(), "artifacts");
  const snapshots = await fetchAndPersistSnapshots(artifactDir);
  const normalizedTools = normalizeSnapshots(snapshots);
  const graphResult = buildGraph(normalizedTools);
  const verification = buildVerificationReport(
    normalizedTools,
    graphResult.graph,
    graphResult.toolPlanHints
  );

  await writeJson(`${artifactDir}/normalized/tools.json`, normalizedTools);
  await writeJson(`${artifactDir}/graph/graph.json`, graphResult.graph);
  await writeJson(
    `${artifactDir}/graph/low-confidence-candidates.json`,
    graphResult.lowConfidenceCandidates
  );
  await writeJson(`${artifactDir}/graph/tool-plan-hints.json`, graphResult.toolPlanHints);
  await writeJson(`${artifactDir}/graph/summary.json`, graphResult.summary);
  await writeJson(`${artifactDir}/graph/verification.json`, verification);
  await writeViewerHtml(`${artifactDir}/graph/index.html`, graphResult.graph);

  console.log(
    JSON.stringify(
      {
        fetchedToolkits: snapshots.map((snapshot) => ({
          toolkit: snapshot.toolkit,
          totalTools: snapshot.totalTools,
          pagesFetched: snapshot.pagesFetched,
          detailFetchCount: snapshot.detailFetchCount,
          bulkToolsMissingOutputSchema: snapshot.bulkToolsMissingOutputSchema,
        })),
        summary: graphResult.summary,
        verification,
      },
      null,
      2
    )
  );
}

await main();
