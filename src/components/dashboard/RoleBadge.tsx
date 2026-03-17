const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  company_admin: { label: "Admin", color: "var(--frost-dark)", bg: "var(--frost-light)" },
  contact_person: { label: "Kontaktperson", color: "var(--success)", bg: "#ecfdf5" },
  participant: { label: "Deltagare", color: "var(--slate-light)", bg: "#f0f0f0" },
};

export function RoleBadge({ role }: { role: string }) {
  const config = roleLabels[role] ?? roleLabels.participant;

  return (
    <span
      className="badge"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}
