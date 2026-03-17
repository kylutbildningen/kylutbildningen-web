import { CourseGridSkeleton } from "@/components/kurser/CourseGrid";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function Loading() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <SiteHeader />

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
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <CourseGridSkeleton />
      </section>
    </div>
  );
}
