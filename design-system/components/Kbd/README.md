# Kbd
`.kbd` marks the exact name of a button or menu item the user must tap, inside install and alert instructions.

- **Source:** `src/app/globals.css` (`.kbd`); used in `alerts-card.tsx` and `src/content/guides.tsx`.
- **Consumer supplies:** the on-screen label, word for word as the device shows it, optionally preceded by a 16px icon (e.g. `share.svg`).
- Inline, `surface-2` fill, `radius-kbd`, horizontal padding `.5rem`, bold; wraps with its padding cloned on each line.
