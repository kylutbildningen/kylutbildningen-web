"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SearchIcon, FilterIcon, XIcon } from "@/components/icons";

interface CourseFilterProps {
  categories: string[];
  cities: string[];
}

export function CourseFilter({ categories, cities }: CourseFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "";
  const activeCity = searchParams.get("city") ?? "";
  const search = searchParams.get("q") ?? "";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";

  const hasActiveFilters =
    activeCategory || activeCity || search || dateFrom || dateTo;

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/kurser?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const resetFilters = useCallback(() => {
    router.push("/kurser", { scroll: false });
  }, [router]);

  return (
    <div
      className="rounded-xl border bg-white p-5"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Mobile accordion */}
      <details className="sm:hidden" open>
        <summary className="flex cursor-pointer items-center gap-2 font-medium">
          <FilterIcon />
          <span style={{ color: "var(--slate-deep)" }}>Filter</span>
        </summary>
        <div className="mt-4">
          <FilterContent
            categories={categories}
            cities={cities}
            activeCategory={activeCategory}
            activeCity={activeCity}
            search={search}
            dateFrom={dateFrom}
            dateTo={dateTo}
            updateParam={updateParam}
            resetFilters={resetFilters}
            hasActiveFilters={!!hasActiveFilters}
          />
        </div>
      </details>

      {/* Desktop layout */}
      <div className="hidden sm:block">
        <FilterContent
          categories={categories}
          cities={cities}
          activeCategory={activeCategory}
          activeCity={activeCity}
          search={search}
          dateFrom={dateFrom}
          dateTo={dateTo}
          updateParam={updateParam}
          resetFilters={resetFilters}
          hasActiveFilters={!!hasActiveFilters}
        />
      </div>
    </div>
  );
}

function FilterContent({
  categories,
  cities,
  activeCategory,
  activeCity,
  search,
  dateFrom,
  dateTo,
  updateParam,
  resetFilters,
  hasActiveFilters,
}: {
  categories: string[];
  cities: string[];
  activeCategory: string;
  activeCity: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  updateParam: (key: string, value: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--slate-light)" }}
        >
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder="Sök kursnamn..."
          value={search}
          onChange={(e) => updateParam("q", e.target.value)}
          className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition-colors"
          style={{
            borderColor: "var(--border)",
            color: "var(--slate-deep)",
          }}
        />
      </div>

      {/* Category pills */}
      <div>
        <label
          className="mb-2 block text-xs font-medium uppercase tracking-wide"
          style={{ color: "var(--slate-light)" }}
        >
          Kategori
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                updateParam("category", activeCategory === cat ? "" : cat)
              }
              className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                borderColor:
                  activeCategory === cat ? "var(--frost)" : "var(--border)",
                backgroundColor:
                  activeCategory === cat
                    ? "var(--frost-light)"
                    : "transparent",
                color:
                  activeCategory === cat
                    ? "var(--frost-dark)"
                    : "var(--slate-light)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* City + Date row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="city-filter"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
            style={{ color: "var(--slate-light)" }}
          >
            Ort
          </label>
          <select
            id="city-filter"
            value={activeCity}
            onChange={(e) => updateParam("city", e.target.value)}
            className="w-full rounded-lg border py-2.5 px-3 text-sm outline-none"
            style={{
              borderColor: "var(--border)",
              color: activeCity ? "var(--slate-deep)" : "var(--slate-light)",
            }}
          >
            <option value="">Alla orter</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="date-from"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
            style={{ color: "var(--slate-light)" }}
          >
            Från datum
          </label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => updateParam("from", e.target.value)}
            className="w-full rounded-lg border py-2.5 px-3 text-sm outline-none"
            style={{
              borderColor: "var(--border)",
              color: dateFrom ? "var(--slate-deep)" : "var(--slate-light)",
            }}
          />
        </div>
        <div>
          <label
            htmlFor="date-to"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
            style={{ color: "var(--slate-light)" }}
          >
            Till datum
          </label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => updateParam("to", e.target.value)}
            className="w-full rounded-lg border py-2.5 px-3 text-sm outline-none"
            style={{
              borderColor: "var(--border)",
              color: dateTo ? "var(--slate-deep)" : "var(--slate-light)",
            }}
          />
        </div>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 self-start text-xs font-medium transition-colors"
          style={{ color: "var(--frost)" }}
        >
          <XIcon />
          Rensa filter
        </button>
      )}
    </div>
  );
}
