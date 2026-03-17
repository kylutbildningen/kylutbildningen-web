import Link from "next/link";
import type { EventCard } from "@/types/eduadmin";
import { formatCompactDateRange, formatTime, formatPrice } from "@/lib/format";
import { CalendarIcon, ClockIcon, MapPinIcon, ArrowRightIcon } from "@/components/icons";
import { SeatsAvailable } from "./SeatsAvailable";

export function CourseCard({ event }: { event: EventCard }) {
  const timeRange =
    event.startTime && event.endTime
      ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
      : null;

  return (
    <div
      className="group flex flex-col rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5">
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: "var(--frost-light)",
            color: "var(--frost-dark)",
          }}
        >
          {event.categoryName || "Utbildning"}
        </span>
        <SeatsAvailable spots={event.spotsLeft} />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 pt-4 pb-6">
        <h3
          className="text-lg font-medium leading-tight"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--slate-deep)",
          }}
        >
          {event.courseName}
        </h3>

        {/* Meta */}
        <div
          className="mt-4 flex flex-col gap-2 text-sm"
          style={{ color: "var(--slate-light)" }}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon />
            {formatCompactDateRange(event.startDate, event.endDate)}
          </span>
          {timeRange && (
            <span className="flex items-center gap-2">
              <ClockIcon />
              {timeRange}
            </span>
          )}
          {event.city && (
            <span className="flex items-center gap-2">
              <MapPinIcon />
              {event.city}
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            {event.lowestPrice != null ? (
              <>
                <span
                  className="text-xl font-semibold tabular-nums"
                  style={{ color: "var(--slate-deep)" }}
                >
                  fr. {formatPrice(event.lowestPrice)}
                </span>
                <span
                  className="ml-1 block text-xs"
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
          {event.isFullyBooked ? (
            <button
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold opacity-50"
              style={{
                backgroundColor: "var(--border)",
                color: "var(--slate-light)",
              }}
            >
              Fullbokad
            </button>
          ) : (
            <Link
              href={`/boka/${event.eventId}`}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                background:
                  "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
              }}
            >
              Boka
              <ArrowRightIcon />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
