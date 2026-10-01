# Wiz Aula — CLAUDE.md

One-tap join for online classes on Google Meet. The teacher posts a Meet link once; students get a push alert and press one big yellow button to enter the class. Built for people with little tech experience: older adults, kids, first-time smartphone users. Part of the Mister Wiz (Escola de Líderes) ecosystem.

Read `docs/PLAN.md` before any architectural change. Next.js 16 differs from older versions: see `AGENTS.md` and the bundled docs in `node_modules/next/dist/docs/`. The clickable reference for every screen is `prototype/wiz-aula.html` (open it in a browser; it runs in local demo mode).

## Product rules (non-negotiable)

- **Interface language: Portuguese (pt-BR).** Code, comments, commits and docs in English.
- **One primary action per screen.** The student home shows the next class and the **Entrar na aula** button, nothing else competes with it.
- **Two class types:** `scheduled` (button lights up 10 min before start, reminder alert at T-10) and `lightning` / *aula relâmpago* (starts now, alert to the whole turma at once; starting a new one ends the previous live lightning class of that turma). A scheduled class opening at T-10 also ends a live lightning class of the same turma, so a student only ever has one button.
- **No self-registration.** Students sign in with a school-issued access code. No email, password or phone for students.
- **Google Meet stays the video tool.** We only store and deliver the link. Links are validated and normalised to `https://meet.google.com/xxx-yyyy-zzz` (accept full URL, URL with query string, or the bare 10-letter code with or without hyphens).
- **Accessibility floor:** base font 18px, touch targets ≥ 56px (join button ≥ 80px), text-size control (100 / 112.5 / 125%), WCAG AA contrast in light and dark, visible focus, `prefers-reduced-motion` respected, plain Portuguese copy with no jargon.
- **Works on every device:** Android phone/tablet, iPhone, iPad, Windows, Mac, Chromebook. Layout: 1 column on phones, wider on tablets (≥640px), 2 columns on computers (≥960px). See the device matrix in `docs/PLAN.md`.
- **Minors' data (LGPD):** store only name, turma and access-code hash for students.

## Platform facts that shape the code

- iOS/iPadOS web push needs 16.4+ and only works when the PWA is opened from the Home Screen icon (`display-mode: standalone`). Detect a Safari tab and show the install card instead of the "Ativar avisos" button.
- The notification permission prompt must be triggered by a user tap, never on load.
- iPadOS reports a Mac user agent: detect iPad as `Macintosh` + `navigator.maxTouchPoints > 1`.
- Android/Chrome: use `beforeinstallprompt` for a one-tap install button. Desktop Chrome/Edge: install icon in the address bar. Safari on macOS 14+: File › Add to Dock.
- Delete push subscriptions that return 404/410.

## Stack

Same as Speak Easy so nothing new has to be learned or paid for:

- Next.js (App Router) + TypeScript (strict) + Tailwind, deployed on Vercel
- Supabase (Postgres, row-level security, Auth via custom access-code flow)
- Web Push with VAPID keys (`web-push` package), service worker in `public/sw.js`
- Cron for T-10 reminders: Supabase `pg_cron`, every minute; alerts are sent by the Edge Function `supabase/functions/send-push` (called through `pg_net`)
- Font: Carlito (Google Fonts, metric-compatible with Calibri, the class-materials font) at 400 and 700; headings are the same face set bold

## Brand tokens (Mister Wiz)

The design system lives in `design-system/` (brand book `README.md`, `tokens.json`, component guidelines, logos and icons). Follow it; this table is a summary.

| Token | Light | Dark |
| --- | --- | --- |
| primary | `#792D83` | `#C47FCF` |
| ink (plum) | `#2D1040` | `#F4ECF7` |
| background | `#F9F5FA` | `#170A20` |
| surface-2 (lavender) | `#F0E6F3` | `#30183D` |
| gold (join button) | `#EBB22E` | `#F0BE45` |
| live dot | `#D23B3B` | `#FF6B6B` |

No other blues or greens except semantic success text. Buttons, tabs and labels are capsules; cards have 16px corners. Every screen opens with the MISTER WIZ wordmark; the Mister Wiz symbol is the app icon.

## Data model (summary)

`schools`, `turmas` (fixed `meet_link` per turma), `people` (role: student/teacher/admin), `access_codes` (`code_hash`, never readable by clients), `person_logins` (Supabase Auth user → person, written only by `redeem_access_code()`), `enrollments`, `aulas` (`type`, `start_at`, `duration_min`, `meet_link`, `status`, `ping_at`, `reminder_sent_at`), `push_subscriptions`, `join_events`. RLS: students read only their turmas and aulas; only a turma's teachers (or a school admin) write its aulas; schools are isolated from each other. Full table in `docs/PLAN.md`; schema in `supabase/migrations/`, dev seed in `supabase/seed.sql`.

## Quality bar — always double-check every file

Before calling any task done, re-read every file you created or changed and check for:

1. **Logic:** time zones (store UTC, display America/Sao_Paulo), the 10-minute window, lightning replacing lightning, link normalisation, empty states.
2. **Layout:** phone (390px), tablet (820px) and desktop (1366px) with no horizontal scroll; light and dark themes.
3. **Grammar:** Portuguese UI copy (agreement such as "Falta 1 minuto" / "Faltam 5 minutos", accents, capitalisation) and English docs.
4. **Tests and types:** `tsc --noEmit`, lint and tests pass.

## Code map

- `src/app/` pages: `/` (code login, then the student or teacher screen by role), `/alunos` (admins: people and access codes) and `/como-instalar`
- Login: each device signs in anonymously with Supabase Auth, then `redeem_access_code(code)` (a database function) checks the code, rate-limits failures and links the device in `person_logins`. The code pepper lives in `private.settings`, random per database. There are no server secrets; the browser talks to Supabase directly under RLS.
- `src/lib/` pure logic with unit tests next to it (`*.test.ts`, run with `npm test`): `meet.ts` (link normalisation), `aulas.ts` (10-minute window, lightning replacement), `time.ts` (UTC ↔ America/Sao_Paulo), `format.ts` (pt-BR dates and countdown)
- `src/lib/roster.ts` admin list labels, filters and pasted-name parsing (tested); `src/lib/admin.ts` admin calls (`admin_roster`, `admin_add_person`, `admin_add_students`, `admin_update_person`, `admin_new_code`, `admin_remove_person`)
- `src/lib/supabase.ts` browser client; `session.ts` sign-in state; `data.ts` turmas/classes with Realtime + polling, and the teacher actions; `database.types.ts` generated from the schema (regenerate after each migration)
- `src/content/guides.tsx` install guide text, kept identical to `docs/SETUP-GUIDES-PT.md`
- PWA and alerts: `src/app/manifest.ts`, `public/sw.js` (push + notification click), `src/lib/alerts.ts` (which alerts card to show, tested), `src/lib/push.ts` (subscribe on a tap), `src/lib/install.ts` (`beforeinstallprompt`); sending in `supabase/functions/send-push` (Deno, not part of the Next build)
- Files in `src/lib` import each other with `.ts` extensions so `node --test` can run them without a build step.
- `supabase/migrations/` schema and RLS; `supabase/seed.sql` dev data; `db/tests/rls.sql` RLS tests run by `npm run test:db` (plain Postgres plus `db/tests/supabase-stub.sql`, no Docker). Add a new migration file for every schema change; never edit one that has shipped.
- Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:db`, `npm run build`.

## Working agreements

- Build in small, reviewable steps; one feature per commit.
- Keep `docs/PLAN.md` and `docs/SETUP-GUIDES-PT.md` in sync with what ships.
- Ask before choosing between standalone app and a module inside the existing Mister Wiz app (see "Open decisions" in the plan).
