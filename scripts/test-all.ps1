$ErrorActionPreference = 'Stop'

Write-Host 'Running backend tests...' -ForegroundColor Cyan
dotnet test backend/TravelPort.sln --configuration Release --no-restore
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Running frontend tests...' -ForegroundColor Cyan
npm --prefix frontend run test -- --run
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
