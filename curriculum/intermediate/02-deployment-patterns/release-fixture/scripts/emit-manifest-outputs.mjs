import { appendFileSync, readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("dist/manifest.json", "utf8"));
if (!process.env.GITHUB_OUTPUT) throw new Error("GITHUB_OUTPUT is required");
appendFileSync(
  process.env.GITHUB_OUTPUT,
  `digest=${manifest.digest}\nversion=${manifest.version}\ncommit=${manifest.commit}\n`,
);
console.log(JSON.stringify(manifest));
