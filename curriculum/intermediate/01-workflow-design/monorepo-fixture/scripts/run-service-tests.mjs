import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const service = process.env.SERVICE ?? process.argv[2];
const allowed = new Set(["catalog", "checkout", "notifications"]);
if (!allowed.has(service)) throw new Error(`Unsupported service: ${service ?? "missing"}`);

const tests = readdirSync(`services/${service}/test`)
  .filter((file) => file.endsWith(".test.mjs"))
  .map((file) => `services/${service}/test/${file}`);
const result = spawnSync(process.execPath, ["--test", ...tests], { encoding: "utf8" });
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);

mkdirSync("reports", { recursive: true });
writeFileSync(
  `reports/${service}.json`,
  JSON.stringify({ service, conclusion: result.status === 0 ? "success" : "failure" }, null, 2) + "\n",
);
process.exitCode = result.status ?? 1;
