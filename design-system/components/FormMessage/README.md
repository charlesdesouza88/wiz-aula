# FormMessage
The result line under a form: an error box or a bold success line, announced politely to screen readers.

- **Source:** `src/components/form-message.tsx`, `.msg-err` / `.msg-ok` in `globals.css`.
- **Props:** `message` — `{ kind: "ok" | "err", text }` or `null` (renders an empty live region).
- `.msg-err`: `err-ink` on `err-bg`, `radius-md`, padding `space-2-5` × `space-3-5`, 1rem.
- `.msg-ok`: `ok` text, 1rem/700, no box.
- Write the message as plain Portuguese telling the user what to do next.
