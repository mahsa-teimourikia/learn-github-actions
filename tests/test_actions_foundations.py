from __future__ import annotations

import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LESSON = ROOT / "curriculum/beginner/01-actions-foundations"
STARTER = LESSON / "exercises/01-foundations-starter.yml"
SOLUTION = LESSON / "solutions/01-hardened-ci.yml"
SAMPLE_APP = LESSON / "sample-app"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class ActionsFoundationsTests(unittest.TestCase):
    def test_workflow_lab_has_guide_starter_solution_and_fixture(self) -> None:
        for path in (
            LESSON / "exercises/README.md",
            STARTER,
            LESSON / "solutions/README.md",
            SOLUTION,
            SAMPLE_APP / "package-lock.json",
        ):
            self.assertTrue(path.exists(), path)

    def test_notebook_and_python_simulator_are_not_the_lab_interface(self) -> None:
        self.assertFalse(list(LESSON.glob("*.ipynb")))
        self.assertFalse((LESSON / "lab.py").exists())

    def test_starter_is_safe_but_leaves_obvious_lab_work(self) -> None:
        workflow = read(STARTER)
        self.assertIn("permissions:\n  contents: read", workflow)
        self.assertIn("workflow_dispatch:", workflow)
        self.assertIn("Exercise 1", workflow)
        self.assertNotIn("verify_artifact:", workflow)
        self.assertNotIn("upload-artifact", workflow)

    def test_solution_contains_foundational_controls(self) -> None:
        workflow = read(SOLUTION)
        expected = (
            "cache-mode: read",
            "contents: read",
            "cancel-in-progress: true",
            "timeout-minutes: 10",
            "persist-credentials: false",
            "npm ci",
            "if: ${{ !cancelled() }}",
            "actions/upload-artifact@v7",
            "retention-days: 7",
            "northstar-policy-${{ github.sha }}",
            "verify_artifact:",
            "needs: quality",
            "permissions: {}",
            "actions/download-artifact@v8",
            "createHash(\"sha256\")",
        )
        for control in expected:
            self.assertIn(control, workflow)

    def test_solution_verifies_on_a_fresh_runner_without_checkout(self) -> None:
        verify_job = read(SOLUTION).split("  verify_artifact:", 1)[1]
        self.assertNotIn("actions/checkout", verify_job)
        self.assertIn("actions/download-artifact", verify_job)
        self.assertIn("assert.equal", verify_job)

    def test_lab_requires_success_failure_and_trust_evidence(self) -> None:
        guide = read(LESSON / "exercises/README.md")
        for evidence in (
            "one successful run",
            "one intentionally failed run",
            "verified build artifact",
            "trust boundary",
        ):
            self.assertIn(evidence, guide)

    def test_sample_application_executes_the_ci_path(self) -> None:
        commands = (
            ("npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund"),
            ("npm", "run", "test:ci"),
            ("npm", "run", "build"),
            ("npm", "run", "verify:dist"),
        )
        for command in commands:
            result = subprocess.run(
                command,
                cwd=SAMPLE_APP,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
