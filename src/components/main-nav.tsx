"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";

// The access code decides whether "/" is the student or the teacher screen.
const ITEMS = [
  { href: "/", label: "Minhas aulas" },
  { href: "/como-instalar", label: "Como instalar" },
];
// School admins also manage people and access codes.
const ADMIN_ITEMS = [ITEMS[0], { href: "/alunos", label: "Alunos" }, ITEMS[1]];

export function MainNav() {
  const pathname = usePathname();
  const session = useSession();
  const items = session.status === "signed-in" && session.person.role === "admin" ? ADMIN_ITEMS : ITEMS;
  return (
    <nav aria-label="Menu" className="desktop:max-w-[36rem]">
      <ul className={`grid gap-1.5 rounded-full bg-surface-2 p-1.5 ${items.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {items.map((item) => {
          const current = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-14 items-center justify-center rounded-full px-1.5 py-2.5 text-center text-base leading-tight font-bold ${
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
