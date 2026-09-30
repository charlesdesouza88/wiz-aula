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

The app needs a Supabase project: copy `.env.example` to `.env.local` and fill in the project URL and publishable key, and allow anonymous sign-ins in the project (Authentication › Sign In / Providers). Apply `supabase/migrations/` and, for development, `supabase/seed.sql`; with Docker running, `npx supabase start` does both locally. Dev access codes are listed at the top of the seed file.

Push alerts need a one-time setup per Supabase project: deploy `supabase/functions/send-push` (`npx supabase functions deploy send-push --no-verify-jwt`) and set the VAPID keys and functions URL in `private.settings` (see "Push alerts and install" in `docs/PLAN.md`).

## Getting started with Claude Code

1. Clone the repo and open it in Claude Code (terminal, desktop or web).
2. Paste the prompt from `docs/KICKOFF-PROMPT.md`.

## Status

Prototype done (2026-09-28). Standalone Next.js PWA chosen. MVP milestones 1 (scaffold), 2 (Supabase schema, RLS and seed) and 3 (access-code login, screens connected to Supabase with live updates) done; milestone 5 (installable PWA, push alerts, T-10 reminders) done too; deployed at https://wiz-aula.vercel.app; next is testing push alerts on real phones. See the roadmap in `docs/PLAN.md`.
