import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { Composio } from "@composio/core";
import type { RawToolRecord, ToolkitSlug, ToolkitSnapshot } from "./types";

const DEFAULT_PAGE_SIZE = 200;

async function writeJson(filePath: string, value: unknown) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function createComposio() {
  return new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    allowTracking: false,
  });
}

function hasSchemaProperties(schema: unknown) {
  return (
    typeof schema === "object" &&
    schema !== null &&
    "properties" in schema &&
    typeof (schema as { properties?: unknown }).properties === "object" &&
    (schema as { properties?: Record<string, unknown> }).properties !== null &&
    Object.keys((schema as { properties?: Record<string, unknown> }).properties ?? {}).length > 0
  );
}

async function enrichToolDetails(
  composio: Composio,
  toolkit: ToolkitSlug,
  items: RawToolRecord[]
) {
  const client = composio.getClient();
  let detailFetchCount = 0;
  let bulkToolsMissingOutputSchema = 0;

  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      if (hasSchemaProperties(item.output_parameters) && hasSchemaProperties(item.input_parameters)) {
        return item;
      }

      bulkToolsMissingOutputSchema += 1;
      detailFetchCount += 1;

      const detailed = (await client.tools.retrieve(
        item.slug,
        item.version ? { version: item.version } : undefined
      )) as RawToolRecord;

      return {
        ...item,
        ...detailed,
        toolkit: detailed.toolkit ?? item.toolkit ?? { slug: toolkit },
      };
    })
  );

  return {
    items: enrichedItems,
    detailFetchCount,
    bulkToolsMissingOutputSchema,
  };
}

export async function fetchToolkitSnapshot(
  composio: Composio,
  toolkit: ToolkitSlug,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<ToolkitSnapshot> {
  const client = composio.getClient();
  const items: RawToolRecord[] = [];
  const pageCursors: string[] = [];

  let cursor: string | undefined;
  let pagesFetched = 0;

  while (true) {
    const response = await client.tools.list({
      toolkit_slug: toolkit,
      include_deprecated: true,
      limit: pageSize,
      ...(cursor ? { cursor } : {}),
    });

    pagesFetched += 1;
    pageCursors.push(cursor ?? "initial");
    items.push(...(response.items as RawToolRecord[]));

    if (!response.next_cursor) {
      break;
    }

    cursor = response.next_cursor;
  }

  const enriched = await enrichToolDetails(composio, toolkit, items);

  return {
    toolkit,
    fetchedAt: new Date().toISOString(),
    pageSize,
    pagesFetched,
    totalTools: enriched.items.length,
    pageCursors,
    detailFetchCount: enriched.detailFetchCount,
    bulkToolsMissingOutputSchema: enriched.bulkToolsMissingOutputSchema,
    items: enriched.items,
  };
}

export async function fetchAndPersistSnapshots(
  artifactDir: string,
  toolkits: ToolkitSlug[] = ["googlesuper", "github"]
) {
  const composio = createComposio();
  const snapshots = await Promise.all(
    toolkits.map((toolkit) => fetchToolkitSnapshot(composio, toolkit))
  );

  for (const snapshot of snapshots) {
    await writeJson(`${artifactDir}/raw/${snapshot.toolkit}.json`, snapshot);
  }

  return snapshots;
}
