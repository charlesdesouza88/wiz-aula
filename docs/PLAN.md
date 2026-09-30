# Wiz Aula — Project Plan

As of 2026-09-28. Author: Chuck DeSouza.

## Concept

Wiz Aula turns joining an online class into one tap: the teacher posts a Google Meet link once, students get an alert and press one yellow button. It targets people with little tech experience: older adults, kids and first-time smartphone users.

- **Install once, like an app.** A PWA on Android phones and tablets, iPhone, iPad, and Windows, Mac and Chromebook computers; no app-store publishing needed for v1.
- **Two class types**, as in Speak Easy: *scheduled* classes (button lights up 10 minutes before) and *lightning* classes (start now, everyone alerted at once).
- **Google Meet stays the video tool.** Wiz Aula only stores and delivers the link.
- **Success measure:** a student goes from alert to inside the Meet in 2 taps and under 20 seconds.

## Research findings

| Topic | Finding | What it means for us |
| --- | --- | --- |
| Push on iPhone/iPad | Works since iOS/iPadOS 16.4, only for web apps added to the Home Screen and opened from that icon ([Pushpad](https://pushpad.xyz/blog/ios-special-requirements-for-web-push-notifications), [MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)) | Guide forces "Add to Home Screen" and "open from the icon". Detect standalone mode before asking for alerts. |
| Permission prompt | iOS only shows it after a user tap ([Pushpad](https://pushpad.xyz/blog/ios-special-requirements-for-web-push-notifications)) | One big "Ativar avisos" button on first open. |
| Install | Android Chrome shows an install banner (`beforeinstallprompt`); iOS only via Share › Add to Home Screen ([MobiLoud](https://www.mobiloud.com/blog/progressive-web-apps-ios/)) | One-tap install on Android; illustrated steps on iOS. |
| Stack | Next.js documents PWA manifest + Web Push with VAPID ([Next.js](https://nextjs.org/docs/app/guides/progressive-web-apps)) | Fits the Speak Easy stack. |
| Opening Meet | `https://meet.google.com/...` links hand off to the Meet app when installed ([TestMu](https://www.testmuai.com/software-testing-questions/how-to-open-link-in-app-instead-of-browser/)) | Join button is a plain Meet link. |
| Guests | Guests join on mobile without a Google account by typing a name and knocking; hosts can set access to Open ([Google Workspace Updates](https://workspaceupdates.googleblog.com/2024/01/join-a-meeting-without-a-google-account-on-mobile.html)) | Kids and older students need no Google account. |
| Mac | Safari supports web push since Safari 16 on macOS 13 ([WebKit](https://webkit.org/blog/12945/meet-web-push/)); Dock web apps since macOS 14 ([WWDC23](https://developer.apple.com/videos/play/wwdc2023/10120/)) | Mac users get alerts in Safari or Chrome. |

## Device support

| Device | Install | Alerts | Joining Meet |
| --- | --- | --- | --- |
| Android phone or tablet | Chrome install banner, or ⋮ › Adicionar à tela inicial | Yes, in Chrome, even before install | Meet app (recommended) or browser |
| iPhone | Safari › Compartilhar › Adicionar à Tela de Início | Yes, iOS 16.4+, only from the Home Screen icon | Meet app (recommended) |
| iPad | Same as iPhone; Share button is top right, next to the address bar | Yes, iPadOS 16.4+, only from the Home Screen icon | Meet app (recommended) |
| Windows or Chromebook | Install icon at the end of the Chrome or Edge address bar | Yes, Chrome, Edge, Firefox; Windows notifications must be on | Browser tab, no install; allow camera and microphone |
| Mac | Chrome install icon, or Safari › Arquivo › Adicionar ao Dock (macOS 14+) | Yes, Safari 16+ or Chrome | Browser tab, no install |

iPadOS reports itself as a Mac in the browser, so detect an iPad by touch support (`maxTouchPoints > 1`).

## Product scope (v1)

**Student (Aluno)**

- Sign in with a school-issued access code. No password, no email.
- One home screen: next class date and time, a countdown, and a big yellow **Entrar na aula** button that lights up 10 minutes before a scheduled class or immediately for a lightning class.
- Push alert when a class goes live, plus a reminder 10 minutes before scheduled classes. Tapping the alert opens the Meet directly.
- Text-size control (A, A+, A++), high-contrast brand colours, Portuguese interface.

**Teacher (Professor)**

- Pick a turma, paste a Meet link (full link or just the code; validated and normalised).
- **Aula relâmpago:** start now; ends any earlier live lightning class for that turma and alerts every student.
- **Agendar aula:** date, time, duration, optional topic, optional weekly repeat (4 weeks).
- Live class actions: **Avisar de novo** (re-send the alert) and **Encerrar** (turn the students' button off).
- Each turma keeps a fixed Meet link.

**Admin / school (phase 2)**

- Import turmas and students from the roster spreadsheet (teacher, turma, nível, horário, student name — same columns as the student feedback template).
- Generate and print access codes; see who installed and who has alerts on.
- Attendance from join taps, feeding the feedback report compiler.

## Architecture

```
Teacher ──▶ API (Next.js on Vercel) ──▶ Supabase Postgres
                                              │ class times, subscriptions
                                              ▼
Student phone ◀── Push services (APNs/FCM) ◀── Alert sender (1-min cron + Web Push)
      │ tap alert, then "Entrar na aula"
      ▼
Google Meet (app or browser, as guest)
```

Lightning classes skip the cron: the API sends the alert the moment the teacher taps Start. The student app reads the next class from the API on open, so it is correct even when an alert is missed.

| Table | Key fields | Notes |
| --- | --- | --- |
| `schools` | id, name, city | One per franchise unit |
| `turmas` | id, school_id, name, nivel, horario, teacher_id, meet_link | Fixed Meet link per turma |
| `people` | id, school_id, role (student, teacher, admin), name | No email or password for students |
| `access_codes` | person_id, code_hash | HMAC-SHA256 of the normalised code with a server secret; no client access |
| `person_logins` | auth_user_id, person_id | Links a Supabase Auth user (one per signed-in device) to a person; written by the server after it checks the code |
| `enrollments` | person_id, turma_id | A student can sit in more than one turma |
| `aulas` | id, turma_id, type (scheduled, lightning), start_at, duration_min, meet_link, status (scheduled, live, ended), ping_at, reminder_sent_at, created_by | Same shape as the prototype; at most one live lightning class per turma |
| `push_subscriptions` | person_id, endpoint, keys, platform, last_ok_at | One row per device; drop on 404/410 |
| `join_events` | aula_id, person_id, joined_at | Attendance |

Row-level security keeps each school's data separate: a student reads only their own turmas and aulas; only teachers of a turma (or a school admin) write its aulas. Rosters, access codes and logins are written only by server code with the service role.

Schema details, as built in `supabase/migrations/`:

- Meet links are checked in the database as well as in the app (`https://meet.google.com/xxx-yyyy-zzz` only).
- A scheduled class is `scheduled` or `ended`; whether it is joinable comes from the clock (T-10 until its end). A lightning class is created `live`, and a trigger ends the turma's previous live lightning class in the same transaction.
- The signed-in person is found through `person_logins` from `auth.uid()`, so the access-code login (milestone 3) only has to create a Supabase Auth session for the device and link it.
- `npm run test:db` applies the migrations and seed to a throwaway Postgres and runs the RLS tests in `db/tests/rls.sql` (no Docker needed).
- A scheduled class opening (T-10) also ends a live lightning class of the same turma, so students only ever see one button. The app applies this rule when it shows classes (`resolveOverlaps` in `src/lib/aulas.ts`).

### Sign-in (decided 2026-09-29)

Each device signs in with Supabase **anonymous sign-in** (no email or phone stored), and only when someone submits a code. The browser then calls the database function `redeem_access_code(code)`, which normalises and hashes the code with a per-database pepper (`private.settings`), links the device's auth user to the person in `person_logins`, and blocks a device after 5 wrong codes (20 per IP) in 10 minutes. "Sair" deletes that link. The app has no server secrets: the browser uses the publishable key and RLS does the rest. Live updates come from Supabase Realtime on `aulas` and `turmas`, with a one-minute poll and a reload when the app returns to the foreground as fallbacks.

The development project is `wiz-aula` (Supabase, region sa-east-1). The app is deployed on Vercel as project `wiz-aula` at https://wiz-aula.vercel.app (production builds from `main`, previews from other branches; Vercel's login wall is off so phones can open previews).

### Push alerts and install (built 2026-09-29)

- **Install:** web app manifest and icons (`src/app/manifest.ts`, `public/icons/`, `src/app/apple-icon.png`). Chrome and Edge get a one-tap **Instalar** card (`beforeinstallprompt`); an iPhone or iPad in a Safari tab gets a card explaining Compartilhar › Adicionar à Tela de Início instead of the alerts button.
- **Subscribe:** the student taps **Ativar avisos**; the permission prompt opens straight from that tap, the service worker (`public/sw.js`) subscribes with the VAPID public key (read from the database with `vapid_public_key()`), and the subscription is saved in `push_subscriptions` under RLS. Sair deletes this device's subscription.
- **Send:** everything runs inside Supabase, so the Next.js app still has no secrets.
  - A trigger on `aulas` calls the Edge Function `send-push` through `pg_net` when a lightning class starts or the teacher taps Avisar de novo.
  - A `pg_cron` job runs `private.send_due_reminders()` every minute and asks for a reminder once per scheduled class when it is 10 minutes or less from starting.
  - `send-push` checks a shared secret, loads the class and the enrolled students' subscriptions with the service role, sends with the `web-push` package and deletes subscriptions that answer 404/410.
- **Tap:** the notification opens the Meet link directly (the Meet app on phones). A re-sent alert replaces the previous one (same tag).
- **Per-project setup** (done for `wiz-aula`): apply the migrations, deploy `supabase/functions/send-push` with JWT verification off (it checks its own secret), and set `vapid_public_key`, `vapid_private_key` (`npx web-push generate-vapid-keys`) and `functions_url` (`https://<ref>.supabase.co/functions/v1`) in `private.settings`. Until those are set, no alert is sent and the app hides the alerts card.

## Roadmap

| Phase | Duration (proposed) | Content | Gate to next phase |
| --- | --- | --- | --- |
| Prototype | done 2026-09-28 | Clickable demo with shared class data (`prototype/wiz-aula.html`) | Teacher OK on the demo |
| MVP | about 3 weeks; milestones 1–3 (scaffold, database, code login with live data) and 5 (installable PWA, push alerts, T-10 reminders) done by 2026-09-29 | PWA (manifest, service worker, install screens), access-code login, Supabase schema + RLS, VAPID Web Push, T-10 reminder cron, in-app setup guide | One pilot turma installed |
| Pilot | about 4 weeks | 3 turmas (adult, teens, kids) | ≥90% installed with alerts on; median alert-to-Meet < 20 s; < 5% alerts missed |
| Rollout | after pilot | Roster import, access-code cards, attendance, optional Play Store via TWA | — |

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| iPhone/iPad users skip "Add to Home Screen", so no alerts | Detect a Safari tab and show only the install card until installed |
| iOS older than 16.4 | Show next class and join button without alerts; WhatsApp reminder fallback (Z-API already in the Mister Wiz stack) |
| Teacher on a personal Google account cannot set Open access | Teacher admits guests manually; guide says so |
| Meet link typos | Validate and normalise on paste; fixed link per turma |
| Stale push subscriptions | Delete on 404/410; "Ativar avisos" re-subscribes |
| Minors' data (LGPD) | Store only name and turma; access codes, not accounts |

## Open decisions

- [x] Standalone product or a module inside the existing Mister Wiz app? **Decided 2026-09-28: standalone Next.js PWA** on the Speak Easy stack.
- [ ] Domain (for example a subdomain of misterwiz.fun).
- [ ] Which three turmas run the pilot.
- [ ] Whether Speak Easy reuses the same codebase for its live and lightning classes.
