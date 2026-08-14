# Deployment Guide

## Local Docker deployment

Copy the environment template, set a strong SQL Server password and JWT signing secret, and build from source:

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
docker compose logs -f api
```

The application is available at `http://localhost`; Swagger is at `http://localhost/api/swagger`. SQL Server is not published to the host by default.

Local Docker explicitly enables the EF migration fallback so a fresh container starts without SqlPackage. Shared environments must leave `Database:ApplyEfMigrations` disabled and publish the SSDT DACPAC before starting the API. User accounts and sample bookings are never seeded.

## Configuration

Production deployments must use a company-approved secret store or environment injection. Required values are:

- `ConnectionStrings__DefaultConnection`
- `JwtSettings__Secret`
- `JwtSettings__Issuer`
- `JwtSettings__Audience`
- allowed frontend origins

Groq, Amadeus, Duffel, Razorpay, and SMTP settings are optional and must remain disabled when credentials are absent.

## CI

`.github/workflows/ci.yml` verifies pushes and pull requests to `master`. It restores, builds, tests, lints, audits dependencies, and validates Docker Compose configuration.

`.github/workflows/deploy.yml` is manual-only. It publishes the DACPAC through a protected GitHub environment, then opens the API deployment gate. Add the company registry/hosting deployment commands only after its environment, reviewers, and secrets are configured.

## Database deployment

Build the authoritative SSDT project and publish its DACPAC before the API:

```bash
dotnet build backend/src/Database/TravelPort.Database.sqlproj --configuration Release
sqlpackage /Action:Publish \
  /SourceFile:backend/src/Database/bin/Release/TravelPort.Database.dacpac \
  /TargetConnectionString:"<target-connection-string>" \
  /p:BlockOnPossibleDataLoss=True
```

Back up shared databases and review the generated deployment plan before publishing. EF migrations remain available only as an explicitly enabled local compatibility path.

## Rollback

- Application: redeploy the previously approved immutable build or image.
- Database: restore the verified backup or apply a separately reviewed rollback script. EF migrations in this repository are forward migrations and do not replace a backup strategy.

## Security checklist

- No `.env`, development appsettings, keys, passwords, certificates, or private workbooks in the artifact.
- TLS terminates at the deployment edge.
- Swagger is restricted or disabled at the network edge in production.
- SQL Server is private and not internet-accessible.
- Dependency and secret scans pass immediately before release.
