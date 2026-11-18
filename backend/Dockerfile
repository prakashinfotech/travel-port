# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────────────────────────────────────

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy solution
COPY TravelPort.sln .

# Copy project files first for better Docker layer caching
COPY src/Domain/TravelPort.Domain.csproj src/Domain/
COPY src/Application/TravelPort.Application.csproj src/Application/
COPY src/Infrastructure/TravelPort.Infrastructure.csproj src/Infrastructure/
COPY src/Persistence/TravelPort.Persistence.csproj src/Persistence/
COPY src/API/TravelPort.API.csproj src/API/

# Restore dependencies
RUN dotnet restore src/API/TravelPort.API.csproj

# Copy remaining source code
COPY . .

# Publish application
RUN dotnet publish src/API/TravelPort.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    /p:UseAppHost=false


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Runtime
# ─────────────────────────────────────────────────────────────────────────────

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

# Install Liberation fonts
# Required for PDF generation / PDFsharp on Linux
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Create non-root application user
RUN adduser --disabled-password --gecos "" appuser \
    && chown -R appuser /app

USER appuser

# Copy published application
COPY --from=build --chown=appuser /app/publish .

# ASP.NET configuration
ENV ASPNETCORE_ENVIRONMENT=Production

# Application listens on port 5003 inside container
ENV ASPNETCORE_URLS=http://+:5003

# Document application port
EXPOSE 5003

# Start application
ENTRYPOINT ["dotnet", "TravelPort.API.dll"]
