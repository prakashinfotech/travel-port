# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution + all csproj files first (layer-cache friendly)
COPY TravelPort.sln .
COPY src/Domain/TravelPort.Domain.csproj             src/Domain/
COPY src/Application/TravelPort.Application.csproj   src/Application/
COPY src/Infrastructure/TravelPort.Infrastructure.csproj src/Infrastructure/
COPY src/Persistence/TravelPort.Persistence.csproj   src/Persistence/
COPY src/API/TravelPort.API.csproj                   src/API/

RUN dotnet restore src/API/TravelPort.API.csproj

# Copy remaining source and publish
COPY . .
RUN dotnet publish src/API/TravelPort.API.csproj \
    -c Release -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install Liberation fonts (Arial-compatible) so PdfSharpCore renders PDFs correctly on Linux
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

COPY --from=build --chown=appuser /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5000

EXPOSE 5000
ENTRYPOINT ["dotnet", "TravelPort.API.dll"]
