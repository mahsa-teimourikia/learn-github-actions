from __future__ import annotations

import json
import os
import re
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LESSON = ROOT / "curriculum/beginner/02-workflow-syntax"
STARTER = LESSON / "exercises/01-release-orchestration-starter.yml"
SOLUTION = LESSON / "solutions/01-release-orchestration.yml"
FIXTURE = LESSON / "release-fixture"
WORKSHOP = LESSON / "actionlint-workshop"
ACTIONLINT_SOLUTION = LESSON / "solutions/02-actionlint-clean.yml"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class WorkflowSyntaxTests(unittest.TestCase):
    def test_lesson_is_workflow_native_and_complete(self) -> None:
        for path in (
            LESSON / "README.md",
            LESSON / "exercises/README.md",
            STARTER,
            SOLUTION,
            LESSON / "solutions/README.md",
            FIXTURE / "package-lock.json",
            WORKSHOP / "README.md",
            WORKSHOP / "package-lock.json",
            WORKSHOP / "diagnostics.json",
            ACTIONLINT_SOLUTION,
        ):
            self.assertTrue(path.exists(), path)
        self.assertFalse(list(LESSON.glob("*.ipynb")))
        self.assertFalse((LESSON / "lab.py").exists())

    def test_starter_is_runnable_but_preserves_progressive_work(self) -> None:
        workflow = read(STARTER)
        self.assertIn("workflow_dispatch:", workflow)
        self.assertIn("permissions:\n  contents: read", workflow)
        self.assertIn("id: release_plan", workflow)
        self.assertIn("Exercise 2", workflow)
        self.assertNotIn("matrix: ${{ fromJSON(needs.plan.outputs.matrix) }}", workflow)
        self.assertNotIn("services:", workflow)

    def test_solution_covers_the_core_syntax_contract(self) -> None:
        workflow = read(SOLUTION)
        expected = (
            "run-name: >-",
            "type: boolean",
            "permissions:\n  contents: read",
            "cancel-in-progress: false",
            "outputs:",
            "GITHUB_STEP_SUMMARY",
            "fromJSON(needs.plan.outputs.matrix)",
            "continue-on-error: ${{ matrix.experimental || false }}",
            "fail-fast: false",
            "max-parallel: 2",
            "services:",
            "job.services.redis.ports['6379']",
            "container:",
            "always() && !cancelled()",
            "permissions: {}",
        )
        for syntax in expected:
            self.assertIn(syntax, workflow)

    def test_solution_uses_environment_boundaries_for_dynamic_shell_data(self) -> None:
        workflow = read(SOLUTION)
        self.assertIn("TARGET_ENVIRONMENT: ${{ inputs.environment", workflow)
        self.assertIn("COMPONENTS_JSON: ${{ inputs.components_json", workflow)
        self.assertNotIn('run: echo "${{ inputs.', workflow)
        self.assertNotIn('run: echo "${{ github.event.', workflow)

    def test_broken_fixtures_teach_distinct_failures(self) -> None:
        interpolation = read(LESSON / "fixtures/direct-interpolation.yml.txt")
        dependency = read(LESSON / "fixtures/missing-needs.yml.txt")
        boolean = read(LESSON / "fixtures/string-boolean.yml.txt")
        self.assertIn('${{ github.event.issue.title }}', interpolation)
        self.assertIn("needs.plan.outputs.matrix", dependency)
        self.assertNotIn("needs: plan", dependency)
        self.assertIn("github.event.inputs.dry_run == false", boolean)

    def test_actionlint_workshop_has_six_measured_non_executable_cases(self) -> None:
        manifest = json.loads(read(WORKSHOP / "diagnostics.json"))
        fixtures = sorted((WORKSHOP / "fixtures").glob("*.yml.txt"))
        self.assertEqual(len(fixtures), 6)
        self.assertEqual(len(manifest["cases"]), 6)
        self.assertEqual(
            {kind for case in manifest["cases"] for kind in case["expectedKinds"]},
            {"syntax-check", "expression", "job-needs", "matrix", "action"},
        )
        self.assertFalse(list((WORKSHOP / "fixtures").glob("*.yml")))
        self.assertIn("-shellcheck=", read(WORKSHOP / "scripts/verify-diagnostics.mjs"))
        self.assertIn("-pyflakes=", read(WORKSHOP / "scripts/verify-diagnostics.mjs"))

    def test_actionlint_reference_is_safe_pinned_and_clean_by_contract(self) -> None:
        workflow = read(ACTIONLINT_SOLUTION)
        self.assertIn("permissions:\n  contents: read", workflow)
        self.assertIn("persist-credentials: false", workflow)
        self.assertIn("ISSUE_TITLE: ${{ github.event.issue.title", workflow)
        self.assertIn('run: printf \'%s\\n\' "$ISSUE_TITLE"', workflow)
        self.assertNotIn('run: echo "${{ github.event.', workflow)
        references = re.findall(r"uses:\s*([^\s#]+)", workflow)
        for reference in references:
            if not reference.startswith("./"):
                self.assertRegex(reference.rsplit("@", 1)[-1], r"^[0-9a-f]{40}$")

    def test_syntax_validation_uses_verified_binary_and_pinned_actions(self) -> None:
        validation = read(ROOT / ".github/workflows/validate-syntax-course.yml")
        self.assertIn("ACTIONLINT_VERSION: \"1.7.12\"", validation)
        self.assertIn("8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8", validation)
        self.assertIn("npm run verify", validation)
        self.assertNotIn("rhysd/actionlint:1.7.12", validation)
        for reference in re.findall(r"uses:\s*([^\s#]+)", validation):
            self.assertRegex(reference.rsplit("@", 1)[-1], r"^[0-9a-f]{40}$")

    def test_fixture_unit_tests_and_local_plan_pass(self) -> None:
        commands = (
            ("npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund"),
            ("npm", "test"),
            ("npm", "run", "plan"),
        )
        environment = {
            **os.environ,
            "TARGET_ENVIRONMENT": "staging",
            "DRY_RUN": "true",
            "COMPONENTS_JSON": '["api","worker","web"]',
        }
        results = []
        for command in commands:
            result = subprocess.run(
                command,
                cwd=FIXTURE,
                env=environment,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            results.append(result)
        plan = json.loads(results[-1].stdout.strip().splitlines()[-1])
        self.assertEqual(plan["environment"], "staging")
        self.assertEqual(plan["should_release"], False)
        self.assertEqual(len(plan["matrix"]["component"]), 3)

    def test_fixture_writes_github_outputs_and_summary(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "output.txt"
            summary = Path(directory) / "summary.md"
            result = subprocess.run(
                ("node", "scripts/create-plan.mjs"),
                cwd=FIXTURE,
                env={
                    **os.environ,
                    "TARGET_ENVIRONMENT": "production",
                    "DRY_RUN": "false",
                    "COMPONENTS_JSON": '["web"]',
                    "GITHUB_SHA": "release-sha",
                    "GITHUB_OUTPUT": str(output),
                    "GITHUB_STEP_SUMMARY": str(summary),
                },
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("should_release=true", output.read_text(encoding="utf-8"))
            self.assertIn("## Release plan", summary.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
