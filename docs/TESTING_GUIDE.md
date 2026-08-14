# TravelPort Testing Guide

Every pull request and push to `master` must pass the same local and CI gates.

## Shared gate

```powershell
.\scripts\test-all.ps1
```

```bash
./scripts/test-all.sh
```

This runs the .NET xUnit suite and the frontend Vitest suite. The frontend command disables the local results cache to avoid stale or locked cache files.

## Full verification

```bash
dotnet restore backend/TravelPort.sln
dotnet test backend/TravelPort.sln --configuration Release --no-restore
dotnet build backend/TravelPort.sln --configuration Release --no-restore
dotnet build backend/src/Database/TravelPort.Database.sqlproj --configuration Release --no-restore
npm ci --prefix frontend
npm run lint --prefix frontend
npm run test --prefix frontend -- --run
npm run build --prefix frontend
```

## Security checks

```bash
dotnet list backend/TravelPort.sln package --vulnerable --include-transitive
npm audit --prefix frontend --audit-level=low
```

## Database and container checks

```bash
dotnet build backend/src/Database/TravelPort.Database.sqlproj --configuration Release
sqlpackage /Action:Script /SourceFile:backend/src/Database/bin/Release/TravelPort.Database.dacpac /TargetConnectionString:"<validation-connection-string>" /OutputPath:TravelPort.deploy.sql /p:BlockOnPossibleDataLoss=True
docker compose config --quiet
docker compose up --build -d
```

After startup, verify the web root and Swagger endpoint, register a new account, and exercise one representative search. Fresh databases intentionally have no default login credentials.

Enable the optional pre-commit hook with `git config core.hooksPath .githooks`.
