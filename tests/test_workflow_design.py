from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LESSON = ROOT / "curriculum/intermediate/01-workflow-design"
STARTER = LESSON / "exercises/01-baseline-monorepo-ci.yml"
SOLUTION = LESSON / "solutions/01-selective-monorepo-ci.yml"
REUSABLE = LESSON / "solutions/02-reusable-service-ci.yml"
FIXTURE = LESSON / "monorepo-fixture"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class WorkflowDesignTests(unittest.TestCase):
    def test_course_is_workflow_native_and_complete(self) -> None:
        for path in (
            LESSON / "README.md",
            LESSON / "exercises/README.md",
            STARTER,
            SOLUTION,
            REUSABLE,
            LESSON / "solutions/README.md",
            FIXTURE / "package-lock.json",
            FIXTURE / "service-graph.json",
            FIXTURE / "change-cases.json",
        ):
            self.assertTrue(path.exists(), path)
        self.assertFalse(list(LESSON.glob("*.ipynb")))
        self.assertFalse((LESSON / "lab.py").exists())

    def test_starter_is_a_safe_measurable_baseline(self) -> None:
        workflow = read(STARTER)
        for control in (
            "workflow_dispatch:",
            "permissions:\n  contents: read",
            "cancel-in-progress: true",
            "fail-fast: false",
            "max-parallel: 3",
            "Required CI",
        ):
            self.assertIn(control, workflow)
        self.assertNotIn("fromJSON", workflow)
        self.assertNotIn("workflow_call", workflow)

    def test_solution_has_a_bounded_selective_graph_and_stable_gate(self) -> None:
        workflow = read(SOLUTION)
        for control in (
            "fetch-depth: 0",
            "persist-credentials: false",
            "matrix: ${{ fromJSON(needs.plan.outputs.matrix) }}",
            "if: ${{ needs.plan.outputs.run-services == 'true' }}",
            "fail-fast: false",
            "max-parallel: 3",
            "uses: ./.github/workflows/lab-reusable-service-ci.yml",
            "if: ${{ always() && !cancelled() }}",
            "test \"$SERVICE_RESULT\" = \"success\"",
            "Required CI",
        ):
            self.assertIn(control, workflow)
        self.assertNotIn("pull_request_target", workflow)

    def test_reusable_workflow_exposes_and_validates_a_v1_contract(self) -> None:
        workflow = read(REUSABLE)
        for contract in (
            "workflow_call:",
            "contract-version:",
            "fixture-root:",
            "service-directory:",
            "test \"$CONTRACT_VERSION\" = \"v1\"",
            "catalog|checkout|notifications",
            "actions/upload-artifact@v7",
            "if-no-files-found: error",
            "retention-days: 7",
        ):
            self.assertIn(contract, workflow)

    def test_planner_unit_tests_and_labeled_evaluation_pass(self) -> None:
        commands = (
            ("npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund"),
            ("npm", "test"),
            ("npm", "run", "evaluate"),
        )
        results = []
        for command in commands:
            result = subprocess.run(
                command,
                cwd=FIXTURE,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            results.append(result)
        evaluation = json.loads(results[-1].stdout.strip().splitlines()[-1])
        self.assertEqual(evaluation["exactCaseRate"], 1)
        self.assertEqual(evaluation["jobsAvoided"], 6)

    def test_planner_writes_structured_outputs_and_summary(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "output.txt"
            summary = Path(directory) / "summary.md"
            result = subprocess.run(
                ("node", "scripts/plan-changes.mjs"),
                cwd=FIXTURE,
                env={
                    **os.environ,
                    "CHANGED_FILES_JSON": '["services/catalog/src/catalog.mjs"]',
                    "GITHUB_OUTPUT": str(output),
                    "GITHUB_STEP_SUMMARY": str(summary),
                },
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            outputs = output.read_text(encoding="utf-8")
            self.assertIn('"service":"catalog"', outputs)
            self.assertIn('"service":"checkout"', outputs)
            self.assertIn("selected_count=2", outputs)
            self.assertIn("jobs_avoided=1", outputs)
            self.assertIn("catalog changed", summary.read_text(encoding="utf-8"))

    def test_failure_fixtures_cover_distinct_design_risks(self) -> None:
        shallow = read(LESSON / "fixtures/shallow-history.yml.txt")
        required = read(LESSON / "fixtures/path-filter-required-check.yml.txt")
        cache = read(LESSON / "fixtures/cache-poisoning.yml.txt")
        self.assertIn("git diff", shallow)
        self.assertIn("paths:", required)
        self.assertIn("remain pending", required)
        self.assertIn("cache-mode: write", cache)


if __name__ == "__main__":
    unittest.main()
