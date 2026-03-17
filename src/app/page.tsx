"use client";

import { useState } from "react";

/* ─── Course Data ─── */
interface Course {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  nextDate: string;
  category: string;
  spots: number;
}

const courses: Course[] = [
  {
    id: "f-gas",
    name: "Grundläggande kylteknik",
    description:
      "Utbildning i enlighet med F-gasförordningen (EU) 2024/573. Lär dig grunderna i kylsystem, köldmedier och miljöpåverkan.",
    duration: "2 dagar",
    price: "8 900 kr",
    nextDate: "14–15 april 2026",
    category: "F-gasförordningen",
    spots: 6,
  },
  {
    id: "cert-1",
    name: "Certifierad kyltekniker",
    description:
      "Fullständig certifieringsutbildning för Kategori I. Ger behörighet att installera, underhålla och serva alla typer av kylsystem.",
    duration: "5 dagar",
    price: "18 500 kr",
    nextDate: "21–25 april 2026",
    category: "Kategori I",
    spots: 4,
  },
  {
    id: "cert-2",
    name: "Certifierad kyltekniker",
    description:
      "Certifieringsutbildning för Kategori II. Ger behörighet för installation och underhåll av kylutrustning med fyllnadsmängd under 3 kg.",
    duration: "3 dagar",
    price: "12 900 kr",
    nextDate: "5–7 maj 2026",
    category: "Kategori II",
    spots: 8,
  },
  {
    id: "koldmedie",
    name: "Köldmediehantering",
    description:
      "Fördjupad utbildning i säker hantering, återvinning och destruktion av köldmedier. Inkluderar praktiska moment.",
    duration: "1 dag",
    price: "4 900 kr",
    nextDate: "28 april 2026",
    category: "Specialkurs",
    spots: 10,
  },
  {
    id: "lackage",
    name: "Läckagekontroll",
    description:
      "Lär dig utföra läckagekontroller enligt gällande regelverk. Metoder, dokumentation och rapportering.",
    duration: "1 dag",
    price: "4 500 kr",
    nextDate: "12 maj 2026",
    category: "Specialkurs",
    spots: 12,
  },
];

/* ─── Icons (inline SVG) ─── */
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

function XIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ─── Booking Modal ─── */
function BookingModal({
  course,
  onClose,
}: {
  course: Course;
  onClose: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
        style={{ backgroundColor: "rgba(26, 35, 50, 0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-2xl animate-slide-down"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
               style={{ backgroundColor: "var(--frost-light)", color: "var(--success)" }}>
            <CheckIcon />
          </div>
          <h3
            className="mb-2 text-2xl"
            style={{ fontFamily: "var(--font-serif)", color: "var(--slate-deep)" }}
          >
            Tack för din bokning!
          </h3>
          <p style={{ color: "var(--slate-light)" }} className="mb-6 leading-relaxed">
            Vi har tagit emot din intresseanmälan för{" "}
            <strong style={{ color: "var(--slate-mid)" }}>{course.name}</strong>.
            Vi återkommer inom ett arbetsdygn med bekräftelse.
          </p>
          <button
            onClick={onClose}
            className="rounded-lg px-8 py-3 text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--frost)" }}
          >
            Stäng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: "rgba(26, 35, 50, 0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-slide-down"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b px-8 py-5"
          style={{
            borderColor: "var(--border)",
            background: "linear-gradient(135deg, var(--slate-deep) 0%, var(--slate-mid) 100%)",
          }}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-widest"
               style={{ color: "rgba(255,255,255,0.5)" }}>
              Boka utbildning
            </p>
            <h3 className="mt-1 text-lg text-white" style={{ fontFamily: "var(--font-serif)" }}>
              {course.name}
              {course.category !== "Specialkurs" && (
                <span className="ml-2 text-sm font-normal" style={{ color: "rgba(255,255,255,0.6)" }}>
                  ({course.category})
                </span>
              )}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors"
            style={{ color: "rgba(255,255,255,0.6)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
          >
            <XIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-8">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Namn" name="name" required placeholder="Anna Svensson" />
            <FormField label="Företag" name="company" placeholder="AB Kylteknik" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="E-post" name="email" type="email" required placeholder="anna@foretag.se" />
            <FormField label="Telefon" name="phone" type="tel" placeholder="070-123 45 67" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Antal deltagare" name="participants" type="number" required placeholder="1" />
            <div>
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--slate-light)" }}
              >
                Önskat datum
              </label>
              <input
                type="date"
                name="date"
                className="w-full rounded-lg border px-4 py-2.5 text-sm transition-colors outline-none"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--slate-deep)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--frost)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          </div>
          <div>
            <label
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
              style={{ color: "var(--slate-light)" }}
            >
              Meddelande <span style={{ color: "var(--border-hover)" }}>(valfritt)</span>
            </label>
            <textarea
              name="message"
              rows={3}
              placeholder="Berätta gärna om era behov eller frågor..."
              className="w-full resize-none rounded-lg border px-4 py-2.5 text-sm transition-colors outline-none"
              style={{
                borderColor: "var(--border)",
                color: "var(--slate-deep)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--frost)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-lg py-3 text-sm font-semibold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Skicka intresseanmälan
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-6 py-3 text-sm font-medium transition-colors"
              style={{
                borderColor: "var(--border)",
                color: "var(--slate-light)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-hover)";
                e.currentTarget.style.color = "var(--slate-mid)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--slate-light)";
              }}
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--slate-light)" }}
      >
        {label}
        {required && <span style={{ color: "var(--frost)" }}> *</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        min={type === "number" ? 1 : undefined}
        className="w-full rounded-lg border px-4 py-2.5 text-sm transition-colors outline-none"
        style={{
          borderColor: "var(--border)",
          color: "var(--slate-deep)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--frost)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  );
}

/* ─── Course Card ─── */
function CourseCard({
  course,
  index,
  onBook,
}: {
  course: Course;
  index: number;
  onBook: (course: Course) => void;
}) {
  return (
    <div
      className={`animate-fade-up stagger-${index + 1} group relative flex flex-col rounded-2xl border bg-white transition-all duration-300`}
      style={{
        borderColor: "var(--border)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--frost)";
        e.currentTarget.style.boxShadow = "0 8px 30px rgba(8, 145, 178, 0.08)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Category tag */}
      <div className="flex items-center justify-between px-7 pt-6">
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: "var(--frost-light)",
            color: "var(--frost-dark)",
          }}
        >
          {course.category}
        </span>
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: "var(--slate-light)" }}
        >
          <UsersIcon />
          <span>{course.spots} platser kvar</span>
        </div>
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
          {course.name}
        </h3>
        <p
          className="mt-2.5 flex-1 text-sm leading-relaxed"
          style={{ color: "var(--slate-light)" }}
        >
          {course.description}
        </p>

        {/* Meta row */}
        <div
          className="mt-5 flex items-center gap-5 border-t pt-5 text-xs"
          style={{
            borderColor: "var(--border)",
            color: "var(--slate-light)",
          }}
        >
          <span className="flex items-center gap-1.5">
            <ClockIcon />
            {course.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarIcon />
            {course.nextDate}
          </span>
        </div>

        {/* Price + CTA */}
        <div className="mt-5 flex items-center justify-between">
          <div>
            <span
              className="text-2xl font-semibold tabular-nums"
              style={{ color: "var(--slate-deep)" }}
            >
              {course.price}
            </span>
            <span
              className="ml-1 text-xs"
              style={{ color: "var(--slate-light)" }}
            >
              exkl. moms
            </span>
          </div>
          <button
            onClick={() => onBook(course)}
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all"
            style={{
              background:
                "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(8, 145, 178, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Boka
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function BookingPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
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
          <div className="flex items-center gap-2.5">
            <SnowflakeIcon className="opacity-70" />
            <span
              className="text-lg font-semibold tracking-tight"
              style={{ color: "var(--slate-deep)" }}
            >
              Kylutbildningen
            </span>
          </div>
          <div className="flex items-center gap-8">
            <a
              href="#utbildningar"
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--slate-light)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--frost)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--slate-light)")}
            >
              Utbildningar
            </a>
            <a
              href="#utbildningar"
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--frost)" }}
            >
              Boka nu
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header
        className="relative overflow-hidden border-b"
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(160deg, var(--slate-deep) 0%, #1e3a4c 50%, var(--slate-mid) 100%)",
        }}
      >
        {/* Decorative frost circles */}
        <div
          className="absolute -right-20 -top-20 h-96 w-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, var(--frost) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -left-10 bottom-0 h-64 w-64 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, var(--frost) 0%, transparent 70%)" }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="max-w-2xl">
            <div className="animate-fade-up mb-4 flex items-center gap-2">
              <div
                className="h-px w-8"
                style={{ backgroundColor: "var(--frost)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--frost)" }}
              >
                Certifierade utbildningar
              </span>
            </div>
            <h1
              className="animate-fade-up stagger-1 text-4xl leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Boka din
              <br />
              kylutbildning
            </h1>
            <p
              className="animate-fade-up stagger-2 mt-6 max-w-lg text-base leading-relaxed sm:text-lg"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              Professionella utbildningar inom kylteknik, köldmediehantering och
              F-gasförordningen. Certifiera dig och ditt team med branschens
              mest erfarna utbildare.
            </p>
            <div className="animate-fade-up stagger-3 mt-10 flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(8, 145, 178, 0.2)" }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "var(--frost)" }}
                  />
                </div>
                <span className="text-sm text-white/50">INCERT-certifierade</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(8, 145, 178, 0.2)" }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "var(--frost)" }}
                  />
                </div>
                <span className="text-sm text-white/50">Små grupper</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(8, 145, 178, 0.2)" }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "var(--frost)" }}
                  />
                </div>
                <span className="text-sm text-white/50">Teori & praktik</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Courses Grid */}
      <section id="utbildningar" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12">
          <h2
            className="text-3xl tracking-tight sm:text-4xl"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--slate-deep)",
            }}
          >
            Våra utbildningar
          </h2>
          <p
            className="mt-3 max-w-lg text-base leading-relaxed"
            style={{ color: "var(--slate-light)" }}
          >
            Välj den utbildning som passar dig och ditt företag. Alla priser
            gäller per deltagare.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, i) => (
            <CourseCard
              key={course.id}
              course={course}
              index={i}
              onBook={setSelectedCourse}
            />
          ))}
        </div>
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

      {/* Booking Modal */}
      {selectedCourse && (
        <BookingModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
}
