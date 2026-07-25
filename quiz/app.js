import { gradeQuiz } from "./grading.js";
import { questions } from "./questions.js";

const storageKey = "learn-github-actions-quiz-v1";
const sourceBase = "https://github.com/mahsa-teimourikia/learn-github-actions/blob/main/";
const el = {
  answered: document.querySelector("#answered-count"), categoryCount: document.querySelector("#category-count"), categoryList: document.querySelector("#category-list"), form: document.querySelector("#quiz-form"), total: document.querySelector("#progress-total"), progress: document.querySelector("#progress-track"), questionCount: document.querySelector("#question-count"), list: document.querySelector("#question-list"), reset: document.querySelector("#reset-button"), results: document.querySelector("#results"), review: document.querySelector("#review-button"), retry: document.querySelector("#retry-button"), heading: document.querySelector("#score-heading"), percent: document.querySelector("#score-percent"), summary: document.querySelector("#score-summary"), topics: document.querySelector("#topic-scores"),
};
let selections = load();
let latest = null;
let showingReview = false;

function load() {
  try { const value = JSON.parse(localStorage.getItem(storageKey) ?? "{}"); return value && typeof value === "object" ? value : {}; } catch { return {}; }
}
function save() { localStorage.setItem(storageKey, JSON.stringify(selections)); }
function slug(value) { return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"); }
function answeredTotal() { return questions.filter((q) => (selections[q.id] ?? []).length > 0).length; }

function renderCategories() {
  const counts = questions.reduce((all, q) => ({ ...all, [q.category]: (all[q.category] ?? 0) + 1 }), {});
  el.categoryCount.textContent = Object.keys(counts).length;
  el.categoryList.innerHTML = Object.entries(counts).map(([category, count]) => `<a class="category-link" href="#category-${slug(category)}"><span>${category}</span><span>${count}</span></a>`).join("");
}

function renderQuestions() {
  let previous = null;
  el.list.innerHTML = questions.map((q, index) => {
    const selected = new Set(selections[q.id] ?? []);
    const anchor = q.category !== previous ? `id="category-${slug(q.category)}"` : "";
    previous = q.category;
    const options = q.options.map((option, optionIndex) => `<label class="option" data-option-index="${optionIndex}"><input type="checkbox" name="${q.id}" value="${optionIndex}" ${selected.has(optionIndex) ? "checked" : ""}><span>${option}</span></label>`).join("");
    return `<article class="question-card" data-question-id="${q.id}" ${anchor}><div class="question-meta"><div><span class="category-pill">${q.category}</span><span class="question-number">Question ${index + 1}</span></div><span class="answer-status" hidden></span></div><fieldset><legend>${q.prompt}</legend><div class="option-list">${options}</div></fieldset><div class="review-panel" hidden><h3>Correct answer</h3><p class="correct-answer-copy"></p><p>${q.explanation}</p><p><a href="${sourceBase}${q.source.url}">Review: ${q.source.label}</a></p></div></article>`;
  }).join("");
}

function updateProgress() { const count = answeredTotal(); el.answered.textContent = count; el.progress.max = questions.length; el.progress.value = count; el.progress.textContent = `${count} of ${questions.length} answered`; }
function clearPresentation() {
  latest = null; showingReview = false; el.results.hidden = true;
  document.querySelectorAll(".question-card").forEach((card) => { card.classList.remove("is-correct", "is-incorrect"); card.querySelector(".answer-status").hidden = true; card.querySelector(".review-panel").hidden = true; card.querySelectorAll(".option").forEach((option) => option.classList.remove("is-answer", "is-selected-wrong")); });
}
function grade() {
  latest = gradeQuiz(questions, selections); el.results.hidden = false; el.percent.textContent = `${latest.percent}%`; el.results.style.setProperty("--score-angle", `${latest.percent * 3.6}deg`); el.heading.textContent = latest.percent >= 85 ? "Strong Actions understanding" : latest.percent >= 65 ? "Solid foundation—keep refining" : "Good start—review the explanations"; el.summary.textContent = `You answered ${latest.correctCount} of ${latest.total} questions correctly and completed ${latest.answeredCount} of ${latest.total}.`; el.review.textContent = "View correct answers";
  el.topics.innerHTML = Object.entries(latest.categories).map(([category, score]) => `<li class="topic-score"><span>${category}</span><strong>${score.correct}/${score.total}</strong></li>`).join("");
  latest.details.forEach((detail) => { const card = document.querySelector(`[data-question-id="${detail.id}"]`); const status = card.querySelector(".answer-status"); card.classList.toggle("is-correct", detail.correct); card.classList.toggle("is-incorrect", !detail.correct); status.hidden = false; status.className = `answer-status ${detail.correct ? "correct" : "incorrect"}`; status.textContent = detail.correct ? "Correct" : "Needs review"; });
  el.results.scrollIntoView({ behavior: "smooth", block: "center" });
}
function review() {
  if (!latest) return; showingReview = !showingReview; el.review.textContent = showingReview ? "Hide correct answers" : "View correct answers";
  questions.forEach((q) => { const card = document.querySelector(`[data-question-id="${q.id}"]`); const selected = new Set(selections[q.id] ?? []); card.querySelector(".review-panel").hidden = !showingReview; card.querySelector(".correct-answer-copy").textContent = q.correct.map((index) => q.options[index]).join(" • "); card.querySelectorAll(".option").forEach((option, optionIndex) => { option.classList.toggle("is-answer", showingReview && q.correct.includes(optionIndex)); option.classList.toggle("is-selected-wrong", showingReview && selected.has(optionIndex) && !q.correct.includes(optionIndex)); }); });
}

el.form.addEventListener("change", (event) => { const input = event.target; if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return; selections[input.name] = [...el.form.querySelectorAll(`input[name="${input.name}"]:checked`)].map((item) => Number(item.value)); save(); updateProgress(); clearPresentation(); });
el.form.addEventListener("submit", (event) => { event.preventDefault(); grade(); });
el.review.addEventListener("click", review);
el.retry.addEventListener("click", () => { el.results.hidden = true; document.querySelector("#quiz-heading").scrollIntoView({ behavior: "smooth" }); });
el.reset.addEventListener("click", () => { if (!window.confirm("Clear every selected answer and score?")) return; selections = {}; save(); renderQuestions(); updateProgress(); clearPresentation(); });
el.questionCount.textContent = questions.length; el.total.textContent = questions.length; renderCategories(); renderQuestions(); updateProgress();
