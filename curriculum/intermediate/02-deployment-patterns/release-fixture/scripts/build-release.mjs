import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRelease } from "../src/release-lifecycle.mjs";

const source = JSON.parse(readFileSync("app/release-input.json", "utf8"));
const version = process.env.RELEASE_VERSION ?? "v1.0.0";
const commit = process.env.RELEASE_COMMIT ?? "0123456789abcdef0123456789abcdef01234567";
const release = createRelease(source, { version, commit });

mkdirSync("dist", { recursive: true });
writeFileSync("dist/northstar-release.json", release.artifactText);
writeFileSync("dist/manifest.json", `${JSON.stringify(release.manifest, null, 2)}\n`);
console.log(JSON.stringify(release.manifest));
