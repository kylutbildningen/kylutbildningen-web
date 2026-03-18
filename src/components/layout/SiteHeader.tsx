"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SnowflakeIcon, UserIcon, ChevronDownIcon } from "@/components/icons";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

interface UserInfo {
  fullName: string;
  companyName: string;
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const supabase = createSupabaseBrowser();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", authUser.id)
        .single();

      const { data: membership } = await supabase
        .from("company_memberships")
        .select("company_name")
        .eq("user_id", authUser.id)
        .limit(1)
        .single();

      if (profile?.full_name) {
        setUser({
          fullName: profile.full_name,
          companyName: membership?.company_name ?? "",
        });
      }
    }

    loadUser();
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
    router.push("/");
  }

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
        <div className="flex items-center gap-4 sm:gap-6">
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

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all"
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: "var(--frost-light)",
                    color: "var(--frost-dark)",
                  }}
                >
                  <UserIcon />
                </div>
                <div className="hidden text-left sm:block">
                  <span
                    className="block text-xs font-semibold leading-tight"
                    style={{ color: "var(--slate-deep)" }}
                  >
                    {user.fullName}
                  </span>
                  {user.companyName && (
                    <span
                      className="block text-[10px] leading-tight"
                      style={{ color: "var(--slate-light)" }}
                    >
                      {user.companyName}
                    </span>
                  )}
                </div>
                <ChevronDownIcon />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border bg-white py-1 shadow-lg"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="border-b px-4 py-2 sm:hidden" style={{ borderColor: "var(--border)" }}>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "var(--slate-deep)" }}
                      >
                        {user.fullName}
                      </p>
                      {user.companyName && (
                        <p
                          className="text-[10px]"
                          style={{ color: "var(--slate-light)" }}
                        >
                          {user.companyName}
                        </p>
                      )}
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--frost-light)]"
                      style={{ color: "var(--slate-deep)" }}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/kurser"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--frost-light)]"
                      style={{ color: "var(--slate-deep)" }}
                    >
                      Boka kurs
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full border-t px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--frost-light)]"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--slate-light)",
                      }}
                    >
                      Logga ut
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/kurser"
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--frost)" }}
            >
              Boka nu
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
