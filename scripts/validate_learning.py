"""Validate lesson ownership, local links, and workflow-native labs."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS = sorted(ROOT.glob("curriculum/*/[0-9][0-9]-*"))


def validate_lessons() -> None:
    assert len(LESSONS) == 6, f"expected 6 lessons, found {len(LESSONS)}"
    for lesson in LESSONS:
        assert (lesson / "README.md").exists(), lesson / "README.md"
        workflows = [*lesson.rglob("*.yml"), *lesson.rglob("*.yaml")]
        assert workflows, f"{lesson}: expected at least one workflow lab"
        assert not list(lesson.glob("*.ipynb")), f"{lesson}: notebooks are not workflow labs"
        assert not (lesson / "lab.py").exists(), f"{lesson}: use workflow YAML as the lab"


def validate_links() -> None:
    pattern = re.compile(r"!?(?:\[[^]]*\])\(([^)]+)\)")
    failures: list[str] = []
    for markdown in [ROOT / "README.md", *ROOT.glob("curriculum/**/*.md")]:
        for target in pattern.findall(markdown.read_text(encoding="utf-8")):
            clean = target.split("#", 1)[0]
            if not clean or clean.startswith(("http://", "https://", "mailto:")):
                continue
            if not (markdown.parent / clean).resolve().exists():
                failures.append(f"{markdown.relative_to(ROOT)} -> {target}")
    assert not failures, "broken local links:\n" + "\n".join(failures)


def validate_workflows() -> None:
    workflows = sorted([*ROOT.glob("curriculum/**/*.yml"), *ROOT.glob("curriculum/**/*.yaml")])
    assert workflows, "no workflow labs found"
    for workflow in workflows:
        text = workflow.read_text(encoding="utf-8")
        assert re.search(r"(?m)^name:\s*\S", text), f"{workflow}: missing workflow name"
        assert re.search(r"(?m)^on:\s*(?:$|\S)", text), f"{workflow}: missing trigger"
        assert re.search(r"(?m)^jobs:\s*$", text), f"{workflow}: missing jobs"
        assert "\t" not in text, f"{workflow}: YAML contains tabs"
        print(f"validated workflow lab: {workflow.relative_to(ROOT)}")

    foundations = ROOT / "curriculum/beginner/01-actions-foundations"
    assert (foundations / "exercises/README.md").exists()
    assert (foundations / "exercises/01-foundations-starter.yml").exists()
    assert (foundations / "solutions/01-hardened-ci.yml").exists()

    syntax = ROOT / "curriculum/beginner/02-workflow-syntax"
    assert (syntax / "exercises/README.md").exists()
    assert (syntax / "exercises/01-release-orchestration-starter.yml").exists()
    assert (syntax / "solutions/01-release-orchestration.yml").exists()
    assert (syntax / "release-fixture/package-lock.json").exists()

    design = ROOT / "curriculum/intermediate/01-workflow-design"
    assert (design / "exercises/README.md").exists()
    assert (design / "exercises/01-baseline-monorepo-ci.yml").exists()
    assert (design / "solutions/01-selective-monorepo-ci.yml").exists()
    assert (design / "solutions/02-reusable-service-ci.yml").exists()
    assert (design / "monorepo-fixture/package-lock.json").exists()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--workflows", action="store_true")
    parser.add_argument("--links", action="store_true")
    args = parser.parse_args()
    validate_lessons()
    if args.all or args.links:
        validate_links()
    if args.all or args.workflows:
        validate_workflows()


if __name__ == "__main__":
    main()
