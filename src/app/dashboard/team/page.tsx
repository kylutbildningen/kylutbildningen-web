"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { PlusIcon, TrashIcon, LoaderIcon } from "@/components/icons";

interface Member {
  id: string;
  user_id: string;
  edu_customer_id: number;
  company_name: string;
  role: string;
  is_contact_person: boolean;
  created_at: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<number>(0);
  const [companyName, setCompanyName] = useState("");
  const [userId, setUserId] = useState("");

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("contact_person");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/logga-in");
        return;
      }
      setUserId(user.id);

      // Get selected company
      const stored = sessionStorage.getItem("selected_company");
      if (!stored) {
        router.replace("/dashboard");
        return;
      }

      const cid = parseInt(stored);
      setCustomerId(cid);

      // Verify admin role
      const { data: membership } = await supabase
        .from("company_memberships")
        .select("role, company_name")
        .eq("user_id", user.id)
        .eq("edu_customer_id", cid)
        .single();

      if (!membership || membership.role !== "company_admin") {
        router.replace("/dashboard");
        return;
      }
      setCompanyName(membership.company_name);

      await fetchMembers(cid);
    }

    load();
  }, [router]);

  async function fetchMembers(cid: number) {
    setLoading(true);
    const res = await fetch(`/api/team/members?customerId=${cid}`);
    if (res.ok) {
      setMembers(await res.json());
    }
    setLoading(false);
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    await fetch(`/api/team/members/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    await fetchMembers(customerId);
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Vill du ta bort denna medlem?")) return;
    await fetch(`/api/team/members/${memberId}`, { method: "DELETE" });
    await fetchMembers(customerId);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);
    setInviteResult(null);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          customerId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error);
      } else {
        setInviteResult(
          `Inbjudan skickad till ${inviteEmail}${data.contactName ? ` (${data.contactName})` : ""}`,
        );
        setInviteEmail("");
      }
    } catch {
      setInviteError("Kunde inte skicka inbjudan");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--slate-deep)",
              }}
            >
              Teammedlemmar
            </h1>
            <p className="text-sm" style={{ color: "var(--slate-light)" }}>
              {companyName}
            </p>
          </div>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{
              background:
                "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
            }}
          >
            <PlusIcon />
            Bjud in
          </button>
        </div>

        {/* Invite form */}
        {showInvite && (
          <div
            className="mb-6 rounded-lg border bg-white p-5"
            style={{ borderColor: "var(--border)" }}
          >
            <h3
              className="mb-4 text-sm font-semibold"
              style={{ color: "var(--slate-deep)" }}
            >
              Bjud in ny medlem
            </h3>
            <p
              className="mb-4 text-xs leading-relaxed"
              style={{ color: "var(--slate-light)" }}
            >
              Personen måste vara registrerad som kontakt hos {companyName} i
              EduAdmin.
            </p>

            {inviteError && (
              <div
                className="mb-3 rounded-lg border p-3 text-xs"
                style={{
                  borderColor: "var(--danger)",
                  backgroundColor: "#fef2f2",
                  color: "var(--danger)",
                }}
              >
                {inviteError}
              </div>
            )}

            {inviteResult && (
              <div
                className="mb-3 rounded-lg border p-3 text-xs"
                style={{
                  borderColor: "var(--success)",
                  backgroundColor: "#ecfdf5",
                  color: "var(--success)",
                }}
              >
                {inviteResult}
              </div>
            )}

            <form
              onSubmit={handleInvite}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="kollega@foretag.se"
                className="form-input flex-1"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-lg border px-3 py-2.5 text-sm"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--slate-deep)",
                }}
              >
                <option value="contact_person">Kontaktperson</option>
                <option value="participant">Deltagare</option>
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--frost)" }}
              >
                {inviting ? "Skickar..." : "Skicka"}
              </button>
            </form>
          </div>
        )}

        {/* Members table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoaderIcon className="animate-spin" />
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-lg border bg-white"
            style={{ borderColor: "var(--border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#fafafa" }}>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--slate-light)" }}
                  >
                    Medlem
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--slate-light)" }}
                  >
                    Roll
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--slate-light)" }}
                  >
                    Tillagd
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--slate-deep)" }}
                    >
                      {member.user_id === userId ? "Du" : member.user_id.slice(0, 8)}
                      {member.is_contact_person && (
                        <span
                          className="ml-2 text-xs"
                          style={{ color: "var(--slate-light)" }}
                        >
                          (EduAdmin-kontakt)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {member.user_id === userId ? (
                        <RoleBadge role={member.role} />
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.id, e.target.value)
                          }
                          className="rounded border px-2 py-1 text-xs"
                          style={{
                            borderColor: "var(--border)",
                            color: "var(--slate-deep)",
                          }}
                        >
                          <option value="company_admin">Admin</option>
                          <option value="contact_person">Kontaktperson</option>
                          <option value="participant">Deltagare</option>
                        </select>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "var(--slate-light)" }}
                    >
                      {new Date(member.created_at).toLocaleDateString("sv-SE")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {member.user_id !== userId && (
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="p-1 transition-colors"
                          style={{ color: "var(--danger)" }}
                          title="Ta bort"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6">
          <a
            href="/dashboard"
            className="text-sm font-medium underline"
            style={{ color: "var(--frost)" }}
          >
            ← Tillbaka till dashboard
          </a>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
