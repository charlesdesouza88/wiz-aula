"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The access code decides whether "/" is the student or the teacher screen.
const ITEMS = [
  { href: "/", label: "Minhas aulas" },
  { href: "/como-instalar", label: "Como instalar" },
];

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu" className="desktop:max-w-[36rem]">
      <ul className="grid grid-cols-2 gap-1.5 rounded-2xl bg-surface-2 p-1.5">
        {ITEMS.map((item) => {
          const current = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-14 items-center justify-center rounded-xl px-1.5 py-2.5 text-center text-base leading-tight font-bold ${
                  current ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
