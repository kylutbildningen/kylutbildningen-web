"use client";

import { useState } from "react";
import { BuildingIcon, ChevronDownIcon } from "@/components/icons";

interface Membership {
  id: string;
  edu_customer_id: number;
  company_name: string;
  org_number: string | null;
  role: string;
}

interface CompanySelectorProps {
  memberships: Membership[];
  selected: number;
  onSelect: (customerId: number) => void;
}

export function CompanySelector({
  memberships,
  selected,
  onSelect,
}: CompanySelectorProps) {
  const [open, setOpen] = useState(false);
  const current = memberships.find((m) => m.edu_customer_id === selected);

  if (memberships.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all"
        style={{ borderColor: "var(--border)", color: "var(--slate-deep)" }}
      >
        <BuildingIcon />
        <span className="font-medium">{current?.company_name}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border bg-white shadow-lg"
          style={{ borderColor: "var(--border)" }}
        >
          {memberships.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onSelect(m.edu_customer_id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--frost-light)]"
              style={{
                fontWeight:
                  m.edu_customer_id === selected ? 600 : 400,
                color:
                  m.edu_customer_id === selected
                    ? "var(--frost-dark)"
                    : "var(--slate-deep)",
              }}
            >
              <BuildingIcon />
              <div>
                <span className="block">{m.company_name}</span>
                {m.org_number && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--slate-light)" }}
                  >
                    {m.org_number}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
