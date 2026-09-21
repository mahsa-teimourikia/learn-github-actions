import assert from "node:assert/strict";
import { components } from "../src/release-plan.mjs";

const component = process.env.COMPONENT;
const nodeVersion = process.env.NODE_VERSION;
const experimental = process.env.EXPERIMENTAL === "true";

assert.ok(components.includes(component), `unsupported component ${component}`);
assert.ok(["22", "24"].includes(nodeVersion), `unsupported Node.js version ${nodeVersion}`);
assert.notEqual(component === "worker" && nodeVersion === "22", true, "worker requires Node.js 24");

if (process.env.FAIL_COMPONENT === component) {
  throw new Error(`intentional lab failure for ${component}`);
}

console.log(JSON.stringify({ component, nodeVersion, experimental, status: "validated" }));
