"use client";

import { useState, useRef } from "react";
import { SearchIcon, LoaderIcon, BuildingIcon } from "@/components/icons";

interface CustomerResult {
  CustomerId: number;
  CustomerName: string;
  OrganisationNumber: string;
}

interface CompanySearchProps {
  onSelect: (customer: CustomerResult) => void;
}

export function CompanySearch({ onSelect }: CompanySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setQuery(value);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (value.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/edu/customers?q=${encodeURIComponent(value)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 400);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--slate-light)" }}
        >
          <SearchIcon />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Sök på företagsnamn..."
          className="form-input pl-10"
          autoFocus
        />
        {loading && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--frost)" }}
          >
            <LoaderIcon className="animate-spin" />
          </span>
        )}
      </div>

      {results.length > 0 && (
        <div
          className="rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          {results.map((customer, i) => (
            <button
              key={customer.CustomerId}
              onClick={() => onSelect(customer)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--frost-light)]"
              style={{
                borderTop: i > 0 ? "1px solid var(--border)" : undefined,
              }}
            >
              <span style={{ color: "var(--frost)" }}>
                <BuildingIcon />
              </span>
              <div className="flex-1">
                <span
                  className="block text-sm font-medium"
                  style={{ color: "var(--slate-deep)" }}
                >
                  {customer.CustomerName}
                </span>
                {customer.OrganisationNumber && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--slate-light)" }}
                  >
                    Org.nr: {customer.OrganisationNumber}
                  </span>
                )}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: "var(--frost)" }}
              >
                Välj
              </span>
            </button>
          ))}
        </div>
      )}

      {searched && !loading && results.length === 0 && query.length >= 2 && (
        <p className="text-center text-sm" style={{ color: "var(--slate-light)" }}>
          Inga företag hittades för &quot;{query}&quot;
        </p>
      )}
    </div>
  );
}
