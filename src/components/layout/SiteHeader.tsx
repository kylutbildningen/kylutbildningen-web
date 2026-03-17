"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SnowflakeIcon } from "@/components/icons";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-40 border-b"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "rgba(248, 248, 246, 0.85)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <SnowflakeIcon className="opacity-70" />
          <span
            className="text-lg font-semibold tracking-tight"
            style={{ color: "var(--slate-deep)" }}
          >
            Kylutbildningen
          </span>
        </Link>
        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/"
            className="hidden text-sm font-medium transition-colors sm:block"
            style={{
              color: pathname === "/" ? "var(--frost)" : "var(--slate-light)",
            }}
          >
            Start
          </Link>
          <Link
            href="/kurser"
            className="text-sm font-medium transition-colors"
            style={{
              color: pathname === "/kurser" ? "var(--frost)" : "var(--slate-light)",
            }}
          >
            Kursutbud
          </Link>
          <Link
            href="/kurser"
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--frost)" }}
          >
            Boka nu
          </Link>
        </div>
      </div>
    </nav>
  );
}
