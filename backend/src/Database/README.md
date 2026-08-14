# TravelPort SSDT database project

This SDK-style Microsoft.Build.Sql project is the authoritative database deployment source for TravelPort. It targets SQL Server 2019 or newer and builds on Windows or Linux with the .NET 8 SDK.

## Build

```bash
dotnet build TravelPort.Database.sqlproj --configuration Release
```

The DACPAC is written to `bin/Release/TravelPort.Database.dacpac`.

## Deploy

Generate and review a script first:

```bash
sqlpackage /Action:Script \
  /SourceFile:bin/Release/TravelPort.Database.dacpac \
  /TargetConnectionString:"<target-connection-string>" \
  /OutputPath:TravelPort.deploy.sql \
  /p:BlockOnPossibleDataLoss=True
```

After approval and backup, use `/Action:Publish` with the same source and target. The post-deployment script is idempotent and contains catalogue data only; it does not create users or credentials.

Keep the EF Core model and compatibility migration chain in `../Persistence/Migrations` synchronized with each SSDT schema change. Deployed API instances must leave `Database:ApplyEfMigrations` disabled.
