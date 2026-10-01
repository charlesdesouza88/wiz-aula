import Image from "next/image";
import logo from "@/assets/mister-wiz-logo.png";
import logoWhite from "@/assets/mister-wiz-logo-white.png";
import symbol from "@/assets/mister-wiz-symbol.png";

/** The MISTER WIZ wordmark at the top of every screen; the white file in the dark theme. */
export function MisterWizLogo() {
  return (
    <>
      <Image src={logo} alt="Mister Wiz" priority className="logo-light h-7 w-auto" />
      <Image src={logoWhite} alt="Mister Wiz" priority className="logo-dark h-7 w-auto" />
    </>
  );
}

/** The Mister Wiz symbol tile: the white figure on the purple gradient. Decorative. */
export function BrandMark({ size = 42 }: { size?: number }) {
  return (
    <Image
      src={symbol}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className="flex-none rounded-xl"
      style={{ width: size, height: size }}
    />
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
