#!/bin/sh
set -eu

echo "Running backend tests..."
dotnet test backend/TravelPort.sln --configuration Release --no-restore

echo "Running frontend tests..."
npm --prefix frontend run test -- --run
