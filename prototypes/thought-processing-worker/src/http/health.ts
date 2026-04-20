import http from "node:http";

/** Cloud Run expects a listening port; keep a minimal GET /health. */
export function startHealthServer(port: number): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, service: "thought-processing-worker" }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  server.listen(port, () => {
    console.info(`health listening on :${port}`);
  });
  return server;
}
