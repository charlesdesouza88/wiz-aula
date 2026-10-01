# Field
`.field` stacks a bold label over an `.input`: the only form pattern in the app (code login, scheduling, admin forms).

- **Source:** `src/app/globals.css` (`.field`, `.input`); used in `login-form.tsx` and the teacher/admin forms.
- **Consumer supplies:** a `<label for>` and its `<input class="input">`.
- `.field`: column, gap `space-1-5`; label in `label` style.
- `.input`: min-height `tap-min`, full width, `radius-input`, 2px `line` border on `surface`, padding `space-2-5` × `space-3-5`; focus turns the border `primary` (no outline).
- Pair errors with `FormMessage` below the form, not inside the field.
