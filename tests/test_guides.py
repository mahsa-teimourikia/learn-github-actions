from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")


class InstallationRunGuideTests(unittest.TestCase):
    def test_installation_guide_covers_three_setup_paths_and_safety(self) -> None:
        guide = read("INSTALLATION.md")
        for expectation in (
            "browser",
            "Node.js 24",
            "Python 3.11",
            "practice fork",
            "There is no root dependency installation step",
            "gh auth login --web",
            "never install a file ending in `.yml.txt`",
            "npm test",
        ):
            self.assertIn(expectation, guide)

    def test_run_guide_covers_local_and_github_execution_lifecycles(self) -> None:
        guide = read("RUN_GUIDE.md")
        for expectation in (
            "npm run build:pages",
            "python3 -m http.server 8000 --directory site",
            "Run one lesson fixture locally",
            "workflow_dispatch",
            "default branch",
            "gh run view RUN_ID --attempt 1",
            "git rm .github/workflows/lab-LESSON.yml",
        ):
            self.assertIn(expectation, guide)
        for lesson in (
            "01-actions-foundations",
            "02-workflow-syntax",
            "01-workflow-design",
            "02-deployment-patterns",
            "01-security-and-reliability",
            "02-debugging-and-operations",
        ):
            self.assertIn(lesson, guide)

    def test_readme_and_hub_make_both_guides_discoverable(self) -> None:
        root_readme = read("README.md")
        hub = read("hub/index.html")
        curriculum = read("curriculum/README.md")
        for document in (root_readme, hub, curriculum):
            self.assertIn("INSTALLATION.md", document)
            self.assertIn("RUN_GUIDE.md", document)


if __name__ == "__main__":
    unittest.main()
