# Pill
`.pill` labels a class's status in lists: live, lightning, scheduled or ended.

- **Source:** `src/app/globals.css` (`.pill`); tones from `src/components/teacher/aula-list.tsx`.
- **Consumer supplies:** one word and a tone class pair.
- `radius-pill`, padding `.25rem` × `.625rem`, 0.8rem/700, no wrapping.
- Tones: **Ao vivo** `on-live` on `live`; **Relâmpago** `on-gold` on `gold`; **Agendada** `ink` on `surface-2`; **Encerrada** `muted` with a 1px `line` border. The word always carries the meaning, never the color alone.
