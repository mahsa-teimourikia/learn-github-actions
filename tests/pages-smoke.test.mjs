import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

test("built site contains Hub, lesson registry, brand asset, and quiz", async () => {
  const hub = await readFile(resolve(root, "site/index.html"), "utf8");
  const content = await readFile(resolve(root, "site/content.js"), "utf8");
  const quiz = await readFile(resolve(root, "site/quiz/index.html"), "utf8");
  await readFile(resolve(root, "site/assets/one-plus-i.png"));
  assert.match(hub, /GitHub Actions Learning Hub/);
  assert.match(hub, /workflow-native labs/);
  assert.equal((content.match(/id: "/g) || []).length, 6);
  assert.doesNotMatch(content, /\.ipynb|lab\.py/);
  assert.match(content, /labGuide:/);
  assert.match(content, /starter:/);
  assert.match(content, /solution:/);
  assert.match(quiz, /GitHub Actions Knowledge Check/);
});
