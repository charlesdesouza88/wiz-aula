# ConfirmButton
A two-tap button for destructive actions: the first tap swaps the label to "Toque para confirmar" for 5 seconds, the second does it.

- **Source:** `src/components/confirm-button.tsx`.
- **Props:** `label`, `confirmLabel` (default "Toque para confirmar"), `onConfirm`, `className` (default `btn-ghost`).
- Used instead of a modal dialog; the label change is announced (`aria-live="polite"`).
