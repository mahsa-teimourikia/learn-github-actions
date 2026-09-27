from __future__ import annotations

import json
import re
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LESSON = ROOT / "curriculum/advanced/02-debugging-and-operations"
STARTER = LESSON / "exercises/01-incident-operations-starter.yml"
SOLUTION = LESSON / "solutions/01-evidence-led-operations.yml"
FIXTURE = LESSON / "operations-fixture"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class DebuggingOperationsTests(unittest.TestCase):
    def test_course_is_workflow_native_and_complete(self) -> None:
        for path in (
            LESSON / "README.md",
            LESSON / "exercises/README.md",
            STARTER,
            SOLUTION,
            LESSON / "solutions/README.md",
            FIXTURE / "package-lock.json",
            FIXTURE / "data/run-history.json",
            FIXTURE / "data/incident-events.json",
        ):
            self.assertTrue(path.exists(), path)
        self.assertFalse(list(LESSON.glob("*.ipynb")))
        self.assertFalse((LESSON / "lab.py").exists())

    def test_runnable_workflows_are_bounded_read_only_and_pinned(self) -> None:
        for path in (STARTER, SOLUTION):
            workflow = read(path)
            self.assertIn("permissions:\n  contents: read", workflow)
            self.assertIn("persist-credentials: false", workflow)
            self.assertIn("timeout-minutes:", workflow)
            self.assertIn("cancel-in-progress: false", workflow)
            self.assertNotIn("issues: write", workflow)
            self.assertNotIn("id-token: write", workflow)
            self.assertNotIn("contents: write", workflow)
            self.assertNotIn("runs-on: self-hosted", workflow)
            references = re.findall(r"uses:\s*([^\s#]+)", workflow)
            self.assertTrue(references)
            for reference in references:
                if not reference.startswith("./"):
                    self.assertRegex(reference.rsplit("@", 1)[-1], r"^[0-9a-f]{40}$")

    def test_solution_reconciles_and_preserves_true_conclusions(self) -> None:
        workflow = read(SOLUTION)
        for control in (
            "IDEMPOTENCY_KEY: maintenance:${{ github.run_id }}",
            "npm run reconcile",
            "steps.reconcile.outputs.safe_to_retry == 'true'",
            "if: ${{ always() && !cancelled() }}",
            "maintenance-evidence-${{ github.run_id }}-${{ github.run_attempt }}",
            "needs: [operate, analyze]",
            'test "$OPERATE_RESULT" = "success"',
            'test "$ANALYZE_RESULT" = "success"',
        ):
            self.assertIn(control, workflow)

    def test_fixture_tests_metrics_and_timeline_pass(self) -> None:
        for command in (
            ("npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund"),
            ("npm", "test"),
            ("npm", "run", "evaluate"),
        ):
            result = subprocess.run(command, cwd=FIXTURE, capture_output=True, text=True, check=False)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

        metrics = json.loads((FIXTURE / "reports/sli-report.json").read_text(encoding="utf-8"))
        timeline = json.loads((FIXTURE / "reports/incident-timeline.json").read_text(encoding="utf-8"))
        self.assertEqual(metrics["runCount"], 10)
        self.assertEqual(metrics["logicalRunCount"], 9)
        self.assertEqual(metrics["scheduleDeliveryRate"], 0.75)
        self.assertEqual(metrics["terminalSuccessRate"], 0.7)
        self.assertEqual(metrics["queueP95Seconds"], 600)
        self.assertEqual(metrics["runnerMinutes"], 76)
        self.assertEqual(metrics["objectives"], {
            "scheduleDelivery": False,
            "terminalSuccess": False,
            "queueP95": False,
            "durationP95": True,
        })
        self.assertEqual(timeline["timeToDetectSeconds"], 190)
        self.assertEqual(timeline["timeToRecoverSeconds"], 211)
        self.assertFalse(timeline["retryAttempted"])
        self.assertIn("response was lost after the write", timeline["rootCause"])

    def test_review_fixtures_are_non_executable_and_cover_distinct_failures(self) -> None:
        fixtures = sorted((LESSON / "fixtures").glob("*.yml.txt"))
        self.assertEqual(len(fixtures), 5)
        text = "\n".join(read(path) for path in fixtures)
        for marker in (
            "for attempt in 1 2 3",
            "needs: operate",
            "toJSON(github)",
            "issues: write",
            "actions/checkout@main",
        ):
            self.assertIn(marker, text)
        self.assertFalse(list((LESSON / "fixtures").glob("*.yml")))

    def test_lab_requires_real_attempt_and_operational_evidence(self) -> None:
        guide = read(LESSON / "exercises/README.md")
        for expectation in (
            "gh run view RUN_ID --attempt 1",
            "gh run rerun RUN_ID --failed",
            "transient-before-write",
            "transient-after-write",
            "schedule delivery `0.75`",
            "Completion evidence",
        ):
            self.assertIn(expectation, guide)


if __name__ == "__main__":
    unittest.main()
