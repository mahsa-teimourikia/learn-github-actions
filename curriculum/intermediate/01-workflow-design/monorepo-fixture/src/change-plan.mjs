import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const graphPath = fileURLToPath(new URL("../service-graph.json", import.meta.url));
export const graph = JSON.parse(readFileSync(graphPath, "utf8"));

const round = (value) => Math.round(value * 10) / 10;

function matchesPath(file, path) {
  return path.endsWith("/") ? file.startsWith(path) : file === path;
}

function dependentServices(component) {
  const affected = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const [service, definition] of Object.entries(graph.services)) {
      if (
        service === component ||
        definition.dependsOn.some((dependency) => dependency === component || affected.has(dependency))
      ) {
        if (!affected.has(service)) {
          affected.add(service);
          changed = true;
        }
      }
    }
  }
  return affected;
}

export function planChanges(changedFiles, { baseline = false } = {}) {
  if (!Array.isArray(changedFiles) || changedFiles.some((file) => typeof file !== "string")) {
    throw new TypeError("changedFiles must be an array of path strings");
  }

  const files = [...new Set(changedFiles.map((file) => file.trim()).filter(Boolean))].sort();
  const selected = new Set();
  const reasons = new Map();
  let failSafe = false;

  const add = (service, reason) => {
    selected.add(service);
    const current = reasons.get(service) ?? new Set();
    current.add(reason);
    reasons.set(service, current);
  };

  if (baseline) {
    for (const service of Object.keys(graph.services)) add(service, "baseline runs every service");
  } else {
    for (const file of files) {
      if (graph.ignoredPaths.some((path) => matchesPath(file, path))) continue;

      if (graph.globalPaths.some((path) => matchesPath(file, path))) {
        for (const service of Object.keys(graph.services)) add(service, `global input: ${file}`);
        continue;
      }

      let matched = false;
      for (const [service, definition] of Object.entries(graph.services)) {
        if (matchesPath(file, `${definition.directory}/`)) {
          for (const dependent of dependentServices(service)) add(dependent, `${service} changed: ${file}`);
          matched = true;
        }
      }
      for (const [library, definition] of Object.entries(graph.libraries)) {
        if (matchesPath(file, `${definition.directory}/`)) {
          for (const dependent of dependentServices(library)) add(dependent, `${library} changed: ${file}`);
          matched = true;
        }
      }

      if (!matched) {
        failSafe = true;
        for (const service of Object.keys(graph.services)) add(service, `unmapped path fail-safe: ${file}`);
      }
    }
  }

  const services = [...selected].sort();
  const allServices = Object.keys(graph.services);
  const runnerMinutes = services.reduce(
    (total, service) => total + graph.services[service].estimatedMinutes,
    0,
  );
  const criticalPathMinutes = services.length
    ? 0.4 + Math.max(...services.map((service) => graph.services[service].estimatedMinutes))
    : 0.4;

  return {
    changedFiles: files,
    services,
    matrix: {
      include: services.map((service) => ({
        service,
        directory: graph.services[service].directory,
      })),
    },
    reasons: Object.fromEntries(
      services.map((service) => [service, [...reasons.get(service)].sort()]),
    ),
    metrics: {
      selectedJobs: services.length,
      jobsAvoided: allServices.length - services.length,
      selectionRatio: round(services.length / allServices.length),
      estimatedRunnerMinutes: round(runnerMinutes + 0.4),
      estimatedCriticalPathMinutes: round(criticalPathMinutes),
    },
    failSafe,
  };
}
