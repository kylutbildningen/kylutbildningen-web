"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  SearchIcon,
  LoaderIcon,
  UserIcon,
  BuildingIcon,
} from "@/components/icons";

interface Person {
  PersonId: number;
  CustomerId: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Mobile: string;
  JobTitle: string;
  IsContactPerson: boolean;
  CanLogin: boolean;
}

interface CustomerInfo {
  edu_customer_id: number;
  company_name: string;
  org_number: string | null;
}

const emptyPerson = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  mobile: "",
  jobTitle: "",
  isContactPerson: false,
};

export default function CompanyManagementPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add/Edit state
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyPerson);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const stored = sessionStorage.getItem("selected_company");
      const { data: membership } = await supabase
        .from("company_memberships")
        .select("edu_customer_id, company_name, org_number")
        .eq("user_id", user.id)
        .eq(
          "edu_customer_id",
          stored ? parseInt(stored) : 0,
        )
        .single();

      if (!membership) {
        // Try first membership
        const { data: first } = await supabase
          .from("company_memberships")
          .select("edu_customer_id, company_name, org_number")
          .eq("user_id", user.id)
          .limit(1)
          .single();
        if (!first) {
          router.replace("/dashboard");
          return;
        }
        setCustomer(first);
        await fetchPersons(first.edu_customer_id);
      } else {
        setCustomer(membership);
        await fetchPersons(membership.edu_customer_id);
      }
    }
    load();
  }, [router]);

  const fetchPersons = useCallback(async (customerId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/edu/persons?customerId=${customerId}`);
      if (res.ok) {
        setPersons(await res.json());
      }
    } catch {
      setError("Kunde inte hämta personer");
    } finally {
      setLoading(false);
    }
  }, []);

  function startEdit(person: Person) {
    setEditingId(person.PersonId);
    setForm({
      firstName: person.FirstName?.trim() || "",
      lastName: person.LastName?.trim() || "",
      email: person.Email || "",
      phone: person.Phone || "",
      mobile: person.Mobile || "",
      jobTitle: person.JobTitle || "",
      isContactPerson: person.IsContactPerson,
    });
    setShowAdd(false);
    setError(null);
  }

  function startAdd() {
    setShowAdd(true);
    setEditingId(null);
    setForm(emptyPerson);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setShowAdd(false);
    setForm(emptyPerson);
    setError(null);
  }

  async function handleSave() {
    if (!customer) return;
    if (!form.firstName || !form.lastName) {
      setError("Förnamn och efternamn krävs");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      if (showAdd) {
        const res = await fetch("/api/edu/persons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: customer.edu_customer_id,
            ...form,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
      } else if (editingId) {
        const res = await fetch(`/api/edu/persons/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
      }

      cancelEdit();
      await fetchPersons(customer.edu_customer_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(personId: number, name: string) {
    if (!customer) return;
    if (!confirm(`Vill du ta bort ${name}? Detta kan inte ångras.`)) return;

    try {
      const res = await fetch(`/api/edu/persons/${personId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      await fetchPersons(customer.edu_customer_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte ta bort");
    }
  }

  const filtered = persons.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.FirstName?.toLowerCase().includes(q) ||
      p.LastName?.toLowerCase().includes(q) ||
      p.Email?.toLowerCase().includes(q)
    );
  });

  const contactPersons = filtered.filter((p) => p.IsContactPerson);
  const participants = filtered.filter((p) => !p.IsContactPerson);

  if (!customer) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
        <SiteHeader />
        <div className="flex items-center justify-center py-32">
          <LoaderIcon className="animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/dashboard"
            className="mb-4 inline-block text-sm font-medium"
            style={{ color: "var(--frost)" }}
          >
            ← Dashboard
          </a>
          <div className="flex items-start justify-between">
            <div>
              <h1
                className="flex items-center gap-3 text-2xl"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--slate-deep)",
                }}
              >
                <BuildingIcon />
                {customer.company_name}
              </h1>
              {customer.org_number && (
                <p className="mt-1 text-sm" style={{ color: "var(--slate-light)" }}>
                  Org.nr: {customer.org_number}
                </p>
              )}
              <p className="mt-1 text-sm" style={{ color: "var(--slate-light)" }}>
                {persons.length} person{persons.length !== 1 ? "er" : ""} registrerade
              </p>
            </div>
            <button
              onClick={startAdd}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                background:
                  "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
              }}
            >
              <PlusIcon />
              Lägg till person
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--slate-light)" }}
          >
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök person..."
            className="form-input pl-10"
          />
        </div>

        {error && (
          <div
            className="mb-4 rounded-lg border p-3 text-sm"
            style={{
              borderColor: "var(--danger)",
              backgroundColor: "#fef2f2",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        {/* Add form */}
        {showAdd && (
          <PersonForm
            title="Lägg till ny person"
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={cancelEdit}
            saving={saving}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoaderIcon className="animate-spin" />
          </div>
        ) : (
          <>
            {/* Contact persons */}
            <PersonSection
              title="Kontaktpersoner"
              icon={<UserIcon />}
              persons={contactPersons}
              editingId={editingId}
              form={form}
              setForm={setForm}
              onEdit={startEdit}
              onDelete={handleDelete}
              onSave={handleSave}
              onCancel={cancelEdit}
              saving={saving}
            />

            {/* Participants / other persons */}
            <PersonSection
              title="Övriga personer / Deltagare"
              icon={<UserIcon />}
              persons={participants}
              editingId={editingId}
              form={form}
              setForm={setForm}
              onEdit={startEdit}
              onDelete={handleDelete}
              onSave={handleSave}
              onCancel={cancelEdit}
              saving={saving}
            />

            {filtered.length === 0 && !showAdd && (
              <div className="py-12 text-center">
                <p style={{ color: "var(--slate-light)" }}>
                  {search
                    ? "Inga personer matchar din sökning"
                    : "Inga personer registrerade ännu"}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

/* ─── PersonSection ─── */
function PersonSection({
  title,
  icon,
  persons,
  editingId,
  form,
  setForm,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  saving,
}: {
  title: string;
  icon: React.ReactNode;
  persons: Person[];
  editingId: number | null;
  form: typeof emptyPerson;
  setForm: (f: typeof emptyPerson) => void;
  onEdit: (p: Person) => void;
  onDelete: (id: number, name: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  if (persons.length === 0) return null;

  return (
    <div className="mb-8">
      <h2
        className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"
        style={{ color: "var(--slate-light)" }}
      >
        {icon}
        {title} ({persons.length})
      </h2>
      <div
        className="overflow-hidden rounded-lg border bg-white"
        style={{ borderColor: "var(--border)" }}
      >
        {persons.map((person, i) => (
          <div key={person.PersonId}>
            {i > 0 && (
              <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
            )}
            {editingId === person.PersonId ? (
              <PersonForm
                form={form}
                setForm={setForm}
                onSave={onSave}
                onCancel={onCancel}
                saving={saving}
                inline
              />
            ) : (
              <div className="flex items-center gap-4 px-5 py-4 event-row">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: person.IsContactPerson
                      ? "var(--frost-light)"
                      : "#f0f0f0",
                    color: person.IsContactPerson
                      ? "var(--frost-dark)"
                      : "var(--slate-light)",
                  }}
                >
                  <UserIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--slate-deep)" }}
                    >
                      {person.FirstName?.trim()} {person.LastName?.trim()}
                    </span>
                    {person.IsContactPerson && (
                      <span className="badge badge-available text-[10px]">
                        Kontaktperson
                      </span>
                    )}
                    {person.CanLogin && (
                      <span className="badge text-[10px]" style={{ backgroundColor: "var(--frost-light)", color: "var(--frost-dark)" }}>
                        Inloggning
                      </span>
                    )}
                  </div>
                  <div
                    className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0 text-xs"
                    style={{ color: "var(--slate-light)" }}
                  >
                    {person.Email && <span>{person.Email}</span>}
                    {(person.Phone || person.Mobile) && (
                      <span>{person.Phone || person.Mobile}</span>
                    )}
                    {person.JobTitle && <span>{person.JobTitle}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => onEdit(person)}
                    className="rounded p-1.5 text-xs font-medium transition-colors"
                    style={{ color: "var(--frost)" }}
                    title="Redigera"
                  >
                    Ändra
                  </button>
                  <button
                    onClick={() =>
                      onDelete(
                        person.PersonId,
                        `${person.FirstName} ${person.LastName}`,
                      )
                    }
                    className="rounded p-1.5 transition-colors"
                    style={{ color: "var(--danger)" }}
                    title="Ta bort"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── PersonForm ─── */
function PersonForm({
  title,
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  inline,
}: {
  title?: string;
  form: typeof emptyPerson;
  setForm: (f: typeof emptyPerson) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  inline?: boolean;
}) {
  const wrapper = inline ? "px-5 py-4" : "mb-6 rounded-lg border bg-white p-5";

  return (
    <div
      className={wrapper}
      style={!inline ? { borderColor: "var(--border)" } : undefined}
    >
      {title && (
        <h3
          className="mb-4 text-sm font-semibold"
          style={{ color: "var(--slate-deep)" }}
        >
          {title}
        </h3>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          type="text"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          placeholder="Förnamn *"
          className="form-input text-sm"
          autoFocus
        />
        <input
          type="text"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          placeholder="Efternamn *"
          className="form-input text-sm"
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="E-post"
          className="form-input text-sm"
        />
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Telefon"
          className="form-input text-sm"
        />
        <input
          type="tel"
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          placeholder="Mobil"
          className="form-input text-sm"
        />
        <input
          type="text"
          value={form.jobTitle}
          onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
          placeholder="Befattning"
          className="form-input text-sm"
        />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--slate-light)" }}>
          <input
            type="checkbox"
            checked={form.isContactPerson}
            onChange={(e) =>
              setForm({ ...form, isContactPerson: e.target.checked })
            }
            className="accent-[var(--frost)]"
          />
          Kontaktperson
        </label>
        <div className="ml-auto flex gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
            style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}
          >
            <XIcon /> Avbryt
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--frost)" }}
          >
            <CheckIcon /> {saving ? "Sparar..." : "Spara"}
          </button>
        </div>
      </div>
    </div>
  );
}
