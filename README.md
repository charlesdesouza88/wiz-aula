# Wiz Aula

One-tap join for online classes on Google Meet, for the Mister Wiz (Escola de Líderes) network. Teachers post a Meet link once; students get an alert and press one button to enter the class. Works on Android, iPhone, iPad and computers.

## What's here

| Path | What it is |
| --- | --- |
| `CLAUDE.md` | Project rules and context for Claude Code |
| `docs/PLAN.md` | Research, device support, scope, architecture, data model, roadmap, risks |
| `docs/SETUP-GUIDES-PT.md` | Step-by-step install guides in Portuguese (students per device, teachers) |
| `docs/KICKOFF-PROMPT.md` | First message to paste into Claude Code to start the MVP |
| `prototype/wiz-aula.html` | Clickable prototype of every screen; open it in any browser (runs in local demo mode) |
| `src/` | The Next.js app (App Router, TypeScript, Tailwind) |
| `supabase/` | Database migrations, row-level security and the dev seed |
| `db/tests/` | Database tests (`npm run test:db`) |

## Running the app

Needs Node.js 22.18 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests (node:test, no extra dependencies)
npm run typecheck
npm run lint
npm run test:db    # migrations + seed + RLS tests on a throwaway Postgres (needs Postgres server binaries)
```

The app still runs on mock data (`src/lib/mock-data.ts`); nothing is saved between reloads. The database schema is ready in `supabase/`: with Docker running, `npx supabase start` applies the migrations and `supabase/seed.sql`. Copy `.env.example` to `.env.local` for the variables the app will need.

## Getting started with Claude Code

1. Clone the repo and open it in Claude Code (terminal, desktop or web).
2. Paste the prompt from `docs/KICKOFF-PROMPT.md`.

## Status

Prototype done (2026-09-28). Standalone Next.js PWA chosen. MVP milestones 1 (scaffold with the three screens on mock data) and 2 (Supabase schema, RLS and seed) done; next is milestone 3, access-code login. See the roadmap in `docs/PLAN.md`.
