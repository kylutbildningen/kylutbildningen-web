"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import {
  PlusIcon, TrashIcon, LoaderIcon, UserIcon, CheckIcon, XIcon,
} from "@/components/icons";

interface EduPerson {
  PersonId: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Mobile: string;
  IsContactPerson: boolean;
  CanLogin: boolean;
  CivicRegistrationNumber: string;
}

interface Member {
  id: string;
  user_id: string;
  edu_customer_id: number;
  edu_contact_id: number | null;
  company_name: string;
  role: string;
  is_contact_person: boolean;
  created_at: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [persons, setPersons] = useState<EduPerson[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<number>(0);
  const [companyName, setCompanyName] = useState("");
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Add person state
  const [showAdd, setShowAdd] = useState(false);
  const [newPerson, setNewPerson] = useState({ firstName: "", lastName: "", email: "", phone: "", isContactPerson: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/logga-in"); return; }
      setUserId(user.id);
      setUserEmail(user.email || "");

      const stored = sessionStorage.getItem("selected_company");
      const { data: membership } = await supabase
        .from("company_memberships")
        .select("edu_customer_id, company_name, role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!membership) { router.replace("/dashboard"); return; }

      const cid = stored ? parseInt(stored) : membership.edu_customer_id;
      setCustomerId(cid);
      setCompanyName(membership.company_name);

      await Promise.all([fetchPersons(cid), fetchMembers(cid)]);
    }
    load();
  }, [router]);

  const fetchPersons = useCallback(async (cid: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/edu/persons?customerId=${cid}`);
      if (res.ok) setPersons(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  async function fetchMembers(cid: number) {
    const supabase = createSupabaseBrowser();
    const { data } = await supabase
      .from("company_memberships")
      .select("*")
      .eq("edu_customer_id", cid);
    setMembers(data || []);
  }

  // Check if a person has a linked Supabase membership
  function getMemberForPerson(person: EduPerson): Member | undefined {
    return members.find(m => m.edu_contact_id === person.PersonId);
  }

  // Check if person's email matches any member's auth
  function isPersonLinked(person: EduPerson): boolean {
    return !!getMemberForPerson(person) ||
      members.some(m => {
        // We don't have the member's email easily, but we check contact_id
        return m.edu_contact_id === person.PersonId;
      });
  }

  async function handleAddPerson(e: React.FormEvent) {
    e.preventDefault();
    if (!newPerson.firstName || !newPerson.lastName) {
      setError("Förnamn och efternamn krävs");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/edu/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, ...newPerson }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSuccess(`${newPerson.firstName} ${newPerson.lastName} har lagts till`);
      setNewPerson({ firstName: "", lastName: "", email: "", phone: "", isContactPerson: true });
      setShowAdd(false);
      await fetchPersons(customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte lägga till");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePerson(person: EduPerson) {
    const name = `${person.FirstName?.trim()} ${person.LastName?.trim()}`;
    const member = getMemberForPerson(person);
    const msg = member
      ? `Ta bort ${name}s åtkomst till portalen? Personen finns kvar i EduAdmin.`
      : `${name} har inget portalkonto — personen kan bara tas bort direkt i EduAdmin.`;
    if (!confirm(msg)) return;
    if (!member) return;

    setError(null);
    try {
      const supabase = createSupabaseBrowser();
      const { error: dbErr } = await supabase.from("company_memberships").delete().eq("id", member.id);
      if (dbErr) throw dbErr;
      setSuccess(`${name}s åtkomst till portalen har tagits bort`);
      await fetchMembers(customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte ta bort");
    }
  }

  async function handleToggleContactPerson(person: EduPerson) {
    setError(null);
    try {
      const res = await fetch(`/api/edu/persons/${person.PersonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isContactPerson: !person.IsContactPerson }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchPersons(customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte uppdatera");
    }
  }

  async function handleSendInvite(person: EduPerson) {
    if (!person.Email) {
      setError("Personen saknar e-postadress — lägg till en först.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      // Send magic link via Supabase
      const supabase = createSupabaseBrowser();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: person.Email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          shouldCreateUser: true,
        },
      });
      if (otpError) throw otpError;
      setSuccess(`Inloggningslänk skickad till ${person.Email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skicka inbjudan");
    } finally {
      setSaving(false);
    }
  }

  const contactPersons = persons.filter(p => p.IsContactPerson);
  const otherPersons = persons.filter(p => !p.IsContactPerson);
  const isMe = (person: EduPerson) => person.Email?.toLowerCase() === userEmail.toLowerCase();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <a href="/dashboard" className="mb-4 inline-block text-sm font-medium" style={{ color: "var(--frost)" }}>
          ← Dashboard
        </a>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl" style={{ fontFamily: "var(--font-serif)", color: "var(--slate-deep)" }}>
              Hantera team
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--slate-light)" }}>
              {companyName} — {persons.length} person{persons.length !== 1 ? "er" : ""} i EduAdmin
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)" }}
          >
            <PlusIcon /> Lägg till person
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--danger)", backgroundColor: "#fef2f2", color: "var(--danger)" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--success)", backgroundColor: "#ecfdf5", color: "var(--success)" }}>
            {success}
          </div>
        )}

        {/* Add person form */}
        {showAdd && (
          <form onSubmit={handleAddPerson} className="mb-6 rounded-lg border bg-white p-5" style={{ borderColor: "var(--border)" }}>
            <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--slate-deep)" }}>Lägg till ny person</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input type="text" value={newPerson.firstName} onChange={e => setNewPerson({ ...newPerson, firstName: e.target.value })} placeholder="Förnamn *" className="form-input text-sm" autoFocus />
              <input type="text" value={newPerson.lastName} onChange={e => setNewPerson({ ...newPerson, lastName: e.target.value })} placeholder="Efternamn *" className="form-input text-sm" />
              <input type="email" value={newPerson.email} onChange={e => setNewPerson({ ...newPerson, email: e.target.value })} placeholder="E-post" className="form-input text-sm" />
              <input type="tel" value={newPerson.phone} onChange={e => setNewPerson({ ...newPerson, phone: e.target.value })} placeholder="Telefon" className="form-input text-sm" />
            </div>
            <div className="mt-3 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm" style={{ color: "var(--slate-light)" }}>
                <input type="checkbox" checked={newPerson.isContactPerson} onChange={e => setNewPerson({ ...newPerson, isContactPerson: e.target.checked })} className="accent-[var(--frost)]" />
                Kontaktperson
              </label>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}>
                  <XIcon /> Avbryt
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--frost)" }}>
                  <CheckIcon /> {saving ? "Sparar..." : "Lägg till"}
                </button>
              </div>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><LoaderIcon className="animate-spin" /></div>
        ) : (
          <>
            {/* Contact persons */}
            <PersonSection
              title="Kontaktpersoner"
              persons={contactPersons}
              members={members}
              userId={userId}
              userEmail={userEmail}
              onDelete={handleDeletePerson}
              onToggleContact={handleToggleContactPerson}
              onSendInvite={handleSendInvite}
              getMemberForPerson={getMemberForPerson}
              highlight
            />

            {/* Other persons */}
            <PersonSection
              title="Övriga personer"
              persons={otherPersons}
              members={members}
              userId={userId}
              userEmail={userEmail}
              onDelete={handleDeletePerson}
              onToggleContact={handleToggleContactPerson}
              onSendInvite={handleSendInvite}
              getMemberForPerson={getMemberForPerson}
            />

            {persons.length === 0 && (
              <div className="py-12 text-center" style={{ color: "var(--slate-light)" }}>
                Inga personer registrerade i EduAdmin.
              </div>
            )}
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

function PersonSection({
  title,
  persons,
  members,
  userId,
  userEmail,
  onDelete,
  onToggleContact,
  onSendInvite,
  getMemberForPerson,
  highlight,
}: {
  title: string;
  persons: EduPerson[];
  members: Member[];
  userId: string;
  userEmail: string;
  onDelete: (p: EduPerson) => void;
  onToggleContact: (p: EduPerson) => void;
  onSendInvite: (p: EduPerson) => void;
  getMemberForPerson: (p: EduPerson) => Member | undefined;
  highlight?: boolean;
}) {
  if (persons.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
        <UserIcon /> {title} ({persons.length})
      </h2>
      <div className="rounded-lg border bg-white" style={{ borderColor: "var(--border)" }}>
        {persons.map((person, i) => {
          const member = getMemberForPerson(person);
          const isCurrentUser = person.Email?.toLowerCase() === userEmail.toLowerCase();
          const hasAccount = !!member;

          return (
            <div key={person.PersonId} className="flex items-center gap-3 px-5 py-3.5 event-row" style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: highlight ? "var(--frost-light)" : "#f0f0f0", color: highlight ? "var(--frost-dark)" : "var(--slate-light)" }}>
                <UserIcon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--slate-deep)" }}>
                    {person.FirstName?.trim()} {person.LastName?.trim()}
                  </span>
                  {isCurrentUser && <span className="badge text-[10px]" style={{ backgroundColor: "var(--frost-light)", color: "var(--frost-dark)" }}>Du</span>}
                  {person.IsContactPerson && <span className="badge badge-available text-[10px]">Kontaktperson</span>}
                  {hasAccount && <span className="badge text-[10px]" style={{ backgroundColor: "#ecfdf5", color: "var(--success)" }}>Har konto</span>}
                  {member && <RoleBadge role={member.role} />}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs" style={{ color: "var(--slate-light)" }}>
                  {person.Email && <span>{person.Email}</span>}
                  {(person.Phone || person.Mobile) && <span>{person.Phone || person.Mobile}</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {/* Toggle contact person */}
                <button
                  onClick={() => onToggleContact(person)}
                  className="rounded px-2 py-1 text-[11px] font-medium transition-colors"
                  style={{ color: person.IsContactPerson ? "var(--warning)" : "var(--frost)" }}
                  title={person.IsContactPerson ? "Ta bort som kontaktperson" : "Gör till kontaktperson"}
                >
                  {person.IsContactPerson ? "Ta bort kontakt" : "Gör kontakt"}
                </button>

                {/* Send invite if no account */}
                {!hasAccount && person.Email && !isCurrentUser && (
                  <button
                    onClick={() => onSendInvite(person)}
                    className="rounded px-2 py-1 text-[11px] font-medium transition-colors"
                    style={{ color: "var(--frost)" }}
                    title="Skicka inloggningslänk"
                  >
                    Bjud in
                  </button>
                )}

                {/* Delete */}
                {!isCurrentUser && (
                  <button onClick={() => onDelete(person)} className="rounded p-1 transition-colors" style={{ color: "var(--danger)" }} title="Ta bort">
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface EduPerson {
  PersonId: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Mobile: string;
  IsContactPerson: boolean;
  CanLogin: boolean;
  CivicRegistrationNumber: string;
}
