"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { EventCard } from "@/types/eduadmin";
import type { BookingStep1Data } from "@/lib/validation";
import type { SupabasePerson } from "@/lib/supabase-persons";
import { bookingStep1Schema } from "@/lib/validation";
import { formatCompactDateRange, formatTime, formatPrice } from "@/lib/format";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BookingSteps } from "@/components/bokning/BookingSteps";
import { ParticipantForm } from "@/components/bokning/ParticipantForm";
import { PaymentSelector } from "@/components/bokning/PaymentSelector";
import { BookingSummary } from "@/components/bokning/BookingSummary";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
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
  civicRegistrationNumber: "",
  isPrimaryContact: false,
  priceNameId: undefined as number | undefined,
};

export default function BookingPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<BookingStep>(1);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    bookingId: number;
    bookingNumber: string;
  } | null>(null);

  // Participant restriction state
  const [isParticipantUser, setIsParticipantUser] = useState(false);
  const [myPersonId, setMyPersonId] = useState<number | null>(null);
  const [myCustomerId, setMyCustomerId] = useState<number | null>(null);
  const [alreadyBooked, setAlreadyBooked] = useState(false);

  // Company persons from Supabase (for participant picker)
  const [companyPersons, setCompanyPersons] = useState<SupabasePerson[]>([]);
  const [showPersonPicker, setShowPersonPicker] = useState(false);

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
        invoiceEmail: "",
        invoiceReference: "",
        useAlternateInvoiceAddress: false,
        invoiceStreetAddress: "",
        invoicePostalCode: "",
        invoiceCity: "",
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

  // ─── Auth check + prefill from EduAdmin ───
  useEffect(() => {
    async function checkAuthAndPrefill() {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in → redirect to onboarding with return URL
        router.replace(`/onboarding?redirect=/boka/${eventId}`);
        return;
      }

      // Get membership
      const { data: membership } = await supabase
        .from("company_memberships")
        .select("edu_customer_id, company_name, org_number, role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!membership) {
        router.replace(`/onboarding/company?redirect=/boka/${eventId}`);
        return;
      }

      // Fetch customer details from EduAdmin
      try {
        const custRes = await fetch(
          `/api/edu/customers/${membership.edu_customer_id}`,
        );
        if (custRes.ok) {
          const custData = await custRes.json();
          // Prefill company fields
          setValue("company.organizationNumber", custData.OrganisationNumber || "");
          setValue("company.companyName", custData.CustomerName || "");
          setValue("company.streetAddress",
            [custData.Address, custData.Address2].filter(Boolean).join(", ") || "");
          setValue("company.postalCode", custData.Zip || "");
          setValue("company.city", custData.City || "");

          // Prefill fakturauppgifter från EduAdmin BillingInfo
          if (custData.BillingInfo) {
            const bi = custData.BillingInfo;
            if (bi.Email) setValue("company.invoiceEmail", bi.Email);
            if (bi.BuyerReference) setValue("company.invoiceReference", bi.BuyerReference);
            if (bi.Address && bi.Address !== custData.Address) {
              setValue("company.useAlternateInvoiceAddress", true);
              setValue("company.invoiceStreetAddress", bi.Address || "");
              setValue("company.invoicePostalCode", bi.Zip || "");
              setValue("company.invoiceCity", bi.City || "");
            }
          }
        }
      } catch { /* continue without prefill */ }

      // Fetch persons from Supabase
      try {
        const persRes = await fetch(
          `/api/edu/persons?customerId=${membership.edu_customer_id}`,
        );
        if (persRes.ok) {
          const persons: SupabasePerson[] = await persRes.json();
          setCompanyPersons(persons);

          // Find the logged-in user's person record and prefill as contact
          const myPerson = persons.find(
            (p) => p.email?.toLowerCase() === user.email?.toLowerCase(),
          );
          if (myPerson) {
            setValue("company.contactFirstName", myPerson.first_name || "");
            setValue("company.contactLastName", myPerson.last_name || "");
            setValue("company.contactEmail", myPerson.email || "");
            setValue("company.contactPhone", myPerson.phone || myPerson.mobile || "");

            // Prefill first participant as the contact person
            setValue("participants.0.firstName", myPerson.first_name || "");
            setValue("participants.0.lastName", myPerson.last_name || "");
            setValue("participants.0.email", myPerson.email || "");
            setValue("participants.0.phone", myPerson.phone || myPerson.mobile || "");
            setValue("participants.0.civicRegistrationNumber", myPerson.civic_registration_number || "");
            setValue("participants.0.isPrimaryContact", true);
          }

          // Store participant restriction state
          setIsParticipantUser(membership.role === "participant");
          setMyPersonId(myPerson?.edu_person_id ?? null);
          setMyCustomerId(membership.edu_customer_id);
        }
      } catch { /* continue */ }

      setAuthChecked(true);
    }

    checkAuthAndPrefill();
  }, [eventId, router, setValue]);

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

  // Check if participant is already booked on the same course type
  useEffect(() => {
    if (!isParticipantUser || !myPersonId || !myCustomerId || !event) return;
    async function checkAlreadyBooked() {
      const res = await fetch(`/api/edu/bookings/mine?personId=${myPersonId}&customerId=${myCustomerId}`);
      if (!res.ok) return;
      const bookings = await res.json();
      const already = bookings.some((b: any) => b.Event?.CourseTemplateId === event!.courseTemplateId);
      setAlreadyBooked(already);
    }
    checkAlreadyBooked();
  }, [isParticipantUser, myPersonId, myCustomerId, event]);

  // Switch to card if private is selected
  useEffect(() => {
    if (!isCompany) {
      setValue("paymentMethod", "card");
    }
  }, [isCompany, setValue]);

  // Add person from company picker
  function addPersonFromCompany(person: SupabasePerson) {
    const existing = fields.some((_, i) => {
      const email = watch(`participants.${i}.email`);
      return email?.toLowerCase() === person.email?.toLowerCase();
    });
    if (existing) return;

    append({
      firstName: person.first_name || "",
      lastName: person.last_name || "",
      email: person.email || "",
      phone: person.phone || person.mobile || "",
      civicRegistrationNumber: person.civic_registration_number || "",
      isPrimaryContact: false,
    });
    setShowPersonPicker(false);
  }

  const onStep1Submit = useCallback(
    (data: BookingStep1Data) => {
      sessionStorage.setItem(`booking_${eventId}`, JSON.stringify(data));
      setStep(2);
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
      // Card payments go through Svea Checkout
      if (formData.paymentMethod === "card") {
        // sessionStorage data is kept — betala page reads it
        router.push(`/boka/${eventId}/betala`);
        return;
      }

      // Invoice payments go directly to EduAdmin
      const supabase = createSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers,
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
  }, [eventId, event, router]);

  // Loading / auth check
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
        <SiteHeader />
        <div className="flex items-center justify-center py-32">
          <LoaderIcon className="animate-spin" />
          <span className="ml-3 text-sm" style={{ color: "var(--slate-light)" }}>
            {!authChecked ? "Kontrollerar inloggning..." : "Laddar kursdata..."}
          </span>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h2 className="mb-4 text-2xl" style={{ fontFamily: "var(--font-serif)", color: "var(--slate-deep)" }}>
            Något gick fel
          </h2>
          <p className="mb-6" style={{ color: "var(--slate-light)" }}>{error}</p>
          <a href="/kurser" className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white" style={{ backgroundColor: "var(--frost)" }}>
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

  // Persons not yet added as participants
  const availablePersons = companyPersons.filter((p) => {
    return !fields.some((_, i) => {
      const email = watch(`participants.${i}.email`);
      return email?.toLowerCase() === p.email?.toLowerCase();
    });
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
      <SiteHeader />

      {/* Event summary bar */}
      <div
        className="border-b"
        style={{
          borderColor: "var(--border)",
          background: "linear-gradient(160deg, var(--slate-deep) 0%, #1e3a4c 50%, var(--slate-mid) 100%)",
        }}
      >
        <div className="mx-auto max-w-3xl px-6 py-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--frost)" }}>
            Boka kurs
          </p>
          <h1 className="text-2xl text-white sm:text-3xl" style={{ fontFamily: "var(--font-serif)" }}>
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

      {/* Steps */}
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
          style={{ fontFamily: "var(--font-serif)", color: "var(--slate-deep)" }}
          tabIndex={-1}
        >
          {step === 1 && "Fyll i uppgifter"}
          {step === 2 && "Granska & bekräfta"}
          {step === 3 && "Bekräftelse"}
        </h2>

        {error && step !== 3 && (
          <div className="mb-6 rounded-lg border p-4 text-sm" style={{ borderColor: "var(--danger)", backgroundColor: "#fef2f2", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        {/* Already booked on same course type */}
        {alreadyBooked && (
          <div className="mb-6 rounded-xl border p-6 text-center" style={{ borderColor: "var(--frost)", backgroundColor: "var(--frost-light)" }}>
            <p className="mb-2 text-base font-medium" style={{ color: "var(--frost-dark)" }}>
              Du är redan anmäld till denna typ av kurs
            </p>
            <p className="mb-4 text-sm" style={{ color: "var(--slate-light)" }}>
              Om du vill byta tillfälle kan du flytta din befintliga bokning.
            </p>
            <a
              href="/dashboard/mina-kurser"
              className="inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--frost)" }}
            >
              Gå till Mina kurser
            </a>
          </div>
        )}

        {/* ─── Step 1 ─── */}
        {step === 1 && !alreadyBooked && (
          <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-8">
            {/* Customer type tabs */}
            <div className="flex gap-2">
              <button type="button" onClick={() => setValue("customerType", "company")}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-all"
                style={{ borderColor: isCompany ? "var(--frost)" : "var(--border)", backgroundColor: isCompany ? "var(--frost-light)" : "transparent", color: isCompany ? "var(--frost-dark)" : "var(--slate-light)" }}>
                <BuildingIcon /> Företag
              </button>
              <button type="button" onClick={() => setValue("customerType", "private")}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-all"
                style={{ borderColor: !isCompany ? "var(--frost)" : "var(--border)", backgroundColor: !isCompany ? "var(--frost-light)" : "transparent", color: !isCompany ? "var(--frost-dark)" : "var(--slate-light)" }}>
                <UserIcon /> Privatperson
              </button>
            </div>

            {/* Company fields (prefilled from EduAdmin) */}
            {isCompany && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--slate-deep)" }}>
                    Företagsuppgifter
                  </h3>
                  <span className="text-xs" style={{ color: "var(--success)" }}>
                    Förifyllt från EduAdmin
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Organisationsnummer" error={errors.company?.organizationNumber?.message}>
                    <input {...register("company.organizationNumber")} placeholder="556000-4615" className="form-input" />
                  </FormField>
                  <FormField label="Företagsnamn" error={errors.company?.companyName?.message}>
                    <input {...register("company.companyName")} placeholder="AB Kylteknik" className="form-input" />
                  </FormField>
                </div>
                <FormField label="Gatuadress" error={errors.company?.streetAddress?.message}>
                  <input {...register("company.streetAddress")} placeholder="Industrigatan 1" className="form-input" />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Postnummer" error={errors.company?.postalCode?.message}>
                    <input {...register("company.postalCode")} placeholder="411 01" className="form-input" />
                  </FormField>
                  <FormField label="Stad" error={errors.company?.city?.message}>
                    <input {...register("company.city")} placeholder="Göteborg" className="form-input" />
                  </FormField>
                </div>

                <h3 className="mt-6 text-sm font-semibold" style={{ color: "var(--slate-deep)" }}>
                  Kontaktperson
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Förnamn" error={errors.company?.contactFirstName?.message}>
                    <input {...register("company.contactFirstName")} placeholder="Anna" className="form-input" />
                  </FormField>
                  <FormField label="Efternamn" error={errors.company?.contactLastName?.message}>
                    <input {...register("company.contactLastName")} placeholder="Svensson" className="form-input" />
                  </FormField>
                  <FormField label="E-post" error={errors.company?.contactEmail?.message}>
                    <input type="email" {...register("company.contactEmail")} placeholder="anna@foretag.se" className="form-input" />
                  </FormField>
                  <FormField label="Telefon" error={errors.company?.contactPhone?.message}>
                    <input type="tel" {...register("company.contactPhone")} placeholder="070-123 45 67" className="form-input" />
                  </FormField>
                </div>

                {/* Fakturauppgifter */}
                <div className="rounded-lg border p-5 space-y-4 mt-2" style={{ borderColor: "var(--border)", background: "#f9fafb" }}>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--slate-deep)" }}>
                    Fakturauppgifter
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Faktura e-post">
                      <input type="email" {...register("company.invoiceEmail")} placeholder="faktura@foretag.se" className="form-input" />
                    </FormField>
                    <FormField label="Er referens / PO-nummer">
                      <input {...register("company.invoiceReference")} placeholder="T.ex. REF-2026-001" className="form-input" />
                    </FormField>
                  </div>
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: "var(--slate-deep)" }}>
                    <input type="checkbox" {...register("company.useAlternateInvoiceAddress")} className="accent-[var(--frost)]" />
                    Faktura till annan adress än företagsadressen
                  </label>
                  {watch("company.useAlternateInvoiceAddress") && (
                    <div className="space-y-4 pt-1">
                      <FormField label="Fakturaadress">
                        <input {...register("company.invoiceStreetAddress")} placeholder="Fakturavägen 1" className="form-input" />
                      </FormField>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Postnummer">
                          <input {...register("company.invoicePostalCode")} placeholder="411 01" className="form-input" />
                        </FormField>
                        <FormField label="Stad">
                          <input {...register("company.invoiceCity")} placeholder="Göteborg" className="form-input" />
                        </FormField>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Private fields */}
            {!isCompany && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold" style={{ color: "var(--slate-deep)" }}>Dina uppgifter</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Förnamn" error={errors.private?.firstName?.message}>
                    <input {...register("private.firstName")} placeholder="Anna" className="form-input" />
                  </FormField>
                  <FormField label="Efternamn" error={errors.private?.lastName?.message}>
                    <input {...register("private.lastName")} placeholder="Svensson" className="form-input" />
                  </FormField>
                  <FormField label="E-post" error={errors.private?.email?.message}>
                    <input type="email" {...register("private.email")} placeholder="anna@foretag.se" className="form-input" />
                  </FormField>
                  <FormField label="Telefon" error={errors.private?.phone?.message}>
                    <input type="tel" {...register("private.phone")} placeholder="070-123 45 67" className="form-input" />
                  </FormField>
                </div>
                <FormField label="Gatuadress" error={errors.private?.streetAddress?.message}>
                  <input {...register("private.streetAddress")} placeholder="Storgatan 1" className="form-input" />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Postnummer" error={errors.private?.postalCode?.message}>
                    <input {...register("private.postalCode")} placeholder="411 01" className="form-input" />
                  </FormField>
                  <FormField label="Stad" error={errors.private?.city?.message}>
                    <input {...register("private.city")} placeholder="Göteborg" className="form-input" />
                  </FormField>
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--slate-deep)" }}>
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
                  priceOptions={event.priceOptions}
                />
              ))}

              <div className="flex flex-wrap gap-2">
                {!isParticipantUser && (
                  <button
                    type="button"
                    onClick={() => append({ ...emptyParticipant })}
                    className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all"
                    style={{ borderColor: "var(--border)", color: "var(--frost)" }}
                  >
                    <PlusIcon /> Lägg till deltagare
                  </button>
                )}

                {/* Person picker from EduAdmin */}
                {!isParticipantUser && isCompany && availablePersons.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPersonPicker(!showPersonPicker)}
                      className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all"
                      style={{ borderColor: "var(--frost)", backgroundColor: "var(--frost-light)", color: "var(--frost-dark)" }}
                    >
                      <UserIcon /> Välj från företaget ({availablePersons.length})
                    </button>

                    {showPersonPicker && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowPersonPicker(false)} />
                        <div
                          className="absolute left-0 top-full z-20 mt-1 w-80 rounded-lg border bg-white py-1 shadow-lg"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <div className="max-h-64 overflow-y-auto">
                            {availablePersons.map((p) => (
                              <button
                                key={p.edu_person_id}
                                type="button"
                                onClick={() => addPersonFromCompany(p)}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--frost-light)]"
                              >
                                <div
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                  style={{ backgroundColor: p.is_contact_person ? "var(--frost-light)" : "#f0f0f0", color: p.is_contact_person ? "var(--frost-dark)" : "var(--slate-light)" }}
                                >
                                  <UserIcon />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="block font-medium" style={{ color: "var(--slate-deep)" }}>
                                    {p.first_name} {p.last_name}
                                  </span>
                                  <span className="block text-xs truncate" style={{ color: "var(--slate-light)" }}>
                                    {p.email || "Ingen e-post"}
                                    {p.civic_registration_number && ` · ${p.civic_registration_number}`}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment method */}
            <PaymentSelector register={register} watch={watch} isCompany={isCompany} />

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-lg py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)" }}
            >
              Nästa: Granska bokning
            </button>
          </form>
        )}

        {/* ─── Step 2 ─── */}
        {step === 2 && step1Data && (
          <div className="space-y-6">
            <BookingSummary event={event} formData={step1Data} priceOptions={event.priceOptions} />
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" id="accept-terms" className="mt-0.5 accent-[var(--frost)]" required />
              <span style={{ color: "var(--slate-light)" }}>
                Jag godkänner{" "}
                <a href="/villkor" className="underline" style={{ color: "var(--frost)" }} target="_blank">bokningsvillkoren</a>{" "}
                och bekräftar att uppgifterna ovan är korrekta.
              </span>
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="rounded-lg border px-6 py-3.5 text-sm font-medium"
                style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}>
                Tillbaka
              </button>
              <button type="button"
                onClick={() => {
                  const cb = document.getElementById("accept-terms") as HTMLInputElement;
                  if (!cb?.checked) { cb?.focus(); return; }
                  onFinalSubmit();
                }}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)" }}>
                {submitting ? (<><LoaderIcon className="animate-spin" /> Bearbetar...</>) : "Slutför bokning"}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3 ─── */}
        {step === 3 && (
          <div className="py-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: "var(--frost-light)", color: "var(--success)" }}>
              <CheckIcon />
            </div>
            <h3 className="mb-2 text-2xl" style={{ fontFamily: "var(--font-serif)", color: "var(--slate-deep)" }}>
              Tack för din bokning!
            </h3>
            {bookingResult && (
              <p className="mb-1 text-sm font-medium" style={{ color: "var(--frost-dark)" }}>
                Bokningsnummer: {bookingResult.bookingNumber}
              </p>
            )}
            <p className="mx-auto mt-4 max-w-md leading-relaxed" style={{ color: "var(--slate-light)" }}>
              {watch("paymentMethod") === "invoice"
                ? "En faktura skickas till den angivna e-postadressen. Du får även en bekräftelse med en personlig länk för att hantera din bokning."
                : "Betalningen har genomförts. Du får en bekräftelse via e-post med en personlig länk för att hantera din bokning."}
            </p>
            <a href="/kurser" className="mt-8 inline-block rounded-lg px-8 py-3 text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: "var(--frost)" }}>
              Tillbaka till kurskatalogen
            </a>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
        {label} <span style={{ color: "var(--frost)" }}>*</span>
      </label>
      {children}
      {error && <p className="mt-1 text-xs" style={{ color: "var(--danger)" }} role="alert">{error}</p>}
    </div>
  );
}
