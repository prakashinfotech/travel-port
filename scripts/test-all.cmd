@echo off
setlocal

echo Running backend tests...
dotnet test backend\TravelPort.sln --configuration Release --no-restore
if errorlevel 1 exit /b %errorlevel%

echo Running frontend tests...
call npm --prefix frontend run test -- --run
if errorlevel 1 exit /b %errorlevel%
