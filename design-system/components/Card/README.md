# Card
`.card` is the standard container: a white (dark: `surface`) panel with a `line` border, used for every block below the hero.

- **Source:** `src/app/globals.css` (`.card`, `.eyebrow`); example from `src/components/install-card.tsx`.
- **Consumer supplies:** the children, typically an optional `.eyebrow`, a bold title, a `small` sentence in `muted`, and at most one button.
- Flex column, gap `space-3-5`, padding `space-5`, `radius-card` (16px), 1px `line` border, `surface` fill. No shadow; only the hero and selected nav tab use `shadow-card`.
- `.eyebrow`: a purple capsule label (`on-primary` on `primary`, `radius-pill`, `.25rem` × `.875rem`), the `eyebrow` style, uppercase. It sits at the top of a card or hero as its section banner.
