# Kickoff prompt for Claude Code

Paste the block below as your first message in Claude Code, from the root of this repo. It assumes the standalone Next.js PWA from `docs/PLAN.md`; if you decide to build inside the existing Mister Wiz app instead, change the first line before sending.

---

We are building **Wiz Aula** as a standalone Next.js PWA. Read `CLAUDE.md`, `docs/PLAN.md` and `docs/SETUP-GUIDES-PT.md`, and open `prototype/wiz-aula.html` to see every screen and behaviour we already agreed on.

Build the MVP in this order, committing after each milestone and stopping for my review after milestones 1 and 3:

1. **Scaffold.** Next.js (App Router, TypeScript strict, Tailwind) with the brand tokens and fonts from `CLAUDE.md`, light and dark themes, the text-size control, and responsive layouts for 390px / 820px / 1366px. Port the three prototype views (Aluno, Professor, Como instalar) as real pages with mock data.
2. **Database.** Supabase migrations for the tables in `docs/PLAN.md`, row-level security policies, and a seed with one school, the turma "Masters" (Adults Book 4, "Terça e quinta, 19:00 - 20:00", teacher Chuck) and two test students.
3. **Access-code login.** Teachers and students sign in with a school-issued code (hash stored, rate-limited). No self-registration.
4. **Classes.** Teacher creates lightning and scheduled classes (with weekly repeat), ends a class, re-sends the alert. Meet-link validation and normalisation with unit tests. Student home shows the live or next class with the 10-minute window.
5. **PWA + push.** Manifest and icons, service worker, install flows per device (Android `beforeinstallprompt`, iOS/iPadOS Safari detection with install card, desktop install hint), VAPID Web Push subscribe on a user tap, send on lightning start, T-10 reminder cron, clean-up of 404/410 subscriptions. Tapping the notification opens the Meet link.
6. **QA.** Run the quality checklist in `CLAUDE.md` on every file, then give me a short test script to try on an Android phone, an iPhone, an iPad and a laptop.

Ask me before adding any dependency not listed in `CLAUDE.md`, and list the environment variables I need to set in Vercel and Supabase.
