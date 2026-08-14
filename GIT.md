# Git Workflow and Commit Conventions

## Branches

- `master` is the protected, releasable branch.
- All normal changes use a short-lived branch from `master`.
- Open a pull request back to `master`; require passing CI and review.
- Delete the feature branch after merge.

Suggested names: `feat/search-filters`, `fix/invoice-fonts`, `docs/local-setup`, `security/dependency-audit`.

## Commits

Use `type(scope): summary` with an imperative summary of at most 72 characters.

Supported types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `chore`, `security`.

Keep commits focused. Explain non-obvious design decisions and breaking configuration or migration changes in the body.

## Required checks

Before pushing, run the commands in [CONTRIBUTING.md](CONTRIBUTING.md). Confirm:

- no credentials or local files are staged;
- migrations and generated SQL agree when database changes are included;
- backend tests, frontend lint/tests/build, and dependency audits pass;
- documentation and configuration examples match current behavior.

Never rewrite or force-push shared `master` history without explicit repository-administrator approval.
