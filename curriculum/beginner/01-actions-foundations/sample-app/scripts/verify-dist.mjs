import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("dist/manifest.json", "utf8"));
assert.equal(manifest.artifact, "northstar-renewal-policy");
assert.equal(manifest.files.length, 1);

const source = await readFile(`dist/${manifest.files[0].path}`);
const digest = createHash("sha256").update(source).digest("hex");
assert.equal(digest, manifest.files[0].sha256, "artifact content does not match its manifest");
console.log(`verified ${manifest.artifact} sha256=${digest.slice(0, 12)}…`);
