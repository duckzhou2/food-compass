import { readFile } from "node:fs/promises";
import path from "node:path";

function toWebpDataUrl(buffer) {
  return `data:image/webp;base64,${buffer.toString("base64")}`;
}

export async function loadOfflineResources(projectRoot) {
  const siteContent = JSON.parse(
    await readFile(path.join(projectRoot, "config", "site-content.json"), "utf8"),
  );
  const assets = Object.fromEntries(
    await Promise.all(
      siteContent.modules.map(async (module) => {
        const assetPath = path.join(projectRoot, "public", module.asset.replace(/^\//, ""));
        return [module.id, toWebpDataUrl(await readFile(assetPath))];
      }),
    ),
  );
  assets.hero = toWebpDataUrl(
    await readFile(path.join(projectRoot, "public", "brand", "hero-food.webp")),
  );
  return { siteContent, assets };
}
