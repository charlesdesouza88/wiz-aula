# JoinButton
The big gold **Entrar na aula** link: the one primary action of the student screen.

- **Source:** `src/components/student/hero.tsx` (the `<a className="join …">`), `.join` in `globals.css`.
- **Consumer supplies:** the Meet link (`href`, opens in a new tab with `rel="noopener"`) and an `onClick` that records the join.
- min-height `join-min` (84px), a full capsule (`radius-btn`), `gold` fill, `join-label` type in `on-gold`, the camera glyph at 2rem before the label.
- Pressed state: a 4px darker-gold ledge that drops to 2px and moves the button 2px down; no movement under `prefers-reduced-motion`.
- Before the class opens, the same slot holds a `surface-2` well reading "O botão acende 10 minutos antes" in `placeholder`/`muted`.
- **Not synced:** the ledge color is `color-mix(in srgb, var(--gold) 55%, #000)`, which cannot be a token.
