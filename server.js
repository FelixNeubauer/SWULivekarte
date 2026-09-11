import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT) || 4173;
const ROOT = fileURLToPath(new URL(".", import.meta.url));
const SWU_TRIPS = "https://api.swu.de/mobility/v1/vehicle/trip/Trip";
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" };

export function upstreamUrl(pathname) {
  if (pathname === "/api/trips") return SWU_TRIPS;
  const match = pathname.match(/^\/api\/trips\/([^/]+)$/);
  return match ? `${SWU_TRIPS}/${encodeURIComponent(decodeURIComponent(match[1]))}` : null;
}

async function proxySwu(request, response, target) {
  try {
    const upstream = await fetch(target, { headers: { Accept: "application/json", "User-Agent": "SWU-Livefahrzeuge/1.0" }, signal: AbortSignal.timeout(12_000) });
    const body = await upstream.arrayBuffer();
    response.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") || MIME[".json"], "Cache-Control": "no-store" });
    response.end(Buffer.from(body));
  } catch (error) {
    const timeout = error.name === "TimeoutError";
    response.writeHead(timeout ? 504 : 502, { "Content-Type": MIME[".json"], "Cache-Control": "no-store" });
    response.end(JSON.stringify({ error: timeout ? "Zeitüberschreitung bei der SWU API" : "SWU API nicht erreichbar" }));
  }
}

async function serveFile(response, pathname) {
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!/^[\w.-]+$/.test(relative)) {
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    const body = await readFile(join(ROOT, relative));
    response.writeHead(200, { "Content-Type": MIME[extname(relative)] || "application/octet-stream", "Cache-Control": "no-cache" });
    response.end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
}

export const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const target = upstreamUrl(pathname);
  if (target) return proxySwu(request, response, target);
  return serveFile(response, pathname);
});

if (process.argv[1] === fileURLToPath(import.meta.url)) server.listen(PORT, () => console.log(`SWU Live-Fahrzeuge: http://localhost:${PORT}`));
