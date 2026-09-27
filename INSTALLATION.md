# Installation guide

You can read the course without installing anything. Local installation is
needed only when you want to run repository tests, preview the Learning Hub, use
the `actionlint` workshop, or edit course material. Real workflow experiments
also need a GitHub account and a fork or disposable repository.

## Choose your setup

| Goal | Required setup |
| --- | --- |
| Read lessons and take checkpoints | A modern web browser |
| Take the full quiz | A modern web browser |
| Run local course validation | Git, Node.js 24+, Python 3.11+ |
| Use `make` shortcuts | GNU Make in addition to the local toolchain |
| Run the `actionlint` workshop | Local toolchain plus `actionlint` 1.7.12 |
| Run actual GitHub Actions labs | GitHub account, practice fork/repository, and Actions enabled |
| Inspect runs from a terminal | GitHub CLI (`gh`), authenticated interactively |

Docker, cloud credentials, API keys, production secrets, and paid services are
not required for the default course path.

## 1. Install the local prerequisites

Use macOS, Linux, or Windows through WSL2 for the most consistent commands.
Install the following from their official distributions or a trusted system
package manager:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en/download) 24 or newer
- [Python](https://www.python.org/downloads/) 3.11 or newer
- [GNU Make](https://www.gnu.org/software/make/) — optional convenience
- [GitHub CLI](https://cli.github.com/) — optional for GitHub run operations

Verify what your shell resolves:

```bash
git --version
node --version
npm --version
python3 --version
make --version
gh --version
```

Only Git, Node, and Python are required for direct local validation. If `make`
or `gh` is absent, use the equivalent commands in the [run guide](RUN_GUIDE.md).
The repository intentionally targets Node 24 even if a newer local Node release
also works; CI uses Node 24 as the reproducible baseline.

### Windows notes

The course commands use POSIX shell syntax and the `python3` executable name.
WSL2 with a Linux distribution is the recommended Windows environment. Run the
clone and all commands inside the WSL filesystem instead of switching between
Windows and WSL paths. Native Windows users can adapt the commands, but the
repository test scripts expect `python3` on `PATH`.

## 2. Choose a clone strategy

### Read or validate only

Clone the upstream repository directly:

```bash
git clone https://github.com/mahsa-teimourikia/learn-github-actions.git
cd learn-github-actions
```

### Complete GitHub-hosted workflow labs

First create a fork using GitHub's
[forking guide](https://docs.github.com/en/get-started/quickstart/fork-a-repo),
then clone your fork:

```bash
git clone https://github.com/YOUR_ACCOUNT/learn-github-actions.git
cd learn-github-actions
git remote add upstream https://github.com/mahsa-teimourikia/learn-github-actions.git
git remote -v
```

Replace `YOUR_ACCOUNT` with your GitHub username or organization. The expected
remotes are:

```text
origin    your writable practice fork
upstream  the read-only course repository
```

Do not run lesson experiments against a production repository. Some labs create
intentional failures, artifacts, rerun attempts, or temporary workflow files.

## 3. Verify the checkout

From the repository root:

```bash
git status --short
node --check scripts/build-pages.mjs
python3 scripts/validate_learning.py --links
```

An empty `git status --short` output means the checkout is clean. The other two
commands verify the local JavaScript runtime and all course-relative Markdown
links.

There is no root dependency installation step. The root test and site scripts
use Node's standard library, and the quiz has no third-party package dependency.
Each lesson fixture owns its own `package-lock.json`; run `npm ci` only inside
that fixture when following a lesson. This avoids creating an untracked root
lockfile or a misleading global dependency environment.

## 4. Configure optional GitHub CLI access

The web interface is sufficient for every lab. If you prefer terminal-based run
inspection, authenticate GitHub CLI using its browser flow:

```bash
gh auth login --web
gh auth status
```

GitHub CLI stores credentials using the system credential store when available.
Do not paste tokens into workflow files, lesson fixtures, shell history, or a
repository `.env` file. Do not run `gh auth status --show-token` while recording
or sharing terminal output.

The CLI is used only for actions such as listing workflows, dispatching an
eligible manual workflow, watching a run, viewing failed logs, and downloading
artifacts. The [GitHub CLI manual](https://cli.github.com/manual/) documents the
current authentication and Actions commands.

## 5. Enable Actions in a practice fork

Open your fork on GitHub and select **Actions**. GitHub may require you to
acknowledge and enable workflows in a newly created fork. Review every workflow
before enabling it. The course's runnable starters are credential-free and
read-only by default, but copied or modified files are your responsibility.

Keep practice permissions narrow:

- use GitHub-hosted runners;
- keep the workflow `permissions` block read-only unless a specific lesson
  explicitly teaches an isolated permission;
- do not add repository, cloud, package, or production secrets;
- do not add OIDC trust or real deployment targets;
- never install a file ending in `.yml.txt`; those files are review-only unsafe
  or broken examples; and
- remove copied lab workflows when the exercise is complete.

## 6. Install optional `actionlint`

The Workflow syntax lesson contains a dedicated
[`actionlint` installation and diagnostic workshop](curriculum/beginner/02-workflow-syntax/actionlint-workshop/README.md#install-a-known-release).
Follow that verified-release procedure when completing the workshop. It pins
version 1.7.12 and verifies the platform archive digest.

ShellCheck and Pyflakes are optional extensions for the workshop's embedded
script experiment. They are not required by the rest of the course.

## 7. Confirm the installation

Run the credential-free local suite:

```bash
npm test
```

Alternatively, with GNU Make:

```bash
make test
```

The suite validates course structure and links, runs focused Python and Node
fixture tests, checks the quiz contract, builds the static Hub, and smoke-tests
the generated site. It does not contact a production service or require GitHub
authentication.

Continue with the [run guide](RUN_GUIDE.md) to choose a learning path, preview
the Hub, run one fixture, or install a workflow lab.

## Troubleshooting installation

### `node` is missing or too old

Install Node 24 or select it through your version manager, then open a new shell
and rerun `node --version`. Do not edit the lesson's `engines` field to bypass
the requirement.

### `python3` is not found

Install Python 3.11+ and ensure the executable is named `python3` on `PATH`. On
Windows, use WSL2. A virtual environment is optional because the core repository
does not install Python packages.

### `make` is missing

Use `npm test` for the complete suite. The Makefile is a convenience layer, not
a required build system.

### Git refuses to push

Confirm that `origin` points to your fork, not the upstream course repository:

```bash
git remote -v
```

Authenticate Git using your normal SSH or HTTPS credential flow. Never embed a
token in the remote URL you share or commit.

### Actions are not visible in the fork

Open the fork's **Actions** tab and enable workflows after reviewing them. Some
organization policies can still restrict Actions, allowed actions, runners, or
workflow permissions; use a personal disposable fork when policy permits.

### Start over safely

Lesson-generated `node_modules`, reports, build output, and state paths are
ignored. To discard an experimental practice branch, switch away from it and
delete only that named branch. Do not use broad destructive cleanup commands in
a directory containing unrelated work.

## Official setup references

- GitHub Docs — [Fork a repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo)
- GitHub Docs — [Clone a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
- GitHub CLI — [Installation and command manual](https://cli.github.com/manual/)
- Node.js — [Download](https://nodejs.org/en/download)
- Python — [Downloads](https://www.python.org/downloads/)
- Git — [Downloads](https://git-scm.com/downloads)
