import { readFileSync } from "node:fs";
import { verifyRelease } from "../src/release-lifecycle.mjs";

const artifactText = readFileSync("dist/northstar-release.json", "utf8");
const manifest = JSON.parse(readFileSync("dist/manifest.json", "utf8"));
const verified = verifyRelease(artifactText, manifest, {
  commit: process.env.EXPECTED_COMMIT,
  version: process.env.EXPECTED_VERSION,
  digest: process.env.EXPECTED_DIGEST,
});
console.log(JSON.stringify({ verified: true, ...verified }));
