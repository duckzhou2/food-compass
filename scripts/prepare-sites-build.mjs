import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "out");
const dist = path.join(root, "dist");
const temporary = path.join(root, ".sites-dist-tmp");

async function collectAssets(directory, prefix = "") {
  const assets = {};

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      Object.assign(assets, await collectAssets(absolute, relative));
    } else if (entry.isFile()) {
      assets[`/${relative}`] = (await readFile(absolute)).toString("base64");
    }
  }

  return assets;
}

const assets = await collectAssets(output);
const worker = `const assets = ${JSON.stringify(assets)};\n` + String.raw`
const decoded = new Map();
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

function extension(pathname) {
  const name = pathname.slice(pathname.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

function findAsset(pathname) {
  const normalized = pathname.startsWith("/") ? pathname : "/" + pathname;
  const candidates = [
    normalized,
    normalized === "/" ? "/index.html" : "",
    normalized.endsWith("/") ? normalized + "index.html" : "",
    extension(normalized) ? "" : normalized + ".html",
    extension(normalized) ? "" : normalized + "/index.html",
  ].filter(Boolean);

  return candidates.find((candidate) => Object.hasOwn(assets, candidate));
}

function decode(pathname) {
  if (decoded.has(pathname)) return decoded.get(pathname);
  const binary = atob(assets[pathname]);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  decoded.set(pathname, bytes);
  return bytes;
}

const app = {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return new Response("Bad request", { status: 400 });
    }

    const asset = findAsset(pathname) || "/404.html";
    if (!Object.hasOwn(assets, asset)) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers({
      "Content-Type": contentTypes[extension(asset)] || "application/octet-stream",
    });
    if (asset.startsWith("/_next/")) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    return new Response(request.method === "HEAD" ? null : decode(asset), {
      status: findAsset(pathname) ? 200 : 404,
      headers,
    });
  },
};

export default app;
`;

const localServer = String.raw`import http from "node:http";
import app from "./server/index.js";

http
  .createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://localhost");
    const result = await app.fetch(new Request(url, { method: request.method }));
    response.statusCode = result.status;
    for (const [name, value] of result.headers) response.setHeader(name, value);
    response.end(Buffer.from(await result.arrayBuffer()));
  })
  .listen(Number(process.env.PORT) || 3000, process.env.HOST || "0.0.0.0");
`;

await rm(temporary, { recursive: true, force: true });
await mkdir(path.join(temporary, "server"), { recursive: true });
await mkdir(path.join(temporary, ".openai"), { recursive: true });
await writeFile(path.join(temporary, "server", "index.js"), worker, "utf8");
await writeFile(path.join(temporary, "local-server.mjs"), localServer, "utf8");
await writeFile(
  path.join(temporary, "package.json"),
  '{"private":true,"type":"module"}\n',
  "utf8",
);
await writeFile(
  path.join(temporary, ".openai", "hosting.json"),
  await readFile(path.join(root, ".openai", "hosting.json")),
);
await rm(dist, { recursive: true, force: true });
await rename(temporary, dist);
