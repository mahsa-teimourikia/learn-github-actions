import path from "node:path";
import { readJson } from "../src/maintenance.mjs";

const fixtureRoot = path.resolve(import.meta.dirname, "..");
const decision = await readJson(path.join(fixtureRoot, "reports/decision.json"), null);
if (!decision) throw new Error("decision evidence is missing");
if (decision.terminal !== "success") {
  console.error(`::error title=Maintenance ${decision.failureClass}::${decision.reasonCode}; inspect the retained operations evidence`);
  process.exitCode = 1;
} else {
  console.log(`maintenance terminal state: ${decision.terminal}`);
}
