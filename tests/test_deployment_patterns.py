from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LESSON = ROOT / "curriculum/intermediate/02-deployment-patterns"
STARTER = LESSON / "exercises/01-release-pipeline-starter.yml"
SOLUTION = LESSON / "solutions/01-hardened-release-pipeline.yml"
FIXTURE = LESSON / "release-fixture"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class DeploymentPatternsTests(unittest.TestCase):
    def test_course_is_workflow_native_and_complete(self) -> None:
        for path in (
            LESSON / "README.md",
            LESSON / "exercises/README.md",
            STARTER,
            SOLUTION,
            LESSON / "solutions/README.md",
            FIXTURE / "package-lock.json",
            FIXTURE / "app/release-input.json",
        ):
            self.assertTrue(path.exists(), path)
        self.assertFalse(list(LESSON.glob("*.ipynb")))
        self.assertFalse((LESSON / "lab.py").exists())

    def test_starter_builds_once_and_promotes_a_verified_artifact(self) -> None:
        workflow = read(STARTER)
        for control in (
            "permissions:\n  contents: read",
            "persist-credentials: false",
            "Build the release once",
            "actions/upload-artifact@v7",
            "actions/download-artifact@v8",
            "EXPECTED_DIGEST: ${{ needs.build.outputs.digest }}",
            "environment: lab-staging",
            "IDEMPOTENCY_KEY:",
        ):
            self.assertIn(control, workflow)
        self.assertEqual(workflow.count("npm run build"), 1)
        self.assertNotIn("id-token: write", workflow)

    def test_solution_models_protected_reconciling_rollout(self) -> None:
        workflow = read(SOLUTION)
        for control in (
            "Build immutable release",
            "Verify on a fresh runner",
            "environment: lab-production",
            "group: deploy-lab-production",
            "cancel-in-progress: false",
            "continue-on-error: true",
            "Reconcile an uncertain outcome",
            "safe_to_retry == 'true'",
            "Retry only a proven pre-write failure",
            "Evaluate canary signals",
            "Roll back an unhealthy canary",
            "EXPECTED_CURRENT_DIGEST: ${{ needs.build.outputs.digest }}",
            "Canary failed; rollback completed",
            "oidc-trust-contract-${{ github.sha }}",
        ):
            self.assertIn(control, workflow)
        self.assertEqual(workflow.count("npm run build"), 1)
        self.assertNotIn("pull_request_target", workflow)
        self.assertNotIn("contents: write", workflow)
        self.assertNotIn("id-token: write", workflow)

    def test_fixture_tests_build_verify_and_evaluation_pass(self) -> None:
        commands = (
            ("npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund"),
            ("npm", "test"),
            ("npm", "run", "build"),
            ("npm", "run", "verify"),
            ("npm", "run", "evaluate"),
        )
        environment = {
            **os.environ,
            "RELEASE_VERSION": "v1.2.3",
            "RELEASE_COMMIT": "abcdef0123456789abcdef0123456789abcdef01",
            "EXPECTED_VERSION": "v1.2.3",
            "EXPECTED_COMMIT": "abcdef0123456789abcdef0123456789abcdef01",
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
        evaluation = json.loads(results[-1].stdout.strip().splitlines()[-1])
        self.assertEqual(evaluation["reconciliation"], "applied")
        self.assertEqual(evaluation["retryAllowed"], False)
        self.assertEqual(evaluation["rollbackRestoredBaseline"], True)

    def test_after_write_failure_reconciles_to_applied(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            environment = {
                **os.environ,
                "STATE_DIR": directory,
                "TARGET_ENVIRONMENT": "lab-production",
                "IDEMPOTENCY_KEY": "deploy:v1.2.3:abcdef0123456789abcdef0123456789abcdef01",
                "FAILURE_MODE": "after-write",
                "RELEASE_VERSION": "v1.2.3",
                "RELEASE_COMMIT": "abcdef0123456789abcdef0123456789abcdef01",
            }
            build = subprocess.run(
                ("node", "scripts/build-release.mjs"),
                cwd=FIXTURE,
                env=environment,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(build.returncode, 0, build.stdout + build.stderr)
            seed = subprocess.run(
                ("node", "scripts/seed-environment.mjs"),
                cwd=FIXTURE,
                env=environment,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(seed.returncode, 0, seed.stdout + seed.stderr)
            deploy = subprocess.run(
                ("node", "scripts/mock-deploy.mjs"),
                cwd=FIXTURE,
                env=environment,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(deploy.returncode, 75, deploy.stdout + deploy.stderr)
            reconcile = subprocess.run(
                ("node", "scripts/reconcile-deployment.mjs"),
                cwd=FIXTURE,
                env=environment,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(reconcile.returncode, 0, reconcile.stdout + reconcile.stderr)
            self.assertEqual(json.loads(reconcile.stdout)["resolution"], "applied")

    def test_diagnostic_fixtures_separate_major_failure_classes(self) -> None:
        rebuild = read(LESSON / "fixtures/rebuild-during-deploy.yml.txt")
        retry = read(LESSON / "fixtures/blind-retry.yml.txt")
        oidc = read(LESSON / "fixtures/oidc-cloud-template.yml.txt")
        attestation = read(LESSON / "fixtures/attested-release.yml.txt")
        self.assertIn("npm run build", rebuild)
        self.assertEqual(retry.count("deploy --release"), 2)
        self.assertIn("id-token: write", oidc)
        self.assertIn("FULL_COMMIT_SHA", oidc)
        self.assertIn("actions/attest@v4", attestation)
        self.assertIn("gh attestation verify", attestation)


if __name__ == "__main__":
    unittest.main()
