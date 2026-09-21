import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("src/renewal-policy.mjs", "dist/renewal-policy.mjs");

const source = await readFile("dist/renewal-policy.mjs");
const manifest = {
  artifact: "northstar-renewal-policy",
  files: [{ path: "renewal-policy.mjs", sha256: createHash("sha256").update(source).digest("hex") }],
  format: "esm",
  node: ">=22",
  version: 1,
};
await writeFile("dist/manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`built ${manifest.artifact} with ${manifest.files.length} source file`);
