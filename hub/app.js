import { lessons } from "./content.js";

const storageKey = "learn-github-actions-progress-v2";
const state = { selected: lessons[0].id, level: "all", tab: "learn", complete: loadProgress() };
const list = document.querySelector("#lesson-list");
const title = document.querySelector("#lesson-title");
const level = document.querySelector("#lesson-level");
const summary = document.querySelector("#lesson-summary");
const content = document.querySelector("#tab-content");
const complete = document.querySelector("#lesson-complete");
const progress = document.querySelector("#course-progress");
const progressCopy = document.querySelector("#progress-copy");

function loadProgress() { try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; } }
function current() { return lessons.find((lesson) => lesson.id === state.selected) || lessons[0]; }
function renderList() {
  list.innerHTML = lessons.filter((lesson) => state.level === "all" || lesson.level === state.level).map((lesson) => `<button type="button" class="lesson-link ${lesson.id === state.selected ? "active" : ""}" data-id="${lesson.id}"><span>${lesson.level} ${lesson.step}</span><strong>${lesson.title}</strong><small>${state.complete[lesson.id] ? "Completed" : "Not completed"}</small></button>`).join("");
}
function renderContent() {
  const lesson = current();
  title.textContent = lesson.title; level.textContent = `${lesson.level} · lesson ${lesson.step}`; summary.textContent = lesson.summary; complete.checked = Boolean(state.complete[lesson.id]);
  if (state.tab === "learn") content.innerHTML = `<h3>Learning outcomes</h3><ul>${lesson.outcomes.map((outcome) => `<li>${outcome}</li>`).join("")}</ul><p><a class="primary" href="${lesson.links.readme}">Open the technical chapter</a></p>`;
  if (state.tab === "lab") content.innerHTML = `<h3>Hands-on work</h3><p>Use a practice branch or fork. Install the starter under <code>.github/workflows/</code>, inspect real runs and failures, then compare your result with the reference implementation.</p><div class="resource-grid"><a href="${lesson.links.labGuide}"><strong>Lab guide</strong><span>Scenario and evidence</span></a><a href="${lesson.links.starter}"><strong>Starter workflow</strong><span>Implement and run</span></a><a href="${lesson.links.solution}"><strong>Reference workflow</strong><span>Review after the lab</span></a></div>`;
  if (state.tab === "checkpoint") content.innerHTML = `<h3>Checkpoint</h3><fieldset><legend>${lesson.checkpoint.question}</legend>${lesson.checkpoint.options.map((option, index) => `<label><input type="radio" name="checkpoint" value="${index}"> ${option}</label>`).join("")}</fieldset><button class="secondary" id="check-answer" type="button">Check answer</button><p id="checkpoint-result" aria-live="polite"></p>`;
  if (state.tab === "checkpoint") document.querySelector("#check-answer").addEventListener("click", () => { const chosen = document.querySelector('input[name="checkpoint"]:checked'); const result = document.querySelector("#checkpoint-result"); if (!chosen) { result.textContent = "Choose an answer first."; return; } result.textContent = Number(chosen.value) === lesson.checkpoint.answer ? `Correct. ${lesson.checkpoint.explanation}` : `Not yet. ${lesson.checkpoint.explanation}`; });
}
function renderProgress() { const count = lessons.filter((lesson) => state.complete[lesson.id]).length; progress.value = count; progressCopy.textContent = `${count} of ${lessons.length} lessons complete`; }
function render() { renderList(); renderContent(); renderProgress(); }

list.addEventListener("click", (event) => { const button = event.target.closest("[data-id]"); if (!button) return; state.selected = button.dataset.id; state.tab = "learn"; document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "learn")); render(); });
document.querySelectorAll(".filter").forEach((button) => button.addEventListener("click", () => { state.level = button.dataset.level; document.querySelectorAll(".filter").forEach((item) => item.classList.toggle("active", item === button)); const visible = lessons.filter((lesson) => state.level === "all" || lesson.level === state.level); if (!visible.some((lesson) => lesson.id === state.selected)) state.selected = visible[0].id; render(); }));
document.querySelectorAll(".tab").forEach((button) => button.addEventListener("click", () => { state.tab = button.dataset.tab; document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === button)); renderContent(); }));
complete.addEventListener("change", () => { state.complete[current().id] = complete.checked; localStorage.setItem(storageKey, JSON.stringify(state.complete)); render(); });
render();
