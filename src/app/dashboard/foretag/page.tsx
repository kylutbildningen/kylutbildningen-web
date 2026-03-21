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
  MapPinIcon,
  CreditCardIcon,
  FileTextIcon,
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
  CivicRegistrationNumber: string;
  Birthdate: string;
  EmployeeNumber: string;
  IsContactPerson: boolean;
  CanLogin: boolean;
  Address: string;
  Zip: string;
  City: string;
}

interface CustomerData {
  CustomerId: number;
  CustomerNumber: string | null;
  CustomerName: string;
  OrganisationNumber: string;
  Address: string;
  Address2: string;
  Zip: string;
  City: string;
  Country: string;
  Email: string;
  Phone: string;
  Mobile: string;
  Web: string;
  Notes: string;
  CustomerGroupName: string;
  Created: string;
  Modified: string;
  BillingInfo: {
    CustomerName: string;
    Address: string;
    Address2: string;
    Zip: string;
    City: string;
    Country: string;
    OrganisationNumber: string;
    VatNumber: string;
    Email: string;
    BuyerReference: string;
    SellerReference: string;
    GLN: string;
    NoVat: boolean;
    DiscountPercent: number;
    PaymentTermName: string;
  };
}

interface MembershipInfo {
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
  civicRegistrationNumber: "",
  isContactPerson: false,
};

export default function CompanyManagementPage() {
  const router = useRouter();
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "persons">("info");

  // Person Add/Edit state
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyPerson);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Company edit state
  const [editingCompany, setEditingCompany] = useState<"info" | "address" | null>(null);
  const [companyForm, setCompanyForm] = useState({
    customerName: "", email: "", phone: "", mobile: "", web: "",
    address: "", address2: "", zip: "", city: "", country: "",
  });
  const [savingCompany, setSavingCompany] = useState(false);

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
      const { data: mem } = await supabase
        .from("company_memberships")
        .select("edu_customer_id, company_name, org_number")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!mem) {
        router.replace("/dashboard");
        return;
      }

      const cid = stored ? parseInt(stored) : mem.edu_customer_id;
      setMembership({ ...mem, edu_customer_id: cid });

      // Fetch customer details and persons in parallel
      await Promise.all([fetchCustomer(cid), fetchPersons(cid)]);
    }
    load();
  }, [router]);

  async function fetchCustomer(customerId: number) {
    try {
      const res = await fetch(`/api/edu/customers/${customerId}`);
      if (res.ok) setCustomerData(await res.json());
    } catch {
      /* ignore */
    }
  }

  const fetchPersons = useCallback(async (customerId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/edu/persons?customerId=${customerId}`);
      if (res.ok) setPersons(await res.json());
    } catch {
      setError("Kunde inte hämta personer");
    } finally {
      setLoading(false);
    }
  }, []);

  function startEditCompany(section: "info" | "address") {
    if (!customerData) return;
    setCompanyForm({
      customerName: customerData.CustomerName || "",
      email: customerData.Email || "",
      phone: customerData.Phone || "",
      mobile: customerData.Mobile || "",
      web: customerData.Web || "",
      address: customerData.Address || "",
      address2: customerData.Address2 || "",
      zip: customerData.Zip || "",
      city: customerData.City || "",
      country: customerData.Country || "",
    });
    setEditingCompany(section);
    setError(null);
  }

  async function saveCompany() {
    if (!membership || !customerData) return;
    setSavingCompany(true);
    setError(null);
    try {
      const res = await fetch(`/api/edu/customers/${membership.edu_customer_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setEditingCompany(null);
      setSuccess("Företagsuppgifter uppdaterade");
      await fetchCustomer(membership.edu_customer_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte spara");
    } finally {
      setSavingCompany(false);
    }
  }

  function startEdit(person: Person) {
    setEditingId(person.PersonId);
    setForm({
      firstName: person.FirstName?.trim() || "",
      lastName: person.LastName?.trim() || "",
      email: person.Email || "",
      phone: person.Phone || "",
      mobile: person.Mobile || "",
      jobTitle: person.JobTitle || "",
      civicRegistrationNumber: person.CivicRegistrationNumber || "",
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
    setActiveTab("persons");
  }

  function cancelEdit() {
    setEditingId(null);
    setShowAdd(false);
    setForm(emptyPerson);
    setError(null);
  }

  async function handleSave() {
    if (!membership) return;
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
            customerId: membership.edu_customer_id,
            ...form,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else if (editingId) {
        const res = await fetch(`/api/edu/persons/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
      cancelEdit();
      await fetchPersons(membership.edu_customer_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(personId: number, name: string) {
    if (!membership) return;
    if (!confirm(`${name} kan bara tas bort direkt i EduAdmin — borttagning via API stöds inte.`)) return;
  }

  const filtered = persons.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.FirstName?.toLowerCase().includes(q) ||
      p.LastName?.toLowerCase().includes(q) ||
      p.Email?.toLowerCase().includes(q) ||
      p.CivicRegistrationNumber?.includes(q)
    );
  });

  const contactPersons = filtered.filter((p) => p.IsContactPerson);
  const participants = filtered.filter((p) => !p.IsContactPerson);

  if (!membership) {
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
    <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Header */}
        <a
          href="/dashboard"
          className="mb-4 inline-block text-sm font-medium"
          style={{ color: "var(--frost)" }}
        >
          ← Dashboard
        </a>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1
              className="flex items-center gap-3 text-2xl"
              style={{ fontFamily: "var(--font-serif)", color: "var(--slate-deep)" }}
            >
              <BuildingIcon />
              {membership.company_name}
            </h1>
            {customerData && (
              <div className="mt-1 flex flex-wrap gap-3 text-sm" style={{ color: "var(--slate-light)" }}>
                {customerData.CustomerNumber && (
                  <span>Kundnr: <strong style={{ color: "var(--slate-deep)" }}>{customerData.CustomerNumber}</strong></span>
                )}
                <span>Org.nr: {customerData.OrganisationNumber}</span>
                <span>{persons.length} person{persons.length !== 1 ? "er" : ""}</span>
              </div>
            )}
          </div>
          <button
            onClick={startAdd}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)" }}
          >
            <PlusIcon />
            Lägg till person
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg border p-1" style={{ borderColor: "var(--border)", backgroundColor: "#fff" }}>
          {[
            { key: "info" as const, label: "Företagsuppgifter" },
            { key: "persons" as const, label: `Personer (${persons.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor: activeTab === tab.key ? "var(--frost-light)" : "transparent",
                color: activeTab === tab.key ? "var(--frost-dark)" : "var(--slate-light)",
              }}
            >
              {tab.label}
            </button>
          ))}
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

        {/* ─── Tab: Företagsuppgifter ─── */}
        {activeTab === "info" && customerData && (
          <div className="space-y-6">
            {/* Company info */}
            {editingCompany === "info" ? (
              <EditCard title="Företagsinformation" icon={<BuildingIcon />} onSave={saveCompany} onCancel={() => setEditingCompany(null)} saving={savingCompany}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1"><span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>Företagsnamn</span><input className="form-input text-sm" value={companyForm.customerName} onChange={e => setCompanyForm({ ...companyForm, customerName: e.target.value })} /></label>
                  <label className="space-y-1"><span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>E-post</span><input type="email" className="form-input text-sm" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} /></label>
                  <label className="space-y-1"><span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>Telefon</span><input type="tel" className="form-input text-sm" value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} /></label>
                  <label className="space-y-1"><span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>Mobil</span><input type="tel" className="form-input text-sm" value={companyForm.mobile} onChange={e => setCompanyForm({ ...companyForm, mobile: e.target.value })} /></label>
                  <label className="space-y-1 sm:col-span-2"><span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>Webbplats</span><input className="form-input text-sm" value={companyForm.web} onChange={e => setCompanyForm({ ...companyForm, web: e.target.value })} /></label>
                </div>
              </EditCard>
            ) : (
              <InfoCard
                title="Företagsinformation"
                icon={<BuildingIcon />}
                onEdit={() => startEditCompany("info")}
                rows={[
                  { label: "Företagsnamn", value: customerData.CustomerName },
                  { label: "Kundnummer", value: customerData.CustomerNumber || "—" },
                  { label: "Organisationsnummer", value: customerData.OrganisationNumber },
                  { label: "E-post", value: customerData.Email || "—" },
                  { label: "Telefon", value: customerData.Phone || "—" },
                  { label: "Mobil", value: customerData.Mobile || "—" },
                  { label: "Webb", value: customerData.Web || "—" },
                ]}
              />
            )}

            {/* Address */}
            {editingCompany === "address" ? (
              <EditCard title="Adress" icon={<MapPinIcon />} onSave={saveCompany} onCancel={() => setEditingCompany(null)} saving={savingCompany}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1 sm:col-span-2"><span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>Gatuadress</span><input className="form-input text-sm" value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} /></label>
                  <label className="space-y-1 sm:col-span-2"><span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>Adress 2</span><input className="form-input text-sm" value={companyForm.address2} onChange={e => setCompanyForm({ ...companyForm, address2: e.target.value })} /></label>
                  <label className="space-y-1"><span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>Postnummer</span><input className="form-input text-sm" value={companyForm.zip} onChange={e => setCompanyForm({ ...companyForm, zip: e.target.value })} /></label>
                  <label className="space-y-1"><span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>Stad</span><input className="form-input text-sm" value={companyForm.city} onChange={e => setCompanyForm({ ...companyForm, city: e.target.value })} /></label>
                  <label className="space-y-1"><span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>Land</span><input className="form-input text-sm" value={companyForm.country} onChange={e => setCompanyForm({ ...companyForm, country: e.target.value })} /></label>
                </div>
              </EditCard>
            ) : (
              <InfoCard
                title="Adress"
                icon={<MapPinIcon />}
                onEdit={() => startEditCompany("address")}
                rows={[
                  { label: "Gatuadress", value: [customerData.Address, customerData.Address2].filter(Boolean).join(", ") || "—" },
                  { label: "Postnummer", value: customerData.Zip || "—" },
                  { label: "Stad", value: customerData.City || "—" },
                  { label: "Land", value: customerData.Country || "—" },
                ]}
              />
            )}

            {/* Billing info */}
            {customerData.BillingInfo && (
              <InfoCard
                title="Fakturauppgifter"
                icon={<FileTextIcon />}
                rows={[
                  { label: "Fakturamottagare", value: customerData.BillingInfo.CustomerName || "—" },
                  { label: "Org.nr (faktura)", value: customerData.BillingInfo.OrganisationNumber || "—" },
                  { label: "Fakturaadress", value: [customerData.BillingInfo.Address, customerData.BillingInfo.Address2].filter(Boolean).join(", ") || "—" },
                  { label: "Postnummer", value: customerData.BillingInfo.Zip || "—" },
                  { label: "Stad", value: customerData.BillingInfo.City || "—" },
                  { label: "Faktura-e-post", value: customerData.BillingInfo.Email || "—" },
                ]}
              />
            )}
          </div>
        )}

        {activeTab === "info" && !customerData && !loading && (
          <div className="py-12 text-center" style={{ color: "var(--slate-light)" }}>
            Kunde inte hämta företagsuppgifter
          </div>
        )}

        {/* ─── Tab: Personer ─── */}
        {activeTab === "persons" && (
          <>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--slate-light)" }}>
                <SearchIcon />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sök namn, e-post eller personnummer..."
                className="form-input pl-10"
              />
            </div>

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
                <PersonSection
                  title="Kontaktpersoner"
                  persons={contactPersons}
                  editingId={editingId}
                  form={form}
                  setForm={setForm}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  onSave={handleSave}
                  onCancel={cancelEdit}
                  saving={saving}
                  highlight
                />
                <PersonSection
                  title="Övriga personer / Deltagare"
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
                  <div className="py-12 text-center" style={{ color: "var(--slate-light)" }}>
                    {search ? "Inga personer matchar din sökning" : "Inga personer registrerade ännu"}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

/* ─── InfoCard ─── */
function InfoCard({
  title,
  icon,
  rows,
  onEdit,
}: {
  title: string;
  icon: React.ReactNode;
  rows: Array<{ label: string; value: string }>;
  onEdit?: () => void;
}) {
  return (
    <div className="rounded-lg border bg-white" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 border-b px-5 py-3" style={{ borderColor: "var(--border)" }}>
        <span style={{ color: "var(--frost)" }}>{icon}</span>
        <h2 className="text-sm font-semibold flex-1" style={{ color: "var(--slate-deep)" }}>
          {title}
        </h2>
        {onEdit && (
          <button onClick={onEdit} className="text-xs font-medium px-2 py-1 rounded transition-colors" style={{ color: "var(--frost)" }}>
            Ändra
          </button>
        )}
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-5 py-2.5">
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
              {row.label}
            </span>
            <span className="text-sm text-right" style={{ color: "var(--slate-deep)" }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── EditCard ─── */
function EditCard({
  title,
  icon,
  onSave,
  onCancel,
  saving,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-white" style={{ borderColor: "var(--frost)" }}>
      <div className="flex items-center gap-2 border-b px-5 py-3" style={{ borderColor: "var(--border)" }}>
        <span style={{ color: "var(--frost)" }}>{icon}</span>
        <h2 className="text-sm font-semibold flex-1" style={{ color: "var(--slate-deep)" }}>{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-4">
        {children}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}>
            <XIcon /> Avbryt
          </button>
          <button onClick={onSave} disabled={saving} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "var(--frost)" }}>
            <CheckIcon /> {saving ? "Sparar..." : "Spara"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── PersonSection ─── */
function PersonSection({
  title,
  persons,
  editingId,
  form,
  setForm,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  saving,
  highlight,
}: {
  title: string;
  persons: Person[];
  editingId: number | null;
  form: typeof emptyPerson;
  setForm: (f: typeof emptyPerson) => void;
  onEdit: (p: Person) => void;
  onDelete: (id: number, name: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  highlight?: boolean;
}) {
  if (persons.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
        <UserIcon />
        {title} ({persons.length})
      </h2>
      <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: "var(--border)" }}>
        {persons.map((person, i) => (
          <div key={person.PersonId}>
            {i > 0 && <div className="h-px" style={{ backgroundColor: "var(--border)" }} />}
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
              <div className="flex items-center gap-4 px-5 py-3.5 event-row">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: highlight ? "var(--frost-light)" : "#f0f0f0",
                    color: highlight ? "var(--frost-dark)" : "var(--slate-light)",
                  }}
                >
                  <UserIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: "var(--slate-deep)" }}>
                      {person.FirstName?.trim()} {person.LastName?.trim()}
                    </span>
                    {person.IsContactPerson && (
                      <span className="badge badge-available text-[10px]">Kontaktperson</span>
                    )}
                    {person.CanLogin && (
                      <span className="badge text-[10px]" style={{ backgroundColor: "var(--frost-light)", color: "var(--frost-dark)" }}>
                        Inloggning
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs" style={{ color: "var(--slate-light)" }}>
                    {person.Email && <span>{person.Email}</span>}
                    {(person.Phone || person.Mobile) && <span>{person.Phone || person.Mobile}</span>}
                    {person.CivicRegistrationNumber && (
                      <span>Personnr: {person.CivicRegistrationNumber}</span>
                    )}
                    {person.JobTitle && <span>{person.JobTitle}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => onEdit(person)}
                    className="rounded px-2 py-1 text-xs font-medium transition-colors"
                    style={{ color: "var(--frost)" }}
                  >
                    Ändra
                  </button>
                  <button
                    onClick={() => onDelete(person.PersonId, `${person.FirstName} ${person.LastName}`)}
                    className="rounded p-1 transition-colors"
                    style={{ color: "var(--danger)" }}
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
  return (
    <div
      className={inline ? "px-5 py-4" : "mb-6 rounded-lg border bg-white p-5"}
      style={!inline ? { borderColor: "var(--border)" } : undefined}
    >
      {title && (
        <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--slate-deep)" }}>
          {title}
        </h3>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Förnamn *" className="form-input text-sm" autoFocus />
        <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Efternamn *" className="form-input text-sm" />
        <input type="text" value={form.civicRegistrationNumber} onChange={(e) => setForm({ ...form, civicRegistrationNumber: e.target.value })} placeholder="Personnummer (YYYYMMDD-XXXX)" className="form-input text-sm" />
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-post" className="form-input text-sm" />
        <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telefon" className="form-input text-sm" />
        <input type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Mobil" className="form-input text-sm" />
        <input type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="Befattning" className="form-input text-sm" />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--slate-light)" }}>
          <input type="checkbox" checked={form.isContactPerson} onChange={(e) => setForm({ ...form, isContactPerson: e.target.checked })} className="accent-[var(--frost)]" />
          Kontaktperson
        </label>
        <div className="ml-auto flex gap-2">
          <button onClick={onCancel} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}>
            <XIcon /> Avbryt
          </button>
          <button onClick={onSave} disabled={saving} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "var(--frost)" }}>
            <CheckIcon /> {saving ? "Sparar..." : "Spara"}
          </button>
        </div>
      </div>
    </div>
  );
}
