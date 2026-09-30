export function BrandMark({ size = 42 }: { size?: number }) {
  return (
    <div
      className="grid flex-none place-items-center rounded-xl bg-[#792D83]"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" width={size * 0.57} height={size * 0.57}>
        <rect x="2.5" y="6" width="13" height="12" rx="3" fill="#EBB22E" />
        <path d="M16 10.5l5-3v9l-5-3z" fill="#EBB22E" />
      </svg>
    </div>
  );
}

export function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="2.5" y="6" width="13" height="12" rx="3" fill="currentColor" />
      <path d="M16 10.5l5-3v9l-5-3z" fill="currentColor" />
    </svg>
  );
}

export function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M13 2L4 14h7l-1 8 9-12h-7z"
        fill="var(--gold)"
        stroke="var(--on-gold)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="size-4">
      <path d="M12 3v12M8 7l4-4 4 4M5 11v9h14v-9" />
    </svg>
  );
}
