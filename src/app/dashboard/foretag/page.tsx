"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import {
  PlusIcon,
  CheckIcon,
  XIcon,
  SearchIcon,
  LoaderIcon,
  UserIcon,
  BuildingIcon,
  MapPinIcon,
  FileTextIcon,
} from "@/components/icons";
import type { SupabasePerson as Person } from "@/lib/supabase-persons";

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

interface PortalRole {
  personId: number;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  company_admin: "Admin",
  contact_person: "Kontaktperson",
  participant: "Deltagare",
};

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
  const [portalRoles, setPortalRoles] = useState<PortalRole[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.dispatchEvent(new Event("open-auth-modal"));
        router.replace("/");
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

      if (!mem) { router.replace("/dashboard"); return; }

      const cid = stored ? parseInt(stored) : mem.edu_customer_id;
      setMembership({ ...mem, edu_customer_id: cid });

      const { data: memberships } = await supabase
        .from("company_memberships")
        .select("edu_contact_id, role")
        .eq("edu_customer_id", cid);

      if (memberships) {
        setPortalRoles(
          memberships
            .filter((m) => m.edu_contact_id)
            .map((m) => ({ personId: m.edu_contact_id, role: m.role })),
        );
      }

      await Promise.all([fetchCustomer(cid), fetchPersons(cid)]);
    }
    load();
  }, [router]);

  async function fetchCustomer(customerId: number) {
    try {
      const res = await fetch(`/api/edu/customers/${customerId}`);
      if (res.ok) setCustomerData(await res.json());
    } catch { /* ignore */ }
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
    setEditingId(person.edu_person_id);
    setForm({
      firstName: person.first_name?.trim() || "",
      lastName: person.last_name?.trim() || "",
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
          body: JSON.stringify({ customerId: membership.edu_customer_id, ...form }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else if (editingId !== null) {
        const res = await fetch(`/api/edu/persons/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, customerId: membership.edu_customer_id }),
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

  const filtered = persons.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.first_name?.toLowerCase().includes(q) ||
      p.last_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.civic_registration_number?.includes(q)
    );
  });

  const contactPersons = filtered.filter((p) => p.is_contact_person);
  const participants = filtered.filter((p) => !p.is_contact_person);

  if (!membership) {
    return (
      <div className="min-h-screen flex-grow flex flex-col" style={{ backgroundColor: "var(--warm-white)" }}>
        <SiteHeader />
        <div className="flex items-center justify-center py-32 flex-grow">
          <LoaderIcon className="animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex-grow flex flex-col" style={{ backgroundColor: "var(--warm-white)" }}>
      <SiteHeader />

      {/* Page header */}
      <div style={{ background: "var(--navy)" }}>
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-8">
          <a href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.45)" }}>
            ← Dashboard
          </a>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-condensed font-bold uppercase text-white leading-none"
                style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>
                {membership.company_name}
              </h1>
              {customerData && (
                <div className="mt-2 flex flex-wrap gap-4 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {customerData.CustomerNumber && (
                    <span>Kundnr: <strong className="text-white/80">{customerData.CustomerNumber}</strong></span>
                  )}
                  <span>Org.nr: {customerData.OrganisationNumber}</span>
                  <span>{persons.length} person{persons.length !== 1 ? "er" : ""}</span>
                </div>
              )}
            </div>
            <button
              onClick={startAdd}
              className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 shrink-0"
              style={{ background: "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)" }}
            >
              <PlusIcon />
              Lägg till person
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 flex-grow w-full">
        {error && (
          <div className="mb-6 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--danger)", backgroundColor: "#fef2f2", color: "var(--danger)" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--success)", backgroundColor: "#ecfdf5", color: "var(--success)" }}>
            {success}
          </div>
        )}

        {/* ─── Company info ─── */}
        {customerData && (
          <>
            <SectionTitle>Företagsuppgifter</SectionTitle>
            <div className="rounded-xl border bg-white overflow-hidden mb-10" style={{ borderColor: "var(--border)" }}>
              {/* Company info section */}
              {editingCompany === "info" ? (
                <div className="p-6" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span style={{ color: "var(--frost)" }}><BuildingIcon /></span>
                    <h3 className="text-sm font-bold" style={{ color: "var(--slate-deep)" }}>Företagsinformation</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <FormField label="Företagsnamn" value={companyForm.customerName} onChange={v => setCompanyForm({ ...companyForm, customerName: v })} />
                    <FormField label="E-post" value={companyForm.email} onChange={v => setCompanyForm({ ...companyForm, email: v })} type="email" />
                    <FormField label="Telefon" value={companyForm.phone} onChange={v => setCompanyForm({ ...companyForm, phone: v })} type="tel" />
                    <FormField label="Mobil" value={companyForm.mobile} onChange={v => setCompanyForm({ ...companyForm, mobile: v })} type="tel" />
                    <FormField label="Webbplats" value={companyForm.web} onChange={v => setCompanyForm({ ...companyForm, web: v })} />
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <button onClick={() => setEditingCompany(null)} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}>
                      <XIcon /> Avbryt
                    </button>
                    <button onClick={saveCompany} disabled={savingCompany} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--frost)" }}>
                      <CheckIcon /> {savingCompany ? "Sparar..." : "Spara"}
                    </button>
                  </div>
                </div>
              ) : (
                <InfoSection
                  icon={<BuildingIcon />}
                  title="Företagsinformation"
                  onEdit={() => startEditCompany("info")}
                  items={[
                    { label: "Namn", value: customerData.CustomerName },
                    { label: "E-post", value: customerData.Email },
                    { label: "Telefon", value: customerData.Phone },
                    { label: "Mobil", value: customerData.Mobile },
                    { label: "Webb", value: customerData.Web },
                  ]}
                />
              )}

              {/* Address section */}
              {editingCompany === "address" ? (
                <div className="p-6" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span style={{ color: "var(--frost)" }}><MapPinIcon /></span>
                    <h3 className="text-sm font-bold" style={{ color: "var(--slate-deep)" }}>Adress</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <FormField label="Gatuadress" value={companyForm.address} onChange={v => setCompanyForm({ ...companyForm, address: v })} />
                    <FormField label="Adress 2" value={companyForm.address2} onChange={v => setCompanyForm({ ...companyForm, address2: v })} />
                    <FormField label="Postnummer" value={companyForm.zip} onChange={v => setCompanyForm({ ...companyForm, zip: v })} />
                    <FormField label="Ort" value={companyForm.city} onChange={v => setCompanyForm({ ...companyForm, city: v })} />
                    <FormField label="Land" value={companyForm.country} onChange={v => setCompanyForm({ ...companyForm, country: v })} />
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <button onClick={() => setEditingCompany(null)} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}>
                      <XIcon /> Avbryt
                    </button>
                    <button onClick={saveCompany} disabled={savingCompany} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--frost)" }}>
                      <CheckIcon /> {savingCompany ? "Sparar..." : "Spara"}
                    </button>
                  </div>
                </div>
              ) : (
                <InfoSection
                  icon={<MapPinIcon />}
                  title="Adress"
                  onEdit={() => startEditCompany("address")}
                  items={[
                    { label: "Gatuadress", value: [customerData.Address, customerData.Address2].filter(Boolean).join(", ") },
                    { label: "Postnummer", value: customerData.Zip },
                    { label: "Ort", value: customerData.City },
                    { label: "Land", value: customerData.Country },
                  ]}
                />
              )}

              {/* Billing section */}
              {customerData.BillingInfo && (
                <InfoSection
                  icon={<FileTextIcon />}
                  title="Fakturauppgifter"
                  items={[
                    { label: "Mottagare", value: customerData.BillingInfo.CustomerName },
                    { label: "Org.nr", value: customerData.BillingInfo.OrganisationNumber },
                    { label: "Adress", value: [customerData.BillingInfo.Address, customerData.BillingInfo.Zip, customerData.BillingInfo.City].filter(Boolean).join(", ") },
                    { label: "E-post", value: customerData.BillingInfo.Email },
                    { label: "Referens", value: customerData.BillingInfo.BuyerReference },
                  ]}
                  last
                />
              )}
            </div>
          </>
        )}

        {/* ─── Persons ─── */}
        <SectionTitle>
          <span>Personer</span>
          <span className="ml-2 text-sm font-normal" style={{ color: "var(--slate-light)" }}>
            ({persons.length})
          </span>
        </SectionTitle>

        {/* Search */}
        <div className="relative mb-5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--slate-light)" }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök namn, e-post eller personnummer..."
            className="form-input pl-11 text-sm"
            style={{ maxWidth: 420 }}
          />
        </div>

        {/* Add person form */}
        {showAdd && (
          <div className="mb-6 rounded-xl border bg-white p-6" style={{ borderColor: "var(--frost)" }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: "var(--slate-deep)" }}>Lägg till ny person</h3>
            <PersonFormFields form={form} setForm={setForm} />
            <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={cancelEdit} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}>
                <XIcon /> Avbryt
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--frost)" }}>
                <CheckIcon /> {saving ? "Sparar..." : "Spara"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoaderIcon className="animate-spin" />
          </div>
        ) : (
          <>
            {/* Contact persons */}
            {contactPersons.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                  style={{ color: "var(--frost-dark)" }}>
                  <UserIcon /> Kontaktpersoner ({contactPersons.length})
                </h3>
                <PersonTable
                  persons={contactPersons}
                  editingId={editingId}
                  form={form}
                  setForm={setForm}
                  onEdit={startEdit}
                  onSave={handleSave}
                  onCancel={cancelEdit}
                  saving={saving}
                  portalRoles={portalRoles}
                  highlight
                />
              </div>
            )}

            {/* Participants */}
            {participants.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                  style={{ color: "var(--slate-light)" }}>
                  <UserIcon /> Deltagare ({participants.length})
                </h3>
                <PersonTable
                  persons={participants}
                  editingId={editingId}
                  form={form}
                  setForm={setForm}
                  onEdit={startEdit}
                  onSave={handleSave}
                  onCancel={cancelEdit}
                  saving={saving}
                  portalRoles={portalRoles}
                />
              </div>
            )}

            {filtered.length === 0 && !showAdd && (
              <div className="py-16 text-center rounded-xl border" style={{ color: "var(--slate-light)", borderColor: "var(--border)", background: "#fff" }}>
                {search ? "Inga personer matchar din sökning" : "Inga personer registrerade ännu"}
              </div>
            )}
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

/* ─── Section title ─── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="font-condensed font-bold uppercase text-lg" style={{ color: "var(--navy)" }}>
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
    </div>
  );
}

/* ─── Info section (row-based within parent card) ─── */
function InfoSection({
  icon, title, items, onEdit, last,
}: {
  icon: React.ReactNode;
  title: string;
  items: Array<{ label: string; value: string }>;
  onEdit?: () => void;
  last?: boolean;
}) {
  return (
    <div className="px-6 py-5" style={!last ? { borderBottom: "1px solid var(--border)" } : undefined}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--frost)" }}>{icon}</span>
          <h3 className="text-sm font-bold" style={{ color: "var(--slate-deep)" }}>{title}</h3>
        </div>
        {onEdit && (
          <button onClick={onEdit} className="text-xs font-semibold px-2.5 py-1 rounded-md transition-colors hover:bg-gray-50" style={{ color: "var(--frost)" }}>
            Ändra
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-2">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <span className="block text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--slate-light)" }}>
              {item.label}
            </span>
            <span className="block text-sm truncate" style={{ color: item.value ? "var(--slate-deep)" : "var(--slate-light)" }}>
              {item.value || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Form field ─── */
function FormField({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--slate-light)" }}>
        {label}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="form-input text-sm" />
    </div>
  );
}

/* ─── Person table (row-based) ─── */
function PersonTable({
  persons, editingId, form, setForm, onEdit, onSave, onCancel, saving, portalRoles, highlight,
}: {
  persons: Person[];
  editingId: number | null;
  form: typeof emptyPerson;
  setForm: (f: typeof emptyPerson) => void;
  onEdit: (p: Person) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  portalRoles: PortalRole[];
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
      {/* Table header */}
      <div className="hidden sm:grid grid-cols-[2fr_2fr_1.5fr_1.5fr_auto] gap-2 px-5 py-2.5 text-[10px] font-medium uppercase tracking-wider"
        style={{ color: "var(--slate-light)", borderBottom: "1px solid var(--border)", background: "#fafbfc" }}>
        <span>Namn</span>
        <span>E-post</span>
        <span>Telefon</span>
        <span>Personnummer</span>
        <span className="w-14" />
      </div>

      {persons.map((person, i) => {
        if (editingId === person.edu_person_id) {
          return (
            <div key={person.edu_person_id} className="p-5" style={{ borderBottom: i < persons.length - 1 ? "1px solid var(--border)" : undefined, backgroundColor: "var(--frost-light)" }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: "var(--slate-deep)" }}>
                Redigera — {person.first_name} {person.last_name}
              </h3>
              <PersonFormFields form={form} setForm={setForm} />
              <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <button onClick={onCancel} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}>
                  <XIcon /> Avbryt
                </button>
                <button onClick={onSave} disabled={saving} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--frost)" }}>
                  <CheckIcon /> {saving ? "Sparar..." : "Spara"}
                </button>
              </div>
            </div>
          );
        }

        const portalRole = portalRoles.find(r => r.personId === person.edu_person_id);
        const initials = `${person.first_name?.charAt(0) || ""}${person.last_name?.charAt(0) || ""}`.toUpperCase();

        return (
          <div
            key={person.edu_person_id}
            className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1.5fr_1.5fr_auto] gap-1 sm:gap-2 items-center px-5 py-3 transition-colors hover:bg-gray-50/50"
            style={i < persons.length - 1 ? { borderBottom: "1px solid var(--border)" } : undefined}
          >
            {/* Name + role */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: highlight ? "var(--frost-light)" : "#f0f3f7",
                  color: highlight ? "var(--frost-dark)" : "var(--slate-light)",
                }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold truncate" style={{ color: "var(--slate-deep)" }}>
                    {person.first_name?.trim()} {person.last_name?.trim()}
                  </span>
                  {portalRole && (
                    <span
                      className="badge text-[9px] px-1.5 py-0.5"
                      style={{
                        backgroundColor: portalRole.role === "company_admin" ? "var(--frost)" : "var(--frost-light)",
                        color: portalRole.role === "company_admin" ? "#fff" : "var(--frost-dark)",
                      }}
                    >
                      {ROLE_LABELS[portalRole.role] ?? portalRole.role}
                    </span>
                  )}
                </div>
                {person.job_title && (
                  <span className="text-[11px] block truncate" style={{ color: "var(--slate-light)" }}>{person.job_title}</span>
                )}
              </div>
            </div>

            {/* Email */}
            <span className="text-sm truncate sm:block" style={{ color: person.email ? "var(--slate-deep)" : "var(--slate-light)" }}>
              <span className="sm:hidden text-[10px] font-medium uppercase tracking-wider mr-2" style={{ color: "var(--slate-light)" }}>E-post</span>
              {person.email || "—"}
            </span>

            {/* Phone */}
            <span className="text-sm truncate sm:block" style={{ color: (person.phone || person.mobile) ? "var(--slate-deep)" : "var(--slate-light)" }}>
              <span className="sm:hidden text-[10px] font-medium uppercase tracking-wider mr-2" style={{ color: "var(--slate-light)" }}>Tel</span>
              {person.phone || person.mobile || "—"}
            </span>

            {/* Civic reg number */}
            <span className="text-sm truncate sm:block" style={{ color: person.civic_registration_number ? "var(--slate-deep)" : "var(--slate-light)" }}>
              <span className="sm:hidden text-[10px] font-medium uppercase tracking-wider mr-2" style={{ color: "var(--slate-light)" }}>Persnr</span>
              {person.civic_registration_number || "—"}
            </span>

            {/* Edit button */}
            <button
              onClick={() => onEdit(person)}
              className="text-xs font-semibold px-2.5 py-1 rounded-md transition-colors hover:bg-gray-100 w-14 text-center shrink-0 justify-self-end sm:justify-self-auto"
              style={{ color: "var(--frost)" }}
            >
              Ändra
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Person form fields ─── */
function PersonFormFields({ form, setForm }: {
  form: typeof emptyPerson;
  setForm: (f: typeof emptyPerson) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Förnamn *" value={form.firstName} onChange={v => setForm({ ...form, firstName: v })} />
        <FormField label="Efternamn *" value={form.lastName} onChange={v => setForm({ ...form, lastName: v })} />
        <FormField label="Personnummer" value={form.civicRegistrationNumber} onChange={v => setForm({ ...form, civicRegistrationNumber: v })} />
        <FormField label="E-post" value={form.email} onChange={v => setForm({ ...form, email: v })} type="email" />
        <FormField label="Telefon" value={form.phone} onChange={v => setForm({ ...form, phone: v })} type="tel" />
        <FormField label="Mobil" value={form.mobile} onChange={v => setForm({ ...form, mobile: v })} type="tel" />
        <FormField label="Befattning" value={form.jobTitle} onChange={v => setForm({ ...form, jobTitle: v })} />
      </div>
      <div className="flex gap-2 mt-3">
        {([
          { label: "Deltagare", value: false },
          { label: "Kontaktperson", value: true },
        ] as const).map(opt => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => setForm({ ...form, isContactPerson: opt.value })}
            className="rounded-lg border px-4 py-2 text-xs font-medium transition-all"
            style={{
              borderColor: form.isContactPerson === opt.value ? "var(--frost)" : "var(--border)",
              backgroundColor: form.isContactPerson === opt.value ? "var(--frost-light)" : "#fff",
              color: form.isContactPerson === opt.value ? "var(--frost-dark)" : "var(--slate-light)",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </>
  );
}
