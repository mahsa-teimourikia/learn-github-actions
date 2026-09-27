from __future__ import annotations

import json
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LESSON = ROOT / "curriculum/advanced/01-security-and-reliability"
STARTER = LESSON / "exercises/01-security-gate-starter.yml"
SOLUTION = LESSON / "solutions/01-hardened-security-gate.yml"
FIXTURE = LESSON / "security-fixture"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class SecurityReliabilityTests(unittest.TestCase):
    def test_course_is_workflow_native_and_complete(self) -> None:
        for path in (
            LESSON / "README.md",
            LESSON / "exercises/README.md",
            STARTER,
            SOLUTION,
            LESSON / "solutions/README.md",
            FIXTURE / "package-lock.json",
            FIXTURE / "cases/workflow-cases.json",
            FIXTURE / "cases/authorization-cases.json",
        ):
            self.assertTrue(path.exists(), path)
        self.assertFalse(list(LESSON.glob("*.ipynb")))
        self.assertFalse((LESSON / "lab.py").exists())

    def test_runnable_workflows_are_bounded_and_read_only(self) -> None:
        for workflow in (read(STARTER), read(SOLUTION)):
            self.assertIn("permissions:\n  contents: read", workflow)
            self.assertIn("persist-credentials: false", workflow)
            self.assertIn("timeout-minutes:", workflow)
            self.assertNotIn("pull_request_target", workflow)
            self.assertNotIn("id-token: write", workflow)
            self.assertNotIn("contents: write", workflow)
            self.assertNotIn("runs-on: self-hosted", workflow)

    def test_solution_has_layered_tools_and_fail_closed_gate(self) -> None:
        workflow = read(SOLUTION)
        for control in (
            "step-security/harden-runner@e14015d583714f6e62063499dc959a02595150a1",
            "egress-policy: audit",
            "zizmorcore/zizmor-action@cc914d7f3750a2d13d75c7f184a1060aa0e9d482",
            "version: 1.30.1",
            "online-audits: false",
            "actions/dependency-review-action@a1d282b36b6f3519aa1f3fc636f609c47dddb294",
            "if: ${{ always() && !cancelled() }}",
            "test \"$POLICY_RESULT\" = \"success\"",
            "test \"$ZIZMOR_RESULT\" = \"success\"",
            "test \"$DEPENDENCY_RESULT\" = \"skipped\"",
        ):
            self.assertIn(control, workflow)

    def test_all_external_actions_in_runnable_labs_use_full_sha(self) -> None:
        import re

        for path in (STARTER, SOLUTION):
            references = re.findall(r"uses:\s*([^\s#]+)", read(path))
            self.assertTrue(references)
            for reference in references:
                if reference.startswith("./"):
                    continue
                self.assertRegex(reference.rsplit("@", 1)[-1], r"^[0-9a-f]{40}$")

    def test_fixture_tests_and_evaluations_pass(self) -> None:
        results = []
        for command in (
            ("npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund"),
            ("npm", "test"),
            ("npm", "run", "audit"),
            ("npm", "run", "authorize"),
        ):
            result = subprocess.run(command, cwd=FIXTURE, capture_output=True, text=True, check=False)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            results.append(result)
        risk = json.loads(results[-2].stdout.strip().splitlines()[-1])
        authorization = json.loads(results[-1].stdout.strip().splitlines()[-1])
        self.assertEqual(risk["exactCaseRate"], 1)
        self.assertEqual(risk["vulnerableRisk"], 81)
        self.assertEqual(risk["hardenedRisk"], 0)
        self.assertEqual(risk["criticalOrHighRemaining"], 0)
        self.assertEqual(authorization["exactDecisionRate"], 1)
        self.assertEqual(authorization["denied"], 7)

    def test_vulnerable_fixtures_are_non_executable_and_cover_distinct_paths(self) -> None:
        fixtures = sorted((LESSON / "fixtures/vulnerable").glob("*.yml.txt"))
        self.assertEqual(len(fixtures), 6)
        text = "\n".join(read(path) for path in fixtures)
        for marker in (
            "pull_request_target:",
            "github.event.pull_request.head.sha",
            "github.event.pull_request.title",
            "cache-mode: write",
            "workflow_run:",
            "permissions: write-all",
            "while true",
        ):
            self.assertIn(marker, text)
        self.assertFalse(list((LESSON / "fixtures/vulnerable").glob("*.yml")))


if __name__ == "__main__":
    unittest.main()
