# Contributing Guide

## Branch Strategy

```
main
 └── Development   ← all work happens here
       └── feature/your-feature   (optional, for larger features)
```

### Rules

| Rule | Detail |
|---|---|
| **Never commit directly to `main`** | `main` is protected — direct pushes are blocked |
| **`Development` is the base branch** | Always branch from `Development`, merge back to `Development` |
| **Merge to `main` via PR only** | Raise a Pull Request from `Development` → `main` when ready to release |
| **No force pushes** | Force pushes to `main` are disabled |

---

## Workflow

### Day-to-day development
```bash
# Make sure you're on Development and up to date
git checkout Development
git pull origin Development

# Make your changes, then commit
git add <files>
git commit -m "feat: describe your change"

# Push to remote Development
git push origin Development
```

### Feature branches (optional, for bigger changes)
```bash
# Create a feature branch from Development
git checkout Development
git checkout -b feature/flight-filters

# ... do work, commit ...

# Merge back into Development (not main)
git checkout Development
git merge feature/flight-filters
git push origin Development

# Delete the feature branch
git branch -d feature/flight-filters
git push origin --delete feature/flight-filters
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

## Test Credentials (Development Only)

| Role | Email | Password |
|---|---|---|
| Admin | admin@travelport.com | Admin@123 |
| User | john@example.com | User@123 |
| User | priya@example.com | User@123 |
| User | rahul@example.com | User@123 |
