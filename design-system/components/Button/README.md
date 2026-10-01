# Button
Three button classes: `.btn` (purple, the default action), `.btn-gold` (adds to `.btn` for the gold action) and `.btn-ghost` (bordered, secondary).

- **Source:** `src/app/globals.css` `@layer components`.
- **Consumer supplies:** a `<button>` (or link) with a short Portuguese verb label.
- `.btn`: a capsule, min-height `tap-min` (56px), `radius-btn`, padding `space-3` × `space-4-5`, `button` type style, `on-primary` on `primary`, `primary-hover` on hover.
- `.btn-gold`: `on-gold` on `gold`, hover brightens 5%. Use it only for the action that starts or enters a class.
- `.btn-ghost`: a transparent capsule, 2px `line` border, `primary` text at 0.95rem/700, border turns `primary` on hover. Default class of `ConfirmButton`.
- Never put two `.btn` fills side by side on one screen: one primary action per screen.
