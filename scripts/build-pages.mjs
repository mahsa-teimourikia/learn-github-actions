import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "site");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, "hub"), output, { recursive: true });
await cp(resolve(root, "quiz"), resolve(output, "quiz"), { recursive: true });
await mkdir(resolve(output, "assets"), { recursive: true });
await cp(resolve(root, "assets/one-plus-i.png"), resolve(output, "assets/one-plus-i.png"));
console.log(`Built static learning site at ${output}`);
