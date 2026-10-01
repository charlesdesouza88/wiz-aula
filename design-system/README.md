# Wiz Aula design system

Copied from the Wiz Aula design system artifact on Claude (last change 2026-10-01). The app follows it: tokens in `src/app/globals.css`, logos in `src/assets/` and `public/icons/`. Open the previews in `components/` for each part.

Wiz Aula is the one-tap class-join app of the Mister Wiz (Escola de Líderes) network: a teacher posts a Google Meet link, students get an alert and press one big yellow button. It is built for people with little tech experience — older adults, kids, first-time smartphone users — so every rule below serves legibility and a single obvious action. It wears the Mister Wiz class-materials look: purple capsules, plum text, lavender and gold.

## Content fundamentals

- **Interface copy is Portuguese (pt-BR)**; plain words, no jargon, no English UI terms. Speak to the user as *você*: "Toque em **Pedir para participar**", "Quando o professor começar uma aula, você recebe um aviso".
- Sentence case everywhere except `eyebrow` (the capsule label) and `tagline`, which are uppercase by style, not by typing.
- Name buttons with the exact verb: **Entrar na aula**, **Instalar**, **Começar aula relâmpago**. Quote device labels word for word inside `.kbd`: "depois em `Adicionar à Tela de Início`".
- Get number agreement and accents right: "Falta 1 minuto" / "Faltam 5 minutos", "Aula relâmpago".
- No emoji. Calm, reassuring empty states: "Tudo tranquilo por aqui".

## Visual foundations

### Color
- Light is the first theme; dark follows the system setting or `data-theme="dark"`. Every pair below passes WCAG AA in both.
- Pages sit on `bg` (the materials' soft fill); content on `surface` (cards, inputs) or `surface-2` (lavender wells, nav track, `.kbd`, alternate list rows). Borders and dividers are the `line` hairline.
- Text is `ink`; secondary text `muted`. Both read on `bg`, `surface`, `surface-2` and `gold-soft`.
- `primary` (Mister Wiz purple) is the brand voice: capsule labels (`.eyebrow`), `.btn` fills with `on-primary`, numbered step discs, ghost-button text, focused input borders.
- `header` (dark purple) with `on-header` is for header bars of tables and lists, as in the class materials. `gold-light` is the materials' highlight gold, for highlighted cells behind `ink` — never a button.
- `gold` is reserved for entering a class: the join button, `.btn-gold`, the live hero's border (on `gold-soft`). Text on gold is always `on-gold`.
- `live` means a class is on now (dot, "Ao vivo" pill with `on-live`); small live text uses `live-ink`.
- `ok` is the only green, for success text. Errors are `err-ink` on `err-bg`. No other blues or greens.
- Status is never color alone: pills and the live dot always carry a word.

### Type
- One face, **Carlito** (Google Fonts; metric-compatible with Calibri, the font of the Mister Wiz class materials), at 400 and 700. Headings are the same face set bold; `display` and `body` name the same stack.
- `body` is 18px / 1.5 — the floor. Never set reading text smaller than `small` (0.95rem).
- Headings use `display` at line-height 1.15 with balanced wrapping: `hero-title`, `heading`; times in `time-display` with tabular numerals.
- All sizes are rem so the text-size control (`text-size-0` / `-1` / `-2`: 100 / 112.5 / 125%) scales the whole UI.

### Spacing, radius and layout
- Spacing follows Tailwind's 0.25rem steps (`space-1-5` … `space-12`). Card padding `space-5`, gaps inside cards `space-3-5`, page gutter `space-4`.
- **Capsules are the signature shape**, as in the class-materials banners: buttons, the join button, the nav track and its tabs, the size button, choice buttons and `.eyebrow` labels are fully rounded (`radius-btn`, `radius-pill`).
- Boxes are softer rectangles: cards, the hero, the live alert and guide steps at `radius-card` (16px); inputs and messages at `radius-input` (14px).
- Every control is at least `tap-min` (56px) tall; the join button at least `join-min` (84px).
- One column on phones (`page-max-phone`), wider from `bp-tablet` (640px, `page-max-tablet`), two columns from `bp-desktop` (960px, `page-max-desktop`). No horizontal scroll at 390px.

### Depth, focus and motion
- Flat by default: cards have a `line` border and no shadow. `shadow-card` lifts only the hero and the selected nav tab; `shadow-alert` only the floating live alert.
- Focus is a 3px solid `gold` outline, 2px offset, `radius-focus` corners. On light `surface` it measures 1.9:1, below the 3:1 a focus ring should meet — kept exact from the source; consider a darker ring for light mode.
- Motion is limited to the live-dot pulse and the join button's 2px press; both stop under `prefers-reduced-motion`.

## Principles

- **One primary action per screen.** The student home shows the hero and its join button; nothing competes with it.
- **Two taps, not dialogs,** for destructive actions (`ConfirmButton`).
- Two class types: scheduled (the button lights up 10 minutes before) and *aula relâmpago* (starts now, `bolt.svg`).

## Logo

- Every screen opens with the **MISTER WIZ** wordmark (`assets/Logos/mister-wiz-logo.png`; `mister-wiz-logo-white.png` in the dark theme) at 28px tall, with "**Wiz Aula** · Escola de Líderes" under it in `tagline`. See `BrandMark`.
- The **Mister Wiz symbol** — the white figure on the `symbol-top` → `symbol-bottom` gradient — is the app icon, the Home Screen icon, the notification badge and the small tile in alerts.
- Never redraw, recolor (beyond the provided white version), stretch or add effects to either. `logo-*` and `symbol-*` colors belong to the marks only.

## Iconography

- A tiny in-house set of 24×24 inline SVGs (`assets/Icons/`): `camera.svg`, `bolt.svg`, `share.svg`. Solid fills, rounded joins; they take `currentColor` in code.
- The camera glyph appears only inside the join button; it is not a logo.
- No emoji, no icon library.

## Not synced

- **Components are static renditions.** The repository is a Next.js app, not a component library: there is no exported bundle, so each card shows the source's markup styled by `components/bundle.css` (the `@layer components` classes of `src/app/globals.css`, translated 1:1). Data-bound screens (teacher and admin forms, roster, schedule, turmas, student home, alerts card, guide steps) were not carded.
- **Fonts:** Carlito comes from Google Fonts via `next/font`; no font files are stored here and `bundle.css` imports it from Google Fonts.
- **Brand red** `#E24B4A` from the class materials was not adopted for `live`: white or plum text on it misses 4.5:1, so `live` stays `#D23B3B`.
- **Skipped values:** the join button's ledge and the live-dot pulse use `color-mix()`, which cannot be a token. Spacing token names were assigned from Tailwind steps; the source uses utilities, not named spacing variables.
