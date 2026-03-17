import { getCourseTemplates, type CourseTemplate } from "@/lib/eduadmin";
import { formatDate, formatDateRange, formatPrice } from "@/lib/format";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kurskatalog — Kylutbildningen",
  description:
    "Se alla tillgängliga kylutbildningar. Certifieringar, F-gas, köldmediehantering och mer.",
};

/* ─── Data fetching ─── */
async function getCourses(): Promise<CourseTemplate[]> {
  try {
    return await getCourseTemplates();
  } catch (error) {
    console.error("Failed to fetch from EduAdmin API:", error);
    return [];
  }
}

/* ─── Helper: get lowest public price ─── */
function getLowestPrice(
  course: CourseTemplate,
): { price: number; vat: number } | null {
  const prices = course.PriceNames?.filter((p) => p.PublicPriceName) ?? [];
  if (prices.length === 0) return null;
  const cheapest = prices.reduce((a, b) => (a.Price < b.Price ? a : b));
  return { price: cheapest.Price, vat: cheapest.PriceNameVat };
}

/* ─── Helper: next upcoming event ─── */
function getNextEvent(course: CourseTemplate) {
  const events = course.Events ?? [];
  return events.length > 0 ? events[0] : null;
}

/* ─── Helper: total spots left across upcoming events ─── */
function getSpotsLeft(course: CourseTemplate): number {
  return (course.Events ?? []).reduce(
    (sum, e) => sum + (e.MaxParticipantNumber - e.NumberOfBookedParticipants),
    0,
  );
}

/* ─── Strip HTML tags from descriptions ─── */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/* ─── Icons ─── */
function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function SnowflakeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
      <line x1="12" y1="2" x2="9" y2="5" />
      <line x1="12" y1="2" x2="15" y2="5" />
      <line x1="12" y1="22" x2="9" y2="19" />
      <line x1="12" y1="22" x2="15" y2="19" />
      <line x1="2" y1="12" x2="5" y2="9" />
      <line x1="2" y1="12" x2="5" y2="15" />
      <line x1="22" y1="12" x2="19" y2="9" />
      <line x1="22" y1="12" x2="19" y2="15" />
    </svg>
  );
}

/* ─── Course Card ─── */
function CourseCard({ course }: { course: CourseTemplate }) {
  const priceInfo = getLowestPrice(course);
  const nextEvent = getNextEvent(course);
  const spotsLeft = getSpotsLeft(course);
  const description = stripHtml(
    course.CourseDescriptionShort || course.CourseDescription || "",
  );
  const upcomingCount = course.Events?.length ?? 0;

  return (
    <div
      className="group flex flex-col rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-0.5"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-7 pt-6">
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: "var(--frost-light)",
            color: "var(--frost-dark)",
          }}
        >
          {course.CategoryName || "Utbildning"}
        </span>
        {upcomingCount > 0 && (
          <span
            className="text-xs font-medium"
            style={{ color: "var(--success)" }}
          >
            {upcomingCount} tillfälle{upcomingCount !== 1 && "n"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-7 pt-4 pb-6">
        <h3
          className="text-xl leading-tight"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--slate-deep)",
          }}
        >
          {course.CourseName}
        </h3>

        {description && (
          <p
            className="mt-2.5 line-clamp-3 flex-1 text-sm leading-relaxed"
            style={{ color: "var(--slate-light)" }}
          >
            {description}
          </p>
        )}

        {/* Meta */}
        <div
          className="mt-5 flex flex-wrap items-center gap-4 border-t pt-5 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}
        >
          {course.Days > 0 && (
            <span className="flex items-center gap-1.5">
              <ClockIcon />
              {course.Days} dag{course.Days !== 1 && "ar"}
            </span>
          )}
          {nextEvent && (
            <span className="flex items-center gap-1.5">
              <CalendarIcon />
              {formatDateRange(nextEvent.StartDate, nextEvent.EndDate)}
            </span>
          )}
          {nextEvent?.City && (
            <span className="flex items-center gap-1.5">
              <MapPinIcon />
              {nextEvent.City}
            </span>
          )}
          {spotsLeft > 0 && (
            <span className="flex items-center gap-1.5">
              <UsersIcon />
              {spotsLeft} platser
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-5 flex items-center justify-between">
          <div>
            {priceInfo ? (
              <>
                <span
                  className="text-2xl font-semibold tabular-nums"
                  style={{ color: "var(--slate-deep)" }}
                >
                  {formatPrice(priceInfo.price)}
                </span>
                <span
                  className="ml-1 text-xs"
                  style={{ color: "var(--slate-light)" }}
                >
                  exkl. moms
                </span>
              </>
            ) : (
              <span
                className="text-sm font-medium"
                style={{ color: "var(--slate-light)" }}
              >
                Pris på förfrågan
              </span>
            )}
          </div>
          <Link
            href={`/?boka=${course.CourseTemplateId}`}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{
              background:
                "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
            }}
          >
            Boka
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty State ─── */
function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--frost-light)" }}
      >
        <CalendarIcon />
      </div>
      <h3
        className="mb-2 text-xl"
        style={{
          fontFamily: "var(--font-serif)",
          color: "var(--slate-deep)",
        }}
      >
        Inga utbildningar just nu
      </h3>
      <p className="text-sm" style={{ color: "var(--slate-light)" }}>
        Vi uppdaterar kurskatalogen löpande. Kontakta oss för att få information
        om kommande utbildningar.
      </p>
    </div>
  );
}

/* ─── Page ─── */
export default async function KurskatalogPage() {
  const courses = await getCourses();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      {/* Navigation */}
      <nav
        className="sticky top-0 z-40 border-b"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "rgba(248, 248, 246, 0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <SnowflakeIcon className="opacity-70" />
            <span
              className="text-lg font-semibold tracking-tight"
              style={{ color: "var(--slate-deep)" }}
            >
              Kylutbildningen
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="/kurser"
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--frost)" }}
            >
              Kurskatalog
            </Link>
            <Link
              href="/"
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--frost)" }}
            >
              Boka nu
            </Link>
          </div>
        </div>
      </nav>

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
                Kurskatalog
              </span>
            </div>
            <h1
              className="text-3xl leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Alla utbildningar
            </h1>
            <p
              className="mt-4 max-w-lg text-base leading-relaxed"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              Utforska vårt kompletta utbud av certifierade kylutbildningar.
              Filtrera efter kategori eller bläddra bland kommande tillfällen.
            </p>
          </div>
        </div>
      </header>

      {/* Course grid */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        {courses.length > 0 ? (
          <>
            <p
              className="mb-8 text-sm"
              style={{ color: "var(--slate-light)" }}
            >
              Visar {courses.length} utbildning{courses.length !== 1 && "ar"}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={course.CourseTemplateId}
                  course={course}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </section>

      {/* Footer */}
      <footer
        className="border-t"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--card-bg)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-2">
            <SnowflakeIcon className="h-4 w-4 opacity-40" />
            <span
              className="text-sm font-medium"
              style={{ color: "var(--slate-light)" }}
            >
              Kylutbildningen
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--slate-light)" }}>
            &copy; {new Date().getFullYear()} Kylutbildningen. Alla rättigheter
            förbehållna.
          </p>
        </div>
      </footer>
    </div>
  );
}
