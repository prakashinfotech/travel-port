# TravelPort AI Skills

This folder contains documentation for all AI-assisted development skills available in the TravelPort project.

Skills are invokable as **slash commands** inside Claude Code using the files in [`.claude/commands/`](../../.claude/commands/).

---

## Available Skills

| Skill | Slash Command | Purpose |
|-------|--------------|---------|
| [Generate API Endpoint](generate-api.md) | `/generate-api` | Controller + service + DTO + validator |
| [Generate UI Component](generate-ui.md) | `/generate-ui` | React page or reusable component |
| [Generate Tests](generate-tests.md) | `/generate-tests` | xUnit (backend) or Vitest (frontend) |
| [Code Review](review-code.md) | `/review-code` | Security, correctness, SOLID, conventions |
| [Generate Migration](generate-migration.md) | `/generate-migration` | EF Core entity + config + migration command |
| [Database Schema](database-schema.md) | *(use prompt template)* | SQL tables, SPs, functions, views |
| [AI Features](ai-features.md) | *(reference guide)* | Add Claude-powered features using the backend proxy pattern |

---

## How to Use Slash Commands

1. Open Claude Code in the project directory
2. Type `/` to see available commands
3. Select a skill or type the command name with arguments

```
/generate-api add coupon validation endpoint
/generate-ui flight booking confirmation page
/generate-tests FlightService backend
/review-code backend/src/Application/Services/BookingService.cs
/generate-migration add Notifications table
```

---

## Prompt Templates

For use outside Claude Code (e.g. ChatGPT, API calls), full prompt templates are in:

```
.claude/prompts/
├── api-generation.md
├── ui-generation.md
├── testing-generation.md
├── deployment-generation.md
├── database-schema.md
└── code-review.md
```

---

## Skill File Locations

| Type | Location | Purpose |
|------|----------|---------|
| Claude Code commands | `.claude/commands/*.md` | Invokable as `/command-name` in Claude Code |
| Prompt templates | `.claude/prompts/*.md` | Reusable with any LLM |
| Skill documentation | `docs/skills/*.md` | Human-readable reference (this folder) |
