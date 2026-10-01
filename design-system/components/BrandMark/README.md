# BrandMark
The Mister Wiz identity in the app: the MISTER WIZ wordmark heading every screen, and the Mister Wiz symbol tile wherever a small mark is needed.

- **Header lockup** (`MisterWizLogo` in `src/components/icons.tsx`, used in `src/app/layout.tsx`): the wordmark at 28px tall (`h-7`), then "**Wiz Aula** · Escola de Líderes" in the `tagline` style — `ink` for the app name, `muted` for the rest. Use `mister-wiz-logo.png` on light grounds and `mister-wiz-logo-white.png` in the dark theme; never both, never recolored, never stretched (aspect 477 × 63).
- **Symbol tile** (`BrandMark`): the white figure on the purple gradient tile, at 42px (40px in the live alert) with `radius-md` corners. Props: `size` (px, default 42). It is decorative (`aria-hidden`); the wordmark carries the name.
- Keep clear space around the wordmark of at least the height of its purple dot on every side.
- The camera glyph is no longer a logo: it stays only inside the join button (`assets/Icons/camera.svg`).
