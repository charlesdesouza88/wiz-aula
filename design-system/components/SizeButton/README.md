# SizeButton
The text-size control at the right of the header: one button that cycles the page through 100, 112.5 and 125%.

- **Source:** `src/components/size-button.tsx`; sizes in `globals.css` (`html.wa-size-1`, `html.wa-size-2`).
- Shows **A+** at normal size, **A++** at `text-size-1`, **A** at `text-size-2` (back to normal). The `aria-label` says what the next tap does.
- 56×56 minimum (`tap-min`), a capsule (`radius-btn`), 1px `line` border on `surface`, bold; border `primary` on hover. The choice is saved and applied before first paint.
- Every size in the system is rem so this control scales the whole interface.
