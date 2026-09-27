import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function statePath(environment) {
  return join(process.env.STATE_DIR ?? ".state", `${environment}.json`);
}

export function readState(environment) {
  return JSON.parse(readFileSync(statePath(environment), "utf8"));
}

export function writeState(state) {
  const directory = process.env.STATE_DIR ?? ".state";
  mkdirSync(directory, { recursive: true });
  writeFileSync(statePath(state.environment), `${JSON.stringify(state, null, 2)}\n`);
}
