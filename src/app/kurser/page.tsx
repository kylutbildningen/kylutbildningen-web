import { Suspense } from "react";
import { Metadata } from "next";
import { getUpcomingEvents } from "@/lib/eduadmin";
import type { EventCard } from "@/types/eduadmin";
import { CourseFilter } from "@/components/kurser/CourseFilter";
import { CourseGrid, CourseGridSkeleton } from "@/components/kurser/CourseGrid";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Kommande kurser — Kylutbildningen",
  description:
    "Se alla tillgängliga kylutbildningar. Certifieringar, F-gas, köldmediehantering och mer. Boka online.",
};

/* ─── Data fetching ─── */
async function getEvents(): Promise<EventCard[]> {
  try {
    return await getUpcomingEvents();
  } catch (error) {
    console.error("Failed to fetch events from EduAdmin:", error);
    return [];
  }
}

/* ─── Filtering ─── */
function filterEvents(
  events: EventCard[],
  params: {
    category?: string;
    city?: string;
    q?: string;
    from?: string;
    to?: string;
  },
): EventCard[] {
  let filtered = events;

  if (params.category) {
    filtered = filtered.filter(
      (e) => e.categoryName.toLowerCase() === params.category!.toLowerCase(),
    );
  }

  if (params.city) {
    filtered = filtered.filter(
      (e) => e.city.toLowerCase() === params.city!.toLowerCase(),
    );
  }

  if (params.q) {
    const query = params.q.toLowerCase();
    filtered = filtered.filter((e) =>
      e.courseName.toLowerCase().includes(query),
    );
  }

  if (params.from) {
    const from = new Date(params.from);
    filtered = filtered.filter((e) => new Date(e.startDate) >= from);
  }

  if (params.to) {
    const to = new Date(params.to);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter((e) => new Date(e.startDate) <= to);
  }

  return filtered;
}

/* ─── Page ─── */
export default async function KurskatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const allEvents = await getEvents();

  const category = typeof params.category === "string" ? params.category : "";
  const city = typeof params.city === "string" ? params.city : "";
  const q = typeof params.q === "string" ? params.q : "";
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";

  const filtered = filterEvents(allEvents, { category, city, q, from, to });

  // Extract unique values for filter options
  const categories = Array.from(
    new Set(allEvents.map((e) => e.categoryName).filter(Boolean)),
  ).sort();
  const cities = Array.from(
    new Set(allEvents.map((e) => e.city).filter(Boolean)),
  ).sort();

  const hasActiveFilters = !!(category || city || q || from || to);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <SiteHeader />

      {/* Hero */}
      <header
        className="border-b"
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(160deg, var(--slate-deep) 0%, #1e3a4c 50%, var(--slate-mid) 100%)",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2">
              <div
                className="h-px w-8"
                style={{ backgroundColor: "var(--frost)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--frost)" }}
              >
                Kursutbud
              </span>
            </div>
            <h1
              className="text-3xl leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Kommande kurser
            </h1>
            <p
              className="mt-4 max-w-lg text-base leading-relaxed"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              Utforska vårt kompletta utbud av certifierade kylutbildningar.
              Filtrera efter kategori, ort eller datum.
            </p>
          </div>
        </div>
      </header>

      {/* Filters + Grid */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Suspense>
          <CourseFilter categories={categories} cities={cities} />
        </Suspense>

        <div className="mt-8">
          <p
            className="mb-6 text-sm"
            style={{ color: "var(--slate-light)" }}
          >
            {hasActiveFilters
              ? `Visar ${filtered.length} av ${allEvents.length} kurstillfällen`
              : `Visar ${allEvents.length} kurstillfälle${allEvents.length !== 1 ? "n" : ""}`}
          </p>

          <Suspense fallback={<CourseGridSkeleton />}>
            <CourseGrid events={filtered} />
          </Suspense>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
