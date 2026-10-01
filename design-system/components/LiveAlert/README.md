# LiveAlert
The in-app banner that drops in when a class opens while the app is open: tapping it joins the class.

- **Source:** `src/components/student/live-alert.tsx`.
- **Props:** `turma`, `live` (the open class), `sound` (plays a chime once per new alert).
- A link fixed at the top center (top-right on computers, 24rem wide), `radius-alert`, 1px `line` border on `surface`, `shadow-alert`, the Mister Wiz symbol tile (`BrandMark`) at 40px, then "Wiz Aula · agora" in `muted`, a bold line ("Sua aula vai começar!" or "Aula relâmpago começou!") and "<turma> · Toque para entrar." Hides after 12 seconds; lives in a `role="status"` polite region.
