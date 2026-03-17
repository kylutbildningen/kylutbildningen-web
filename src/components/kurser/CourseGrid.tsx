import type { EventCard } from "@/types/eduadmin";
import { CourseCard } from "./CourseCard";
import { CalendarIcon } from "@/components/icons";

export function CourseGrid({ events }: { events: EventCard[] }) {
  if (events.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <CourseCard key={event.eventId} event={event} />
      ))}
    </div>
  );
}

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
        Inga kurser matchar dina filter
      </h3>
      <p className="text-sm" style={{ color: "var(--slate-light)" }}>
        Prova att ändra dina filter eller{" "}
        <a
          href="/kurser"
          className="underline"
          style={{ color: "var(--frost)" }}
        >
          visa alla kurser
        </a>
        .
      </p>
    </div>
  );
}

export function CourseGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-2xl border bg-white"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between px-6 pt-5">
            <div
              className="h-6 w-24 animate-pulse rounded-full"
              style={{ backgroundColor: "var(--frost-light)" }}
            />
            <div
              className="h-6 w-28 animate-pulse rounded-full"
              style={{ backgroundColor: "#f0f0f0" }}
            />
          </div>
          <div className="flex flex-1 flex-col px-6 pt-4 pb-6">
            <div
              className="h-6 w-3/4 animate-pulse rounded"
              style={{ backgroundColor: "#f0f0f0" }}
            />
            <div className="mt-4 space-y-2">
              <div
                className="h-4 w-40 animate-pulse rounded"
                style={{ backgroundColor: "#f0f0f0" }}
              />
              <div
                className="h-4 w-32 animate-pulse rounded"
                style={{ backgroundColor: "#f0f0f0" }}
              />
              <div
                className="h-4 w-24 animate-pulse rounded"
                style={{ backgroundColor: "#f0f0f0" }}
              />
            </div>
            <div className="mt-auto flex items-end justify-between pt-5">
              <div
                className="h-8 w-28 animate-pulse rounded"
                style={{ backgroundColor: "#f0f0f0" }}
              />
              <div
                className="h-10 w-24 animate-pulse rounded-lg"
                style={{ backgroundColor: "var(--frost-light)" }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
