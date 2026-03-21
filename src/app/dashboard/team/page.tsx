"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { SupabasePerson } from "@/lib/supabase-persons";
import {
  PlusIcon, TrashIcon, LoaderIcon, UserIcon, CheckIcon, XIcon,
} from "@/components/icons";

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
  const [persons, setPersons] = useState<SupabasePerson[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<number>(0);
  const [companyName, setCompanyName] = useState("");
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editingPerson, setEditingPerson] = useState<SupabasePerson | null>(null);
  const [personForm, setPersonForm] = useState({ firstName: "", lastName: "", email: "", phone: "", mobile: "", jobTitle: "", civicRegistrationNumber: "", isContactPerson: false });
  const [newPerson, setNewPerson] = useState({ firstName: "", lastName: "", email: "", phone: "", mobile: "", civicRegistrationNumber: "", jobTitle: "", isContactPerson: false });
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

  async function handleSync() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/edu/persons/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Synkroniserat ${data.synced} personer från EduAdmin`);
      await fetchPersons(customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Synk misslyckades");
      setLoading(false);
    }
  }

  function startEdit(person: SupabasePerson) {
    setEditingPerson(person);
    setPersonForm({
      firstName: person.first_name,
      lastName: person.last_name,
      email: person.email || "",
      phone: person.phone || "",
      mobile: person.mobile || "",
      jobTitle: person.job_title || "",
      civicRegistrationNumber: person.civic_registration_number || "",
      isContactPerson: person.is_contact_person,
    });
    setShowAdd(false);
    setError(null);
  }

  async function handleSaveEdit() {
    if (!editingPerson) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/edu/persons/${editingPerson.edu_person_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...personForm, customerId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSuccess(`${personForm.firstName} ${personForm.lastName} uppdaterad`);
      setEditingPerson(null);
      await fetchPersons(customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte spara");
    } finally {
      setSaving(false);
    }
  }

  function getMemberForPerson(person: SupabasePerson): Member | undefined {
    return members.find(m => m.edu_contact_id === person.edu_person_id);
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
      setNewPerson({ firstName: "", lastName: "", email: "", phone: "", mobile: "", civicRegistrationNumber: "", jobTitle: "", isContactPerson: false });
      setShowAdd(false);
      await fetchPersons(customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte lägga till");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePerson(person: SupabasePerson) {
    const name = `${person.first_name} ${person.last_name}`;
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

  async function handleToggleContactPerson(person: SupabasePerson) {
    setError(null);
    try {
      const res = await fetch(`/api/edu/persons/${person.edu_person_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isContactPerson: !person.is_contact_person,
          customerId,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchPersons(customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte uppdatera");
    }
  }

  async function handleSendInvite(person: SupabasePerson) {
    if (!person.email) {
      setError("Personen saknar e-postadress — lägg till en först.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const supabase = createSupabaseBrowser();
      // Don't pass ?next= so auth callback can determine the correct role
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: person.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });
      if (otpError) throw otpError;
      setSuccess(`Inloggningslänk skickad till ${person.email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skicka inbjudan");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeRole(member: Member, newRole: string) {
    setError(null);
    try {
      const supabase = createSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/auth/update-membership-role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          targetUserId: member.user_id,
          eduCustomerId: customerId,
          role: newRole,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSuccess("Roll uppdaterad");
      await fetchMembers(customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte uppdatera roll");
    }
  }

  const contactPersons = persons.filter(p => p.is_contact_person);
  const otherPersons = persons.filter(p => !p.is_contact_person);

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
              {companyName} — {persons.length} person{persons.length !== 1 ? "er" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all hover:bg-gray-50"
              style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}
              title="Hämta senaste från EduAdmin"
            >
              ↻ Synka
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)" }}
            >
              <PlusIcon /> Lägg till person
            </button>
          </div>
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

        {showAdd && (
          <form onSubmit={handleAddPerson} className="mb-6 rounded-lg border bg-white p-5" style={{ borderColor: "var(--border)" }}>
            <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--slate-deep)" }}>Lägg till ny person</h3>

            {/* Person type */}
            <div className="mb-4 flex gap-2">
              {([
                { label: "Deltagare", value: false },
                { label: "Kontaktperson", value: true },
              ] as const).map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setNewPerson({ ...newPerson, isContactPerson: opt.value })}
                  className="flex-1 rounded-lg border py-2 text-sm font-medium transition-all"
                  style={{
                    borderColor: newPerson.isContactPerson === opt.value ? "var(--frost)" : "var(--border)",
                    backgroundColor: newPerson.isContactPerson === opt.value ? "var(--frost-light)" : "#fff",
                    color: newPerson.isContactPerson === opt.value ? "var(--frost-dark)" : "var(--slate-light)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input type="text" value={newPerson.firstName} onChange={e => setNewPerson({ ...newPerson, firstName: e.target.value })} placeholder="Förnamn *" className="form-input text-sm" autoFocus />
              <input type="text" value={newPerson.lastName} onChange={e => setNewPerson({ ...newPerson, lastName: e.target.value })} placeholder="Efternamn *" className="form-input text-sm" />
              <input type="text" value={newPerson.civicRegistrationNumber} onChange={e => setNewPerson({ ...newPerson, civicRegistrationNumber: e.target.value })} placeholder="Personnummer (YYYYMMDD-XXXX)" className="form-input text-sm" />
              <input type="email" value={newPerson.email} onChange={e => setNewPerson({ ...newPerson, email: e.target.value })} placeholder="E-post" className="form-input text-sm" />
              <input type="tel" value={newPerson.phone} onChange={e => setNewPerson({ ...newPerson, phone: e.target.value })} placeholder="Telefon" className="form-input text-sm" />
              <input type="tel" value={newPerson.mobile} onChange={e => setNewPerson({ ...newPerson, mobile: e.target.value })} placeholder="Mobil" className="form-input text-sm" />
              <input type="text" value={newPerson.jobTitle} onChange={e => setNewPerson({ ...newPerson, jobTitle: e.target.value })} placeholder="Befattning" className="form-input text-sm sm:col-span-2 lg:col-span-3" />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}>
                <XIcon /> Avbryt
              </button>
              <button type="submit" disabled={saving} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--frost)" }}>
                <CheckIcon /> {saving ? "Sparar..." : "Lägg till"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><LoaderIcon className="animate-spin" /></div>
        ) : (
          <>
            <PersonSection
              title="Kontaktpersoner"
              persons={contactPersons}
              members={members}
              userEmail={userEmail}
              editingPerson={editingPerson}
              personForm={personForm}
              setPersonForm={setPersonForm}
              onEdit={startEdit}
              onCancelEdit={() => setEditingPerson(null)}
              onSaveEdit={handleSaveEdit}
              onDelete={handleDeletePerson}
              onToggleContact={handleToggleContactPerson}
              onSendInvite={handleSendInvite}
              onChangeRole={handleChangeRole}
              getMemberForPerson={getMemberForPerson}
              saving={saving}
              highlight
            />
            <PersonSection
              title="Övriga personer"
              persons={otherPersons}
              members={members}
              userEmail={userEmail}
              editingPerson={editingPerson}
              personForm={personForm}
              setPersonForm={setPersonForm}
              onEdit={startEdit}
              onCancelEdit={() => setEditingPerson(null)}
              onSaveEdit={handleSaveEdit}
              onDelete={handleDeletePerson}
              onToggleContact={handleToggleContactPerson}
              onSendInvite={handleSendInvite}
              onChangeRole={handleChangeRole}
              getMemberForPerson={getMemberForPerson}
              saving={saving}
            />
            {persons.length === 0 && (
              <div className="py-12 text-center" style={{ color: "var(--slate-light)" }}>
                Inga personer synkade ännu. Klicka på ↻ Synka för att hämta från EduAdmin.
              </div>
            )}
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

type PersonForm = { firstName: string; lastName: string; email: string; phone: string; mobile: string; jobTitle: string; civicRegistrationNumber: string; isContactPerson: boolean };

const ROLE_LABELS: Record<string, string> = {
  company_admin: "Admin",
  contact_person: "Kontaktperson",
  participant: "Deltagare",
};

function PersonSection({
  title, persons, members, userEmail,
  editingPerson, personForm, setPersonForm,
  onEdit, onCancelEdit, onSaveEdit,
  onDelete, onToggleContact, onSendInvite, onChangeRole, getMemberForPerson, saving, highlight,
}: {
  title: string;
  persons: SupabasePerson[];
  members: Member[];
  userEmail: string;
  editingPerson: SupabasePerson | null;
  personForm: PersonForm;
  setPersonForm: (f: PersonForm) => void;
  onEdit: (p: SupabasePerson) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: (p: SupabasePerson) => void;
  onToggleContact: (p: SupabasePerson) => void;
  onSendInvite: (p: SupabasePerson) => void;
  onChangeRole: (member: Member, role: string) => void;
  getMemberForPerson: (p: SupabasePerson) => Member | undefined;
  saving: boolean;
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
          const isCurrentUser = person.email?.toLowerCase() === userEmail.toLowerCase();
          const hasAccount = !!member;
          const isEditing = editingPerson?.edu_person_id === person.edu_person_id;

          return (
            <div key={person.edu_person_id} style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
              {isEditing ? (
                <div className="px-5 py-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <input className="form-input text-sm" value={personForm.firstName} onChange={e => setPersonForm({ ...personForm, firstName: e.target.value })} placeholder="Förnamn *" autoFocus />
                    <input className="form-input text-sm" value={personForm.lastName} onChange={e => setPersonForm({ ...personForm, lastName: e.target.value })} placeholder="Efternamn *" />
                    <input className="form-input text-sm" value={personForm.civicRegistrationNumber} onChange={e => setPersonForm({ ...personForm, civicRegistrationNumber: e.target.value })} placeholder="Personnummer" />
                    <input type="email" className="form-input text-sm" value={personForm.email} onChange={e => setPersonForm({ ...personForm, email: e.target.value })} placeholder="E-post" />
                    <input type="tel" className="form-input text-sm" value={personForm.phone} onChange={e => setPersonForm({ ...personForm, phone: e.target.value })} placeholder="Telefon" />
                    <input type="tel" className="form-input text-sm" value={personForm.mobile} onChange={e => setPersonForm({ ...personForm, mobile: e.target.value })} placeholder="Mobil" />
                    <input className="form-input text-sm" value={personForm.jobTitle} onChange={e => setPersonForm({ ...personForm, jobTitle: e.target.value })} placeholder="Befattning" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {([
                        { label: "Deltagare", value: false },
                        { label: "Kontaktperson", value: true },
                      ] as const).map(opt => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => setPersonForm({ ...personForm, isContactPerson: opt.value })}
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
                          style={{
                            borderColor: personForm.isContactPerson === opt.value ? "var(--frost)" : "var(--border)",
                            backgroundColor: personForm.isContactPerson === opt.value ? "var(--frost-light)" : "#fff",
                            color: personForm.isContactPerson === opt.value ? "var(--frost-dark)" : "var(--slate-light)",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="ml-auto flex gap-2">
                      <button onClick={onCancelEdit} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}>
                        <XIcon /> Avbryt
                      </button>
                      <button onClick={onSaveEdit} disabled={saving} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--frost)" }}>
                        <CheckIcon /> {saving ? "Sparar..." : "Spara"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-5 py-3.5 event-row">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: highlight ? "var(--frost-light)" : "#f0f0f0", color: highlight ? "var(--frost-dark)" : "var(--slate-light)" }}>
                    <UserIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: "var(--slate-deep)" }}>
                        {person.first_name} {person.last_name}
                      </span>
                      {isCurrentUser && <span className="badge text-[10px]" style={{ backgroundColor: "var(--frost-light)", color: "var(--frost-dark)" }}>Du</span>}
                      {person.is_contact_person && <span className="badge badge-available text-[10px]">Kontaktperson</span>}
                      {hasAccount && <span className="badge text-[10px]" style={{ backgroundColor: "#ecfdf5", color: "var(--success)" }}>Har konto</span>}
                      {member && !isCurrentUser && (
                        <select
                          value={member.role}
                          onChange={e => onChangeRole(member, e.target.value)}
                          className="rounded border px-1.5 py-0.5 text-[11px] font-medium"
                          style={{ borderColor: "var(--border)", color: "var(--slate-light)", backgroundColor: "#fff" }}
                          title="Ändra roll i portalen"
                        >
                          {Object.entries(ROLE_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      )}
                      {member && isCurrentUser && <RoleBadge role={member.role} />}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs" style={{ color: "var(--slate-light)" }}>
                      {person.email && <span>{person.email}</span>}
                      {(person.phone || person.mobile) && <span>{person.phone || person.mobile}</span>}
                      {person.job_title && <span>{person.job_title}</span>}
                      <span title="EduAdmin PersonId">ID: {person.edu_person_id}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => onEdit(person)} className="rounded px-2 py-1 text-[11px] font-medium transition-colors" style={{ color: "var(--frost)" }}>
                      Ändra
                    </button>
                    <button
                      onClick={() => onToggleContact(person)}
                      className="rounded px-2 py-1 text-[11px] font-medium transition-colors"
                      style={{ color: person.is_contact_person ? "var(--warning)" : "var(--slate-light)" }}
                      title={person.is_contact_person ? "Ta bort som kontaktperson" : "Gör till kontaktperson"}
                    >
                      {person.is_contact_person ? "Ta bort kontakt" : "Gör kontakt"}
                    </button>
                    {!hasAccount && person.email && !isCurrentUser && (
                      <button onClick={() => onSendInvite(person)} className="rounded px-2 py-1 text-[11px] font-medium transition-colors" style={{ color: "var(--frost)" }}>
                        Bjud in
                      </button>
                    )}
                    {!isCurrentUser && (
                      <button onClick={() => onDelete(person)} className="rounded p-1 transition-colors" style={{ color: "var(--danger)" }} title="Ta bort">
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
