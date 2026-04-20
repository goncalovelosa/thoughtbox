import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { GraphArtifact } from "./types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function writeViewerHtml(outputPath: string, graph: GraphArtifact) {
  const cytoscapePath = resolve(process.cwd(), "node_modules/cytoscape/dist/cytoscape.min.js");
  const cytoscapeSource = await readFile(cytoscapePath, "utf8");
  const serializedGraph = JSON.stringify(graph);

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Composio Dependency Graph</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f3ee;
        --panel: #fffdfa;
        --ink: #201812;
        --muted: #6d6258;
        --line: #d8cec2;
        --requires: #d35400;
        --produces: #0f766e;
        --tool: #2d3748;
        --resource: #1f5a99;
        --external: #b91c1c;
        --accent: #e7ded1;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: radial-gradient(circle at top left, #fffefc, var(--bg));
        color: var(--ink);
        font: 14px/1.45 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .layout {
        display: grid;
        grid-template-columns: 320px 1fr 320px;
        min-height: 100vh;
      }

      .panel {
        padding: 18px;
        border-right: 1px solid var(--line);
        background: rgba(255, 253, 250, 0.86);
        backdrop-filter: blur(8px);
      }

      .panel:last-child {
        border-right: 0;
        border-left: 1px solid var(--line);
      }

      h1, h2 {
        margin: 0 0 12px;
        font-size: 16px;
      }

      .stack {
        display: grid;
        gap: 12px;
      }

      label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-size: 12px;
      }

      input, select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: var(--panel);
        color: var(--ink);
      }

      .checkbox-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .checkbox-row label {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 10px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: var(--panel);
      }

      .legend {
        display: grid;
        gap: 8px;
        font-size: 12px;
        color: var(--muted);
      }

      .legend span::before {
        content: "";
        display: inline-block;
        width: 10px;
        height: 10px;
        margin-right: 8px;
        border-radius: 999px;
      }

      .legend .requires::before { background: var(--requires); }
      .legend .produces::before { background: var(--produces); }
      .legend .tool::before { background: var(--tool); }
      .legend .resource::before { background: var(--resource); }
      .legend .external::before { background: var(--external); }

      #cy {
        width: 100%;
        height: 100vh;
      }

      .meta {
        color: var(--muted);
        font-size: 12px;
      }

      .card {
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--panel);
      }

      code, pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }

      pre {
        white-space: pre-wrap;
        margin: 0;
        color: var(--ink);
      }

      ul {
        margin: 0;
        padding-left: 18px;
      }

      @media (max-width: 1180px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .panel, .panel:last-child {
          border: 0;
          border-bottom: 1px solid var(--line);
        }

        #cy {
          height: 60vh;
        }
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <aside class="panel">
        <div class="stack">
          <div>
            <h1>Dependency Graph</h1>
            <div class="meta">Generated from <code>artifacts/graph/graph.json</code>. Low-confidence edges are hidden by default.</div>
          </div>

          <label>
            Search
            <input id="search" type="search" placeholder="tool slug or resource type" />
          </label>

          <label>
            Toolkit
            <select id="toolkit">
              <option value="all">All toolkits</option>
              <option value="googlesuper">googlesuper</option>
              <option value="github">github</option>
            </select>
          </label>

          <div>
            <div class="meta" style="margin-bottom: 6px;">Confidence</div>
            <div class="checkbox-row">
              <label><input id="confidence-high" type="checkbox" checked /> high</label>
              <label><input id="confidence-medium" type="checkbox" checked /> medium</label>
              <label><input id="confidence-low" type="checkbox" /> low</label>
            </div>
          </div>

          <div class="legend">
            <span class="requires">requires edge</span>
            <span class="produces">produces edge</span>
            <span class="tool">tool node</span>
            <span class="resource">resource node</span>
            <span class="external">resource with zero producers</span>
          </div>
        </div>
      </aside>

      <main>
        <div id="cy"></div>
      </main>

      <aside class="panel">
        <div class="stack">
          <div class="card">
            <h2>Selection</h2>
            <pre id="selection">${escapeHtml("Select a node or edge to inspect its metadata.")}</pre>
          </div>

          <div class="card">
            <h2>Neighborhood</h2>
            <div class="meta" id="neighborhood-meta">Showing the immediate neighborhood around the selected node.</div>
          </div>
        </div>
      </aside>
    </div>

    <script>${cytoscapeSource}</script>
    <script>
      const graph = ${serializedGraph};
      const searchInput = document.getElementById("search");
      const toolkitSelect = document.getElementById("toolkit");
      const selectionEl = document.getElementById("selection");
      const neighborhoodMetaEl = document.getElementById("neighborhood-meta");
      const confidenceInputs = {
        high: document.getElementById("confidence-high"),
        medium: document.getElementById("confidence-medium"),
        low: document.getElementById("confidence-low"),
      };

      const resourceProducerCount = new Map();
      for (const edge of graph.edges) {
        if (edge.kind !== "produces") continue;
        resourceProducerCount.set(edge.resourceType, (resourceProducerCount.get(edge.resourceType) || 0) + 1);
      }

      const allNodes = graph.nodes.map((node) => ({
        data: {
          ...node,
          zeroProducers: node.kind === "resource" ? !resourceProducerCount.get(node.resourceType) : false,
        },
      }));

      const allEdges = graph.edges.map((edge) => ({
        data: { ...edge, source: edge.from, target: edge.to },
      }));

      const cy = cytoscape({
        container: document.getElementById("cy"),
        elements: [],
        style: [
          {
            selector: "node[kind = 'tool']",
            style: {
              "background-color": "#2d3748",
              color: "#fff",
              label: "data(label)",
              "text-wrap": "wrap",
              "text-max-width": 140,
              "font-size": 11,
              padding: 10,
              shape: "round-rectangle",
            },
          },
          {
            selector: "node[kind = 'resource']",
            style: {
              "background-color": "#1f5a99",
              color: "#fff",
              label: "data(label)",
              "text-wrap": "wrap",
              "text-max-width": 180,
              "font-size": 13,
              "font-weight": "bold",
              "text-valign": "center",
              "text-halign": "center",
              width: 50,
              height: 50,
              shape: "ellipse",
            },
          },
          {
            selector: "node[zeroProducers = true]",
            style: {
              "border-width": 3,
              "border-color": "#b91c1c",
            },
          },
          {
            selector: "edge[kind = 'requires']",
            style: {
              width: 1.5,
              "line-color": "#d35400",
              "line-opacity": 0.4,
              "target-arrow-color": "#d35400",
              "target-arrow-shape": "triangle",
              "arrow-scale": 0.8,
              "curve-style": "bezier",
            },
          },
          {
            selector: "edge[kind = 'produces']",
            style: {
              width: 1.5,
              "line-color": "#0f766e",
              "line-opacity": 0.4,
              "target-arrow-color": "#0f766e",
              "target-arrow-shape": "triangle",
              "arrow-scale": 0.8,
              "curve-style": "bezier",
            },
          },
          {
            selector: ":selected",
            style: {
              "overlay-opacity": 0.15,
              "overlay-color": "#111827",
            },
          },
        ],
        layout: { name: "concentric", animate: false, minNodeSpacing: 60 },
      });

      // --- helpers ---

      function selectedConfidences() {
        return Object.entries(confidenceInputs)
          .filter(([, input]) => input.checked)
          .map(([key]) => key);
      }

      function nodeMatchesToolkit(node, toolkit) {
        if (toolkit === "all") return true;
        if (node.kind === "tool") return node.toolkit === toolkit;
        return true;
      }

      function nodeMatchesSearch(node, search) {
        if (!search) return true;
        const haystack = (node.kind === "tool" ? node.slug : node.resourceType) || "";
        return haystack.toLowerCase().includes(search);
      }

      // --- build the visible subgraph ---

      function buildVisibleGraph() {
        const toolkit = toolkitSelect.value;
        const search = searchInput.value.trim().toLowerCase();
        const confidences = new Set(selectedConfidences());

        // Step 1: filter edges by confidence
        const validEdges = allEdges.filter(({ data }) => confidences.has(data.confidence));

        // Step 2: count how many distinct resource types each tool connects to
        const toolResourceCount = new Map();
        for (const { data } of validEdges) {
          const toolId = data.kind === "produces" ? data.from : data.to;
          if (!toolId.startsWith("tool:")) continue;
          const set = toolResourceCount.get(toolId) || new Set();
          set.add(data.resourceType);
          toolResourceCount.set(toolId, set);
        }

        // Step 3: decide which tools to include
        const nodeById = new Map(allNodes.map((n) => [n.data.id, n]));
        const includedNodeIds = new Set();

        // Always include all resource nodes that pass filters
        for (const { data } of allNodes) {
          if (data.kind === "resource") {
            includedNodeIds.add(data.id);
          }
        }

        if (search) {
          // Search mode: include matching nodes + their 1-hop neighbors
          const matchingNodes = allNodes.filter(({ data }) =>
            nodeMatchesToolkit(data, toolkit) && nodeMatchesSearch(data, search)
          );
          for (const { data } of matchingNodes) {
            includedNodeIds.add(data.id);
          }
          // Expand to neighbors
          for (const { data } of validEdges) {
            if (includedNodeIds.has(data.from) || includedNodeIds.has(data.to)) {
              includedNodeIds.add(data.from);
              includedNodeIds.add(data.to);
            }
          }
        } else {
          // Overview mode: include tools with 2+ resource connections
          // Auto-tune threshold for readable graph (target 80-200 tool nodes)
          let threshold = 3;
          const countAtThreshold = (t) => {
            let n = 0;
            for (const [toolId, resources] of toolResourceCount) {
              const node = nodeById.get(toolId);
              if (!node || !nodeMatchesToolkit(node.data, toolkit)) continue;
              if (resources.size >= t) n++;
            }
            return n;
          };

          if (countAtThreshold(3) < 40) threshold = 2;
          if (countAtThreshold(2) < 40) threshold = 1;
          if (countAtThreshold(threshold) > 250) threshold++;

          for (const [toolId, resources] of toolResourceCount) {
            if (resources.size < threshold) continue;
            const node = nodeById.get(toolId);
            if (!node || !nodeMatchesToolkit(node.data, toolkit)) continue;
            includedNodeIds.add(toolId);
          }
        }

        // Apply toolkit filter to resource nodes too: only keep resources
        // that have at least one included tool connected
        const activeResources = new Set();
        for (const { data } of validEdges) {
          if (includedNodeIds.has(data.from) && includedNodeIds.has(data.to)) {
            if (data.from.startsWith("resource:")) activeResources.add(data.from);
            if (data.to.startsWith("resource:")) activeResources.add(data.to);
          }
        }

        // Remove resource nodes with zero connections in this view
        for (const nodeId of [...includedNodeIds]) {
          if (nodeId.startsWith("resource:") && !activeResources.has(nodeId)) {
            includedNodeIds.delete(nodeId);
          }
        }

        // Step 4: collect nodes and edges
        const nodes = allNodes.filter(({ data }) => includedNodeIds.has(data.id));
        const edges = validEdges.filter(
          ({ data }) => includedNodeIds.has(data.from) && includedNodeIds.has(data.to)
        );

        return { nodes, edges };
      }

      // --- rendering ---

      function renderSelection(payload) {
        selectionEl.textContent = JSON.stringify(payload, null, 2);
      }

      function renderGraph() {
        const { nodes, edges } = buildVisibleGraph();

        cy.elements().remove();
        cy.add([...nodes, ...edges]);

        const toolCount = nodes.filter((n) => n.data.kind === "tool").length;
        const resourceCount = nodes.filter((n) => n.data.kind === "resource").length;

        cy.layout({
          name: "cose",
          animate: false,
          randomize: true,
          nodeRepulsion: function(node) {
            return node.data("kind") === "resource" ? 8192 : 4096;
          },
          idealEdgeLength: function(edge) {
            return 80;
          },
          edgeElasticity: function(edge) {
            return 32;
          },
          gravity: 0.8,
          numIter: 1500,
          padding: 40,
          nodeOverlap: 10,
          componentSpacing: 80,
          nodeDimensionsIncludeLabels: true,
        }).run();

        neighborhoodMetaEl.textContent =
          nodes.length === 0
            ? "No nodes match the current filters."
            : \`Showing \${toolCount} tools, \${resourceCount} resources, \${edges.length} edges.\`;

        if (nodes.length === 0) {
          renderSelection({ message: "No matching nodes" });
        }
      }

      cy.on("tap", "node", (event) => {
        renderSelection(event.target.data());
      });

      cy.on("tap", "edge", (event) => {
        renderSelection(event.target.data());
      });

      for (const element of [searchInput, toolkitSelect, ...Object.values(confidenceInputs)]) {
        element.addEventListener("input", renderGraph);
        element.addEventListener("change", renderGraph);
      }

      renderGraph();
    </script>
  </body>
</html>
`;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
}
