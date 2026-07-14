import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const standalone = path.join(dist, "standalone");

await mkdir(path.join(dist, "server"), { recursive: true });
await mkdir(path.join(dist, ".openai"), { recursive: true });
await mkdir(path.join(standalone, "dist"), { recursive: true });

await writeFile(
  path.join(dist, "server", "index.js"),
  'require("../standalone/server.js");\n',
  "utf8",
);
await cp(
  path.join(root, ".openai", "hosting.json"),
  path.join(dist, ".openai", "hosting.json"),
);
await cp(path.join(root, "public"), path.join(standalone, "public"), {
  recursive: true,
  force: true,
});
await cp(path.join(dist, "static"), path.join(standalone, "dist", "static"), {
  recursive: true,
  force: true,
});
