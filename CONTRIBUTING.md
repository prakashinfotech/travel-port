# Contributing to TravelPort

## Workflow

The default and integration branch is `master`. Do not commit directly to a protected `master` branch after the initial repository bootstrap.

```bash
git switch master
git pull --ff-only
git switch -c feat/short-description
```

Use one of these prefixes: `feat/`, `fix/`, `docs/`, `test/`, `refactor/`, `chore/`, or `security/`.

Before opening a pull request:

```bash
dotnet test backend/TravelPort.sln --configuration Release
npm run lint --prefix frontend
npm run test --prefix frontend -- --run
npm run build --prefix frontend
dotnet list backend/TravelPort.sln package --vulnerable --include-transitive
npm audit --prefix frontend --audit-level=low
```

You can also enable the versioned local hook:

```bash
git config core.hooksPath .githooks
```

## Commit messages

Use Conventional Commits:

```text
type(scope): concise imperative summary
```

Examples:

- `feat(bookings): add cancellation confirmation`
- `fix(auth): reject expired refresh tokens`
- `docs(setup): clarify SQL Server prerequisites`
- `security(deps): update PDF generation library`

## Pull requests

- Target `master`.
- Explain the reason and user-visible behavior.
- Include setup, migration, and configuration impact.
- Include exact verification commands and results.
- Add screenshots for UI changes.
- Never include credentials, tokens, production data, or private recovery files.

Fresh databases intentionally contain no default user accounts. Create users through registration or an approved private environment setup process.

Copyright © Prakash Infotech. All rights reserved.
