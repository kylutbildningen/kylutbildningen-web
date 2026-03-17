import type { EventCard } from "@/types/eduadmin";
import type { BookingStep1Data } from "@/lib/validation";
import { formatCompactDateRange, formatTime, formatPrice } from "@/lib/format";
import { CalendarIcon, MapPinIcon, ClockIcon, UsersIcon } from "@/components/icons";

interface BookingSummaryProps {
  event: EventCard;
  formData: BookingStep1Data;
}

export function BookingSummary({ event, formData }: BookingSummaryProps) {
  const numParticipants = formData.participants.length;
  const unitPrice = event.lowestPrice ?? 0;
  const totalExVat = unitPrice * numParticipants;
  const vatRate = 0.25;
  const vat = totalExVat * vatRate;
  const totalIncVat = totalExVat + vat;

  const isCompany = formData.customerType === "company";
  const contactName = isCompany
    ? `${formData.company?.contactFirstName} ${formData.company?.contactLastName}`
    : `${formData.private?.firstName} ${formData.private?.lastName}`;
  const contactEmail = isCompany
    ? formData.company?.contactEmail
    : formData.private?.email;

  const timeRange =
    event.startTime && event.endTime
      ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
      : null;

  return (
    <div className="space-y-6">
      {/* Course info */}
      <div
        className="rounded-lg border p-5"
        style={{ borderColor: "var(--border)" }}
      >
        <h3
          className="mb-3 text-lg font-medium"
          style={{ fontFamily: "var(--font-serif)", color: "var(--slate-deep)" }}
        >
          {event.courseName}
        </h3>
        <div
          className="flex flex-wrap gap-4 text-sm"
          style={{ color: "var(--slate-light)" }}
        >
          <span className="flex items-center gap-1.5">
            <CalendarIcon />
            {formatCompactDateRange(event.startDate, event.endDate)}
          </span>
          {timeRange && (
            <span className="flex items-center gap-1.5">
              <ClockIcon />
              {timeRange}
            </span>
          )}
          {event.city && (
            <span className="flex items-center gap-1.5">
              <MapPinIcon />
              {event.city}
            </span>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div
        className="rounded-lg border p-5"
        style={{ borderColor: "var(--border)" }}
      >
        <h4
          className="mb-3 text-sm font-semibold uppercase tracking-wide"
          style={{ color: "var(--slate-light)" }}
        >
          Kontaktuppgifter
        </h4>
        <p className="text-sm" style={{ color: "var(--slate-deep)" }}>
          {contactName}
        </p>
        <p className="text-sm" style={{ color: "var(--slate-light)" }}>
          {contactEmail}
        </p>
        {isCompany && formData.company && (
          <p className="mt-1 text-sm" style={{ color: "var(--slate-light)" }}>
            {formData.company.companyName} ({formData.company.organizationNumber})
          </p>
        )}
      </div>

      {/* Participants */}
      <div
        className="rounded-lg border p-5"
        style={{ borderColor: "var(--border)" }}
      >
        <h4
          className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"
          style={{ color: "var(--slate-light)" }}
        >
          <UsersIcon />
          Deltagare ({numParticipants})
        </h4>
        <div className="space-y-2">
          {formData.participants.map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-sm"
            >
              <span style={{ color: "var(--slate-deep)" }}>
                {p.firstName} {p.lastName}
              </span>
              <span style={{ color: "var(--slate-light)" }}>{p.email}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Price breakdown */}
      <div
        className="rounded-lg border p-5"
        style={{ borderColor: "var(--border)" }}
      >
        <h4
          className="mb-3 text-sm font-semibold uppercase tracking-wide"
          style={{ color: "var(--slate-light)" }}
        >
          Pris
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: "var(--slate-light)" }}>
              {numParticipants} × {formatPrice(unitPrice)}
            </span>
            <span style={{ color: "var(--slate-deep)" }}>
              {formatPrice(totalExVat)}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--slate-light)" }}>Moms (25%)</span>
            <span style={{ color: "var(--slate-deep)" }}>
              {formatPrice(vat)}
            </span>
          </div>
          <div
            className="flex justify-between border-t pt-2 font-semibold"
            style={{ borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--slate-deep)" }}>Totalt inkl. moms</span>
            <span style={{ color: "var(--frost-dark)" }}>
              {formatPrice(totalIncVat)}
            </span>
          </div>
        </div>
        <p
          className="mt-2 text-xs"
          style={{ color: "var(--slate-light)" }}
        >
          Betalning: {formData.paymentMethod === "card" ? "Kort (Svea)" : "Faktura"}
        </p>
      </div>
    </div>
  );
}
