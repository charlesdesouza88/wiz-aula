# Hero
The student home's one card: the live class with the join button, the next class with its countdown, or an empty state.

- **Source:** `src/components/student/hero.tsx`.
- **Props:** `turma`, `showTurma` (name the turma when the student has several), `live`, `next`, `now`, `device` (`pc` changes the Meet hint), `onJoin`.
- Shell: `radius-hero`, 1px border, padding `space-6` × `space-5` (from 640px `space-8` × `space-7`), `shadow-card`, gap `space-3-5`.
- **Live:** `gold` border on `gold-soft`; a `live-dot` and "Aula ao vivo agora" (or "Pode entrar" before the start) in `live-ink`, uppercase, 0.9rem/700, tracking .06em; title in `hero-title`; then `JoinButton` and a device-specific hint in `muted`.
- **Next:** `line` border on `surface`; `eyebrow` "Próxima aula", time in `time-display`, day in `heading`, countdown in `muted`, then the placeholder well.
- **Empty:** eyebrow "Nenhuma aula marcada", heading "Tudo tranquilo por aqui", one sentence in `muted`.
- Copy is plain pt-BR; countdowns agree in number ("Falta 1 minuto" / "Faltam 5 minutos").
