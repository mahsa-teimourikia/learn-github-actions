import { createEnvironmentState } from "../src/release-lifecycle.mjs";
import { writeState } from "../src/state-store.mjs";

const environment = process.env.TARGET_ENVIRONMENT ?? process.argv[2] ?? "staging";
const state = createEnvironmentState(environment);
writeState(state);
console.log(JSON.stringify(state));
