# Contributing Guide

## Branch Strategy

```
main
 └── Development   ← integration branch; all PRs merge here
       └── feature/your-feature   ← ALL work happens on feature branches
```

### Rules

| Rule | Detail |
|---|---|
| **Never commit directly to `main`** | `main` is protected — direct pushes are blocked |
| **Never commit directly to `Development`** | All work goes on a feature branch; merge via PR |
| **Always branch from `Development`** | `git checkout Development && git pull` before creating a branch |
| **Merge to `Development` via PR only** | Open a Pull Request: `feature/x` → `Development` |
| **Merge to `main` via PR only** | Raise a Pull Request from `Development` → `main` when ready to release |
| **No force pushes** | Force pushes to `main` and `Development` are disabled |

---

## Workflow

### Every change — feature branch required
```bash
# Start from up-to-date Development
git checkout Development
git pull origin Development

# Create your feature branch
git checkout -b feature/your-feature-name

# Enable the repository hook once per clone
git config core.hooksPath .githooks

# ... do work, run tests, commit ...
./scripts/test-all.sh
git add <specific-files>
git commit -m "feat: describe your change"

# Push the feature branch
git push -u origin feature/your-feature-name

# Open a PR on GitHub: feature/your-feature-name → Development
# After merge, delete the branch locally and remotely
git checkout Development
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

### Releasing to main
1. Go to GitHub → Pull Requests → New Pull Request
2. Set **base: `main`** ← **compare: `Development`**
3. Write a clear PR description summarising what changed
4. Merge (squash or merge commit — no rebase)

---

## Commit Message Format

```
<type>: <short description>

Types: feat | fix | refactor | docs | test | chore
```

Examples:
- `feat: add hotel filter by star rating`
- `fix: correct flight search parameter name`
- `docs: update API endpoint table in README`
- `chore: bump EF Core to 8.0.12`

---

## Test Rule

Every commit must pass the shared repository test gate before it is created.

Commands:

```bash
./scripts/test-all.sh
```

```powershell
.\scripts\test-all.cmd
```

What is enforced:
- The versioned pre-commit hook at `.githooks/pre-commit` runs the shared test command.
- Contributors should enable the hook once per clone with `git config core.hooksPath .githooks`.
- GitHub Actions runs the same backend and frontend tests again on every push and pull request to `Development`.

---

## Test Credentials (Development Only)

| Role | Email | Password |
|---|---|---|
| Admin | admin@travelport.com | Admin@123 |
| User | john@example.com | User@123 |
| User | priya@example.com | User@123 |
| User | rahul@example.com | User@123 |
