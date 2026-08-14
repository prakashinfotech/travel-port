# Database deployment

The SSDT project at `backend/src/Database/TravelPort.Database.sqlproj` is the authoritative deployment source. It produces `TravelPort.Database.dacpac`, including all tables, indexes, constraints, stored procedures, functions, views, and the idempotent non-sensitive post-deployment seed.

Build and preview a deployment from the repository root:

```bash
dotnet build backend/src/Database/TravelPort.Database.sqlproj --configuration Release
sqlpackage /Action:Script \
  /SourceFile:backend/src/Database/bin/Release/TravelPort.Database.dacpac \
  /TargetConnectionString:"<target-connection-string>" \
  /OutputPath:TravelPort.deploy.sql \
  /p:BlockOnPossibleDataLoss=True
```

After review and backup, replace `/Action:Script` with `/Action:Publish`. The manual GitHub workflow `.github/workflows/deploy.yml` performs this database publish before its API deployment gate.

`TravelPort.Migrations.sql` and `backend/src/Persistence/Migrations/` are retained as an EF Core compatibility history for local development. They are not the company deployment artifact. Keep the EF model and SSDT project synchronized whenever the schema changes.

The public seed contains catalogue data only. It never creates user accounts, passwords, wallets, saved travellers, payments, or bookings.
