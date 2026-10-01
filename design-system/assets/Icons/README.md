# Icons

The app draws a handful of inline SVG icons in `src/components/icons.tsx` on a 24×24 grid. In code they use `currentColor` or `var(--gold)`/`var(--on-gold)`; these files bake in the light-theme ink so they render in `<img>`:

- `camera.svg` — the join glyph (filled body + lens triangle). Ink `#2D1040` (`on-gold`), shown at 2rem inside the gold join button.
- `bolt.svg` — the *aula relâmpago* mark: `#EBB22E` (`gold`) fill with a 1.2px `#2D1040` (`on-gold`) outline.
- `share.svg` — the iOS Share symbol (2px stroke, `#2D1040`), shown at 16px inside `.kbd` in install instructions.

No icon library: add new icons as 24×24 inline SVGs in the same style (solid fills, rounded joins) rather than pulling in a set.
