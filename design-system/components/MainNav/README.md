# MainNav
The segmented tab bar under the header: two tabs for students and teachers, three for school admins.

- **Source:** `src/components/main-nav.tsx`.
- **Consumer supplies:** nothing; items come from the session role ("Minhas aulas", "Alunos" for admins, "Como instalar").
- Track: a `surface-2` capsule (`radius-btn`), padding and gap `space-1-5`, max width 36rem on computers.
- Tab: a capsule, min-height `tap-min`, `label` style. Current tab: `ink` on `surface` with `shadow-card` and `aria-current="page"`; others `muted`, `ink` on hover.
