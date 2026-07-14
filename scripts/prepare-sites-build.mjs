import { cp, mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "out");
const dist = path.join(root, "dist");
const temporary = path.join(root, ".sites-dist-tmp");

const server = String.raw`const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = path.join(__dirname, "..", "site");
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

function findFile(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const relative = pathname.replace(/^\/+/, "");
  const candidates = [
    relative,
    relative.endsWith("/") ? path.join(relative, "index.html") : "",
    path.extname(relative) ? "" : relative + ".html",
    path.extname(relative) ? "" : path.join(relative, "index.html"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const file = path.resolve(root, candidate);
    if (!file.startsWith(root + path.sep)) continue;
    try {
      if (fs.statSync(file).isFile()) return file;
    } catch {}
  }

  return path.join(root, "404.html");
}

http
  .createServer((request, response) => {
    const file = findFile(request.url || "/");
    const extension = path.extname(file).toLowerCase();
    response.setHeader(
      "Content-Type",
      contentTypes[extension] || "application/octet-stream",
    );
    if (file.includes(path.join("site", "_next"))) {
      response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
    fs.createReadStream(file)
      .on("error", () => {
        response.statusCode = 404;
        response.end("Not found");
      })
      .pipe(response);
  })
  .listen(Number(process.env.PORT) || 3000, process.env.HOST || "0.0.0.0");
`;

await rm(temporary, { recursive: true, force: true });
await mkdir(path.join(temporary, "server"), { recursive: true });
await mkdir(path.join(temporary, ".openai"), { recursive: true });
await cp(output, path.join(temporary, "site"), {
  recursive: true,
  force: true,
});
await cp(
  path.join(root, ".openai", "hosting.json"),
  path.join(temporary, ".openai", "hosting.json"),
);
await writeFile(path.join(temporary, "server", "index.js"), server, "utf8");
await rm(dist, { recursive: true, force: true });
await rename(temporary, dist);
