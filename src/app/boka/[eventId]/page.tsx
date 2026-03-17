"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { EventCard } from "@/types/eduadmin";
import type { BookingStep1Data } from "@/lib/validation";
import { bookingStep1Schema } from "@/lib/validation";
import { formatCompactDateRange, formatTime, formatPrice } from "@/lib/format";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BookingSteps } from "@/components/bokning/BookingSteps";
import { ParticipantForm } from "@/components/bokning/ParticipantForm";
import { PaymentSelector } from "@/components/bokning/PaymentSelector";
import { BookingSummary } from "@/components/bokning/BookingSummary";
import {
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  PlusIcon,
  CheckIcon,
  BuildingIcon,
  UserIcon,
  LoaderIcon,
} from "@/components/icons";

type BookingStep = 1 | 2 | 3;

const emptyParticipant = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  isPrimaryContact: false,
};

export default function BookingPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<BookingStep>(1);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    bookingId: number;
    bookingNumber: string;
  } | null>(null);

  const form = useForm<BookingStep1Data>({
    resolver: zodResolver(bookingStep1Schema),
    defaultValues: {
      customerType: "company",
      paymentMethod: "card",
      company: {
        organizationNumber: "",
        companyName: "",
        streetAddress: "",
        postalCode: "",
        city: "",
        contactFirstName: "",
        contactLastName: "",
        contactEmail: "",
        contactPhone: "",
      },
      private: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        streetAddress: "",
        postalCode: "",
        city: "",
      },
      participants: [{ ...emptyParticipant, isPrimaryContact: true }],
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    control,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

  const customerType = watch("customerType");
  const isCompany = customerType === "company";

  // Org number lookup state
  const [orgLookupLoading, setOrgLookupLoading] = useState(false);
  const [orgLookupResult, setOrgLookupResult] = useState<string | null>(null);
  const orgLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orgNumber = watch("company.organizationNumber");

  // Debounced org number lookup
  useEffect(() => {
    if (!isCompany) return;

    // Clean and check length
    const clean = (orgNumber || "").replace(/\D/g, "");
    if (clean.length < 10) {
      setOrgLookupResult(null);
      return;
    }

    if (orgLookupTimer.current) clearTimeout(orgLookupTimer.current);

    orgLookupTimer.current = setTimeout(async () => {
      setOrgLookupLoading(true);
      setOrgLookupResult(null);

      try {
        const res = await fetch(
          `/api/company/lookup?orgNr=${encodeURIComponent(orgNumber)}`,
        );
        const data = await res.json();

        if (data.found) {
          // Auto-fill all company fields
          if (data.companyName) setValue("company.companyName", data.companyName);
          if (data.streetAddress) setValue("company.streetAddress", data.streetAddress);
          if (data.postalCode) setValue("company.postalCode", data.postalCode);
          if (data.city) setValue("company.city", data.city);
          if (data.contactFirstName) setValue("company.contactFirstName", data.contactFirstName);
          if (data.contactLastName) setValue("company.contactLastName", data.contactLastName);
          if (data.contactEmail) setValue("company.contactEmail", data.contactEmail);
          if (data.contactPhone) setValue("company.contactPhone", data.contactPhone);

          setOrgLookupResult(
            `Hittade ${data.companyName}${data.source === "fortnox" ? " (befintlig kund)" : ""}`,
          );
        } else {
          setOrgLookupResult("Inget företag hittades — fyll i uppgifterna manuellt");
        }
      } catch {
        setOrgLookupResult(null);
      } finally {
        setOrgLookupLoading(false);
      }
    }, 600);

    return () => {
      if (orgLookupTimer.current) clearTimeout(orgLookupTimer.current);
    };
  }, [orgNumber, isCompany, setValue]);

  // Fetch event data
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/edu/events/${eventId}`);
        if (!res.ok) throw new Error("Event hittades inte");
        const data = await res.json();
        setEvent(data.eventCard);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Kunde inte ladda kursdata",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  // Switch to card if private is selected (invoice not available for private)
  useEffect(() => {
    if (!isCompany) {
      setValue("paymentMethod", "card");
    }
  }, [isCompany, setValue]);

  const onStep1Submit = useCallback(
    (data: BookingStep1Data) => {
      // Store in session storage for GDPR
      sessionStorage.setItem(
        `booking_${eventId}`,
        JSON.stringify(data),
      );
      setStep(2);
      // Focus management
      setTimeout(() => {
        document.getElementById("step-heading")?.focus();
      }, 100);
    },
    [eventId],
  );

  const onFinalSubmit = useCallback(async () => {
    const stored = sessionStorage.getItem(`booking_${eventId}`);
    if (!stored || !event) return;

    const formData: BookingStep1Data = JSON.parse(stored);
    setSubmitting(true);

    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.eventId,
          customerType: formData.customerType,
          paymentMethod: formData.paymentMethod,
          company: formData.customerType === "company" ? formData.company : undefined,
          private: formData.customerType === "private" ? formData.private : undefined,
          participants: formData.participants,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Bokningen kunde inte genomföras");
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      setBookingResult({
        bookingId: result.bookingId,
        bookingNumber: result.bookingNumber,
      });
      setStep(3);
      sessionStorage.removeItem(`booking_${eventId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Något gick fel vid bokningen",
      );
    } finally {
      setSubmitting(false);
    }
  }, [eventId, event]);

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--warm-white)" }}
      >
        <SiteHeader />
        <div className="flex items-center justify-center py-32">
          <LoaderIcon className="animate-spin" />
          <span className="ml-3 text-sm" style={{ color: "var(--slate-light)" }}>
            Laddar kursdata...
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !event) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--warm-white)" }}
      >
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h2
            className="mb-4 text-2xl"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--slate-deep)",
            }}
          >
            Något gick fel
          </h2>
          <p className="mb-6" style={{ color: "var(--slate-light)" }}>
            {error}
          </p>
          <a
            href="/kurser"
            className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--frost)" }}
          >
            Tillbaka till kurskatalogen
          </a>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!event) return null;

  const timeRange =
    event.startTime && event.endTime
      ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
      : null;

  const storedData = typeof window !== "undefined"
    ? sessionStorage.getItem(`booking_${eventId}`)
    : null;
  const step1Data: BookingStep1Data | null = storedData
    ? JSON.parse(storedData)
    : null;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <SiteHeader />

      {/* Event summary bar */}
      <div
        className="border-b"
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(160deg, var(--slate-deep) 0%, #1e3a4c 50%, var(--slate-mid) 100%)",
        }}
      >
        <div className="mx-auto max-w-3xl px-6 py-8">
          <p
            className="mb-1 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--frost)" }}
          >
            Boka kurs
          </p>
          <h1
            className="text-2xl text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {event.courseName}
          </h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/60">
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
            {event.lowestPrice != null && (
              <span className="font-medium text-white">
                {formatPrice(event.lowestPrice)} / deltagare
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="border-b bg-white py-4" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-3xl px-6">
          <BookingSteps currentStep={step} />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h2
          id="step-heading"
          className="mb-6 text-xl font-medium outline-none"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--slate-deep)",
          }}
          tabIndex={-1}
        >
          {step === 1 && "Fyll i uppgifter"}
          {step === 2 && "Granska & bekräfta"}
          {step === 3 && "Bekräftelse"}
        </h2>

        {error && step !== 3 && (
          <div
            className="mb-6 rounded-lg border p-4 text-sm"
            style={{
              borderColor: "var(--danger)",
              backgroundColor: "#fef2f2",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        {/* ─── Step 1 ─── */}
        {step === 1 && (
          <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-8">
            {/* Customer type tabs */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValue("customerType", "company")}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-all"
                style={{
                  borderColor: isCompany ? "var(--frost)" : "var(--border)",
                  backgroundColor: isCompany ? "var(--frost-light)" : "transparent",
                  color: isCompany ? "var(--frost-dark)" : "var(--slate-light)",
                }}
              >
                <BuildingIcon />
                Företag
              </button>
              <button
                type="button"
                onClick={() => setValue("customerType", "private")}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-all"
                style={{
                  borderColor: !isCompany ? "var(--frost)" : "var(--border)",
                  backgroundColor: !isCompany ? "var(--frost-light)" : "transparent",
                  color: !isCompany ? "var(--frost-dark)" : "var(--slate-light)",
                }}
              >
                <UserIcon />
                Privatperson
              </button>
            </div>

            {/* Company fields */}
            {isCompany && (
              <div className="space-y-4">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--slate-deep)" }}
                >
                  Företagsuppgifter
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FormField
                      label="Organisationsnummer"
                      error={errors.company?.organizationNumber?.message}
                    >
                      <div className="relative">
                        <input
                          {...register("company.organizationNumber")}
                          placeholder="556000-4615"
                          className="form-input"
                        />
                        {orgLookupLoading && (
                          <span
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            style={{ color: "var(--frost)" }}
                          >
                            <LoaderIcon className="animate-spin" />
                          </span>
                        )}
                      </div>
                    </FormField>
                    {orgLookupResult && !orgLookupLoading && (
                      <p
                        className="mt-1.5 text-xs"
                        style={{
                          color: orgLookupResult.startsWith("Hittade")
                            ? "var(--success)"
                            : "var(--slate-light)",
                        }}
                      >
                        {orgLookupResult.startsWith("Hittade") && (
                          <span className="mr-1">✓</span>
                        )}
                        {orgLookupResult}
                      </p>
                    )}
                  </div>
                  <FormField
                    label="Företagsnamn"
                    error={errors.company?.companyName?.message}
                  >
                    <input
                      {...register("company.companyName")}
                      placeholder="AB Kylteknik"
                      className="form-input"
                    />
                  </FormField>
                </div>
                <FormField
                  label="Gatuadress"
                  error={errors.company?.streetAddress?.message}
                >
                  <input
                    {...register("company.streetAddress")}
                    placeholder="Industrigatan 1"
                    className="form-input"
                  />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Postnummer"
                    error={errors.company?.postalCode?.message}
                  >
                    <input
                      {...register("company.postalCode")}
                      placeholder="411 01"
                      className="form-input"
                    />
                  </FormField>
                  <FormField
                    label="Stad"
                    error={errors.company?.city?.message}
                  >
                    <input
                      {...register("company.city")}
                      placeholder="Göteborg"
                      className="form-input"
                    />
                  </FormField>
                </div>

                <h3
                  className="mt-6 text-sm font-semibold"
                  style={{ color: "var(--slate-deep)" }}
                >
                  Kontaktperson
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Förnamn"
                    error={errors.company?.contactFirstName?.message}
                  >
                    <input
                      {...register("company.contactFirstName")}
                      placeholder="Anna"
                      className="form-input"
                    />
                  </FormField>
                  <FormField
                    label="Efternamn"
                    error={errors.company?.contactLastName?.message}
                  >
                    <input
                      {...register("company.contactLastName")}
                      placeholder="Svensson"
                      className="form-input"
                    />
                  </FormField>
                  <FormField
                    label="E-post"
                    error={errors.company?.contactEmail?.message}
                  >
                    <input
                      type="email"
                      {...register("company.contactEmail")}
                      placeholder="anna@foretag.se"
                      className="form-input"
                    />
                  </FormField>
                  <FormField
                    label="Telefon"
                    error={errors.company?.contactPhone?.message}
                  >
                    <input
                      type="tel"
                      {...register("company.contactPhone")}
                      placeholder="070-123 45 67"
                      className="form-input"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* Private fields */}
            {!isCompany && (
              <div className="space-y-4">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--slate-deep)" }}
                >
                  Dina uppgifter
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Förnamn"
                    error={errors.private?.firstName?.message}
                  >
                    <input
                      {...register("private.firstName")}
                      placeholder="Anna"
                      className="form-input"
                    />
                  </FormField>
                  <FormField
                    label="Efternamn"
                    error={errors.private?.lastName?.message}
                  >
                    <input
                      {...register("private.lastName")}
                      placeholder="Svensson"
                      className="form-input"
                    />
                  </FormField>
                  <FormField
                    label="E-post"
                    error={errors.private?.email?.message}
                  >
                    <input
                      type="email"
                      {...register("private.email")}
                      placeholder="anna@foretag.se"
                      className="form-input"
                    />
                  </FormField>
                  <FormField
                    label="Telefon"
                    error={errors.private?.phone?.message}
                  >
                    <input
                      type="tel"
                      {...register("private.phone")}
                      placeholder="070-123 45 67"
                      className="form-input"
                    />
                  </FormField>
                </div>
                <FormField
                  label="Gatuadress"
                  error={errors.private?.streetAddress?.message}
                >
                  <input
                    {...register("private.streetAddress")}
                    placeholder="Storgatan 1"
                    className="form-input"
                  />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Postnummer"
                    error={errors.private?.postalCode?.message}
                  >
                    <input
                      {...register("private.postalCode")}
                      placeholder="411 01"
                      className="form-input"
                    />
                  </FormField>
                  <FormField
                    label="Stad"
                    error={errors.private?.city?.message}
                  >
                    <input
                      {...register("private.city")}
                      placeholder="Göteborg"
                      className="form-input"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="space-y-4">
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--slate-deep)" }}
              >
                Deltagare
              </h3>
              {fields.map((field, index) => (
                <ParticipantForm
                  key={field.id}
                  index={index}
                  register={register}
                  errors={errors}
                  onRemove={fields.length > 1 ? () => remove(index) : undefined}
                  showPrimaryContact={isCompany && fields.length > 1}
                />
              ))}
              <button
                type="button"
                onClick={() => append({ ...emptyParticipant })}
                className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--frost)",
                }}
              >
                <PlusIcon />
                Lägg till deltagare
              </button>
            </div>

            {/* Payment method */}
            <PaymentSelector
              register={register}
              watch={watch}
              isCompany={isCompany}
            />

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-lg py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                background:
                  "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
              }}
            >
              Nästa: Granska bokning
            </button>
          </form>
        )}

        {/* ─── Step 2 ─── */}
        {step === 2 && step1Data && (
          <div className="space-y-6">
            <BookingSummary event={event} formData={step1Data} />

            {/* Terms */}
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                id="accept-terms"
                className="mt-0.5 accent-[var(--frost)]"
                required
              />
              <span style={{ color: "var(--slate-light)" }}>
                Jag godkänner{" "}
                <a
                  href="/villkor"
                  className="underline"
                  style={{ color: "var(--frost)" }}
                  target="_blank"
                >
                  bokningsvillkoren
                </a>{" "}
                och bekräftar att uppgifterna ovan är korrekta.
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border px-6 py-3.5 text-sm font-medium transition-all"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--slate-light)",
                }}
              >
                Tillbaka
              </button>
              <button
                type="button"
                onClick={() => {
                  const checkbox = document.getElementById(
                    "accept-terms",
                  ) as HTMLInputElement;
                  if (!checkbox?.checked) {
                    checkbox?.focus();
                    return;
                  }
                  onFinalSubmit();
                }}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
                }}
              >
                {submitting ? (
                  <>
                    <LoaderIcon className="animate-spin" />
                    Bearbetar...
                  </>
                ) : (
                  "Slutför bokning"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3 ─── */}
        {step === 3 && (
          <div className="py-10 text-center">
            <div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                backgroundColor: "var(--frost-light)",
                color: "var(--success)",
              }}
            >
              <CheckIcon />
            </div>
            <h3
              className="mb-2 text-2xl"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--slate-deep)",
              }}
            >
              Tack för din bokning!
            </h3>
            {bookingResult && (
              <p
                className="mb-1 text-sm font-medium"
                style={{ color: "var(--frost-dark)" }}
              >
                Bokningsnummer: {bookingResult.bookingNumber}
              </p>
            )}
            <p
              className="mx-auto mt-4 max-w-md leading-relaxed"
              style={{ color: "var(--slate-light)" }}
            >
              {watch("paymentMethod") === "invoice"
                ? "En faktura skickas till den angivna e-postadressen. Du får även en bekräftelse med en personlig länk för att hantera din bokning."
                : "Betalningen har genomförts. Du får en bekräftelse via e-post med en personlig länk för att hantera din bokning."}
            </p>
            <a
              href="/kurser"
              className="mt-8 inline-block rounded-lg px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--frost)" }}
            >
              Tillbaka till kurskatalogen
            </a>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--slate-light)" }}
      >
        {label} <span style={{ color: "var(--frost)" }}>*</span>
      </label>
      {children}
      {error && (
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--danger)" }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
