import { createHash } from "node:crypto";

export const environments = Object.freeze(["staging", "production"]);
export const components = Object.freeze(["api", "worker", "web"]);

export function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new TypeError(`expected a boolean, received ${JSON.stringify(value)}`);
}

export function parseComponents(value) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new TypeError(`components_json must be valid JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new TypeError("components_json must be a non-empty JSON array");
  }
  const unique = [...new Set(parsed)];
  for (const component of unique) {
    if (!components.includes(component)) {
      throw new RangeError(`unsupported component: ${component}`);
    }
  }
  return unique;
}

export function buildMatrix(selectedComponents) {
  const matrix = {
    component: selectedComponents,
    node: ["22", "24"],
    exclude: [],
    include: [],
  };
  if (selectedComponents.includes("worker")) {
    matrix.exclude.push({ component: "worker", node: "22" });
  }
  if (selectedComponents.includes("web")) {
    matrix.include.push({ component: "web", node: "24", experimental: true });
  }
  return matrix;
}

export function createPlan({ environment, dryRun, componentsJson, revision = "local" }) {
  if (!environments.includes(environment)) {
    throw new RangeError(`unsupported environment: ${environment}`);
  }
  const selectedComponents = parseComponents(componentsJson);
  const normalizedDryRun = parseBoolean(dryRun);
  const identity = JSON.stringify({ environment, normalizedDryRun, selectedComponents, revision });
  return {
    plan_id: createHash("sha256").update(identity).digest("hex").slice(0, 12),
    environment,
    dry_run: normalizedDryRun,
    components: selectedComponents,
    matrix: buildMatrix(selectedComponents),
    should_release: !normalizedDryRun,
    revision,
  };
}

export function matrixSize(matrix) {
  const combinations = matrix.component.length * matrix.node.length;
  const excluded = matrix.exclude.filter(
    (entry) => matrix.component.includes(entry.component) && matrix.node.includes(entry.node),
  ).length;
  const added = matrix.include.filter(
    (entry) => !matrix.component.includes(entry.component) || !matrix.node.includes(entry.node),
  ).length;
  return combinations - excluded + added;
}
