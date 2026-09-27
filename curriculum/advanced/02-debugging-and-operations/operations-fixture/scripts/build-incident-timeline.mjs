import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildTimeline } from "../src/metrics.mjs";

const fixtureRoot = path.resolve(import.meta.dirname, "..");
const events = JSON.parse(await readFile(path.join(fixtureRoot, "data/incident-events.json"), "utf8"));
const report = buildTimeline(events);
await mkdir(path.join(fixtureRoot, "reports"), { recursive: true });
await writeFile(path.join(fixtureRoot, "reports/incident-timeline.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
