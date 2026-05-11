# GIT.md — Git Workflow & Commit Conventions

> Every commit to this repository must follow these rules.
> Reviewers use git history as documentation — make it count.

---

## Branch Strategy

```
main
 └── Development          ← all active development merges here
      └── feature/<name>  ← one branch per feature or fix
      └── fix/<name>       ← bug fixes
      └── docs/<name>      ← documentation-only changes
      └── refactor/<name>  ← refactoring without feature change
      └── chore/<name>     ← tooling, config, CI changes
```

### Rules
- `main` — production-ready only. No direct commits. Merge via PR from `Development`.
- `Development` — integration branch. All feature branches merge here first.
- Feature branches — short-lived; one concern per branch; delete after merge.

### Branch Naming Convention
```
<type>/<short-kebab-description>

Examples:
  feature/goibibo-flight-filters
  feature/duffel-api-integration
  fix/flight-search-db-not-returning
  fix/payment-mock-order-verification
  docs/add-task-tracker-and-git-guide
  refactor/bus-train-provider-route-data
  chore/expand-seed-data-900-flights
```

---

## Commit Message Format

Use **Conventional Commits** — every commit must have:

```
<type>(<scope>): <short summary>

<body — bullet points describing WHAT and WHY>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### Types

| Type | When to Use |
|---|---|
| `feat` | New feature added to the codebase |
| `fix` | Bug fix |
| `docs` | Documentation only (MD files, comments) |
| `refactor` | Code restructure without functional change |
| `chore` | Tooling, config, dependency updates |
| `test` | Adding or updating tests |
| `style` | Formatting, whitespace — no logic change |
| `perf` | Performance improvement |

### Scope (optional, in parentheses)

Use the affected area: `flight`, `hotel`, `bus`, `train`, `cab`, `auth`, `payment`, `wallet`, `seed`, `ui`, `api`, `deps`

### Summary line rules
- Max 72 characters
- Lowercase after the colon
- No period at the end
- Present tense: "add filter sidebar" not "added filter sidebar"
- Be specific: "add Goibibo-style flight filter sidebar with 8 filter types" not "update flights page"

---

## Commit Body — Bullet Point Template

```
feat(flight): add Goibibo-style filter sidebar and date bar

- Add Popular Filters section with per-filter minimum price display
- Add Arrival Airports section derived from destination IATA code
- Add One Way Price range slider (min → max from search results)
- Add Departure / Arrival time-slot buttons (Before 6am, 6am-12pm, 12pm-6pm, After 6pm)
- Add Airlines section with colored logo dots and per-airline min price
- Add date bar strip showing ±3/+4 dates with lowest fares, auto-fetched in background
- Add calendar picker popup showing 2-month view with per-day lowest prices
- Add Fare Type radio tabs (Regular, Student, Armed Forces, GST, Senior Citizen, Doctor & Nurses)
- Add 4 sort tabs — Cheapest, Non Stop First, You May Prefer, Earliest Departure
- Redesign FlightCard to Goibibo style — orange VIEW FARES button, airline color badge
- Add scrollbar-hide Tailwind plugin for clean horizontal scroll
- Update FlightsPage header to orange (matching Goibibo brand)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Pull Request Template

When opening a PR to `Development` or `main`:

```markdown
## Summary
- Brief 2-3 line overview of what this PR does

## Changes
- [ ] Backend changes (list files/services)
- [ ] Frontend changes (list pages/components)
- [ ] Seed data / DB changes
- [ ] Config / environment changes
- [ ] Documentation updated

## How to Test
1. Step-by-step testing instructions
2. Test credentials if needed
3. Edge cases to verify

## Screenshots (UI changes)
<!-- Attach before/after screenshots for any visual changes -->

## DB Migration Required?
- [ ] Yes — run: `dotnet ef database update ...`
- [ ] No

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Pre-Commit Checklist

Before every commit, verify:

- [ ] TypeScript compiles: `cd frontend && npx tsc --noEmit`
- [ ] Backend builds: `cd backend && dotnet build src/API -v q`
- [ ] No secrets in `appsettings.json` (use `appsettings.Development.json`)
- [ ] Relevant MD files updated (README, API_DOCUMENTATION, TASK-TRACKER)
- [ ] Commit message follows the format above
- [ ] Only specific files staged (not `git add -A` blindly)

---

## Example Commit History (reference)

```
feat(seed): expand DB to 900+ flights across 42 routes and 7 airlines
feat(ui): redesign FlightsPage with Goibibo-style filters and date bar
fix(flight): merge DB and Duffel results instead of choosing one source
feat(duffel): integrate Duffel API as external flight provider
feat(ui): add Buses, Trains, Cabs pages with search and results
feat(payment): add Razorpay checkout with mock fallback for dev
feat(wallet): add wallet top-up, deduction, and transaction history
feat(cache): add ICacheService with in-memory provider and TTL helpers
docs: add CLAUDE.md, GIT.md, TODO.md, and TASK-TRACKER.md
```

---

## Protected Branches

| Branch | Protection |
|---|---|
| `main` | No direct push. PR required. At least 1 reviewer. |
| `Development` | No force push. Linear history preferred. |

## Merge Strategy

- `Development` → `main`: **Squash and merge** (clean single commit per feature)
- Feature branch → `Development`: **Merge commit** (preserve feature history)
- Never rebase a branch that others have pulled
