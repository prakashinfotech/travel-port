# ✈️ TravelPort — Goibibo-Inspired Travel Booking Portal

> Production-grade, enterprise-level full-stack travel booking platform built with AI-assisted development workflow.

[![CI/CD](https://github.com/org/travelport/actions/workflows/ci.yml/badge.svg)](https://github.com/org/travelport/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

---

## 📋 Overview

TravelPort is a comprehensive travel booking portal inspired by Goibibo, offering:
- ✈️ Flight Search & Booking
- 🏨 Hotel Search & Booking
- 🚌 Bus Booking
- 🚂 Train Booking
- 🌴 Holiday Packages
- 👤 User Authentication & Profiles
- 💰 Wallet & Offers
- 🛠️ Admin Panel

---

## 🏗️ Architecture

```
travelport/
├── frontend/          # React 18 + TypeScript + Vite + Tailwind
├── backend/           # .NET 8 Web API (Clean Architecture)
├── database/          # SQL Server migrations + seed data
├── docs/              # Technical documentation
├── tests/             # E2E & integration tests
└── .claude/           # AI workflow configuration
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for full system design.

---

## 🛠️ Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS, Redux |
| Backend     | .NET 8, Clean Architecture, EF Core, MediatR   |
| Database    | SQL Server, EF Core Migrations                  |
| Auth        | JWT + Refresh Tokens, Role-Based Authorization  |
| DevOps      | Docker, GitHub Actions, CI/CD                   |
| Caching     | Redis                                           |
| Logging     | Serilog + Seq                                   |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- .NET 8 SDK
- SQL Server / Docker Desktop
- Redis (or use Docker Compose)

### 1. Clone Repository
```bash
git clone https://github.com/org/travelport.git
cd travelport
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run with Docker Compose (Recommended)
```bash
docker-compose up --build
```

### 4. Manual Setup

**Backend:**
```bash
cd backend
dotnet restore
dotnet ef database update
dotnet run --project src/API
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Access Points

| Service     | URL                          |
|-------------|------------------------------|
| Frontend    | http://localhost:5173         |
| Backend API | http://localhost:5000/api    |
| Swagger     | http://localhost:5000/swagger |
| Seq Logs    | http://localhost:5341         |

---

## 📚 Documentation

| Document                                       | Description                    |
|------------------------------------------------|--------------------------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)        | System architecture overview   |
| [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | REST API reference          |
| [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | ER diagram & schema design     |
| [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Production deployment steps  |
| [SECURITY_GUIDE.md](docs/SECURITY_GUIDE.md)   | Security implementation        |
| [TESTING_GUIDE.md](docs/TESTING_GUIDE.md)     | Testing strategy & coverage    |
| [AI_USAGE_REPORT.md](docs/AI_USAGE_REPORT.md) | AI development workflow log    |

---

## 📁 Environment Variables

See [.env.example](.env.example) for all required variables.

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## 📄 License

MIT License — see [LICENSE.md](LICENSE.md)
