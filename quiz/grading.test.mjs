import assert from "node:assert/strict";
import test from "node:test";
import { gradeQuiz, isExactMatch, normalizeSelection } from "./grading.js";
import { questions } from "./questions.js";

test("the quiz has 18 questions in six balanced categories", () => {
  assert.equal(questions.length, 18);
  const counts = questions.reduce((all, q) => ({ ...all, [q.category]: (all[q.category] ?? 0) + 1 }), {});
  assert.equal(Object.keys(counts).length, 6);
  assert.deepEqual([...new Set(Object.values(counts))], [3]);
});
test("every question is valid and multi-answer", () => {
  for (const q of questions) { assert.ok(q.id && q.prompt && q.explanation && q.source.url); assert.ok(q.options.length >= 4); assert.ok(q.correct.length >= 2); assert.equal(new Set(q.correct).size, q.correct.length); assert.ok(q.correct.every((index) => index >= 0 && index < q.options.length)); }
});
test("normalization removes duplicates and sorts", () => { assert.deepEqual(normalizeSelection(["3", 1, 3, 0]), [0, 1, 3]); });
test("grading requires an exact answer set", () => { assert.equal(isExactMatch([2, 0], [0, 2]), true); assert.equal(isExactMatch([0], [0, 2]), false); assert.equal(isExactMatch([0, 1, 2], [0, 2]), false); });
test("complete answer key earns 100 percent", () => { const selections = Object.fromEntries(questions.map((q) => [q.id, q.correct])); const result = gradeQuiz(questions, selections); assert.equal(result.percent, 100); assert.equal(result.correctCount, 18); });
test("unanswered questions are incorrect", () => { const result = gradeQuiz(questions, {}); assert.equal(result.answeredCount, 0); assert.equal(result.correctCount, 0); assert.equal(result.percent, 0); });
