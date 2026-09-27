import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

test("built site contains Hub, lesson registry, brand asset, and quiz", async () => {
  const readme = await readFile(resolve(root, "README.md"), "utf8");
  const hub = await readFile(resolve(root, "site/index.html"), "utf8");
  const content = await readFile(resolve(root, "site/content.js"), "utf8");
  const quiz = await readFile(resolve(root, "site/quiz/index.html"), "utf8");
  await readFile(resolve(root, "site/assets/one-plus-i-on-white.png"));
  assert.match(readme, /href="https:\/\/oneplusi\.io"/);
  assert.match(readme, /src="assets\/one-plus-i-on-white\.png" alt="One\+i" width="112"/);
  assert.match(hub, /GitHub Actions Learning Hub/);
  assert.match(hub, /class="oneplus-mark"/);
  assert.match(hub, /alt="One\+i"/);
  assert.match(hub, /A One\+i learning experience/);
  assert.match(hub, /Created by One\+i/);
  assert.ok((hub.match(/https:\/\/oneplusi\.io/g) || []).length >= 2);
  assert.match(hub, /workflow-native labs/);
  assert.match(hub, /INSTALLATION\.md/);
  assert.match(hub, /RUN_GUIDE\.md/);
  assert.match(hub, />Install</);
  assert.match(hub, />Run guide</);
  assert.equal((content.match(/id: "/g) || []).length, 6);
  assert.doesNotMatch(content, /\.ipynb|lab\.py/);
  assert.match(content, /labGuide:/);
  assert.match(content, /starter:/);
  assert.match(content, /solution:/);
  assert.match(quiz, /GitHub Actions Knowledge Check/);
});
