import { NextResponse } from "next/server";
import { getEvent } from "@/lib/eduadmin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { formatCompactDateRange } from "@/lib/format";
import type { BookingCreateRequest } from "@/types/booking";

const API_URL = process.env.EDUADMIN_API_BASE ?? "https://api.eduadmin.se";
const API_USER = process.env.EDUADMIN_USERNAME ?? "";
const API_PASS = process.env.EDUADMIN_PASSWORD ?? "";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      username: API_USER,
      password: API_PASS,
    }),
  });
  if (!res.ok) throw new Error(`EduAdmin auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 3600) * 1000;
  return cachedToken!;
}

export async function POST(request: Request) {
  try {
    const body: BookingCreateRequest = await request.json();

    // 1. Verify event
    const eventData = await getEvent(body.eventId);
    if (!eventData) {
      return NextResponse.json({ error: "Kursen hittades inte" }, { status: 404 });
    }
    if (eventData.eventCard.isFullyBooked) {
      return NextResponse.json({ error: "Kursen är fullbokad" }, { status: 409 });
    }
    if (body.participants.length > eventData.eventCard.spotsLeft) {
      return NextResponse.json(
        { error: `Endast ${eventData.eventCard.spotsLeft} platser kvar` },
        { status: 409 },
      );
    }

    // 2. Build EduAdmin booking via REST API (POST /v1/Booking)
    const isCompany = body.customerType === "company";
    const contactEmail = isCompany ? body.company!.contactEmail : body.private!.email;
    const contactName = isCompany
      ? `${body.company!.contactFirstName} ${body.company!.contactLastName}`
      : `${body.private!.firstName} ${body.private!.lastName}`;

    const eduBooking: Record<string, unknown> = {
      EventId: body.eventId,
      PaymentMethodId: body.paymentMethod === "invoice" ? 1 : 2,
      Customer: isCompany
        ? {
            CustomerName: body.company!.companyName,
            OrganisationNumber: body.company!.organizationNumber,
            Address: body.company!.streetAddress,
            Zip: body.company!.postalCode,
            City: body.company!.city,
            Email: contactEmail,
          }
        : {
            CustomerName: `${body.private!.firstName} ${body.private!.lastName}`,
            Address: body.private!.streetAddress,
            Zip: body.private!.postalCode,
            City: body.private!.city,
            Email: body.private!.email,
          },
      ContactPerson: {
        FirstName: isCompany ? body.company!.contactFirstName : body.private!.firstName,
        LastName: isCompany ? body.company!.contactLastName : body.private!.lastName,
        Email: contactEmail,
        Phone: isCompany ? body.company!.contactPhone : body.private!.phone,
      },
      Participants: body.participants.map((p) => ({
        FirstName: p.firstName,
        LastName: p.lastName,
        Email: p.email,
        Phone: p.phone,
      })),
      SendConfirmationEmail: {
        SendToCustomerContact: true,
        SendToParticipants: true,
      },
    };

    // 3. POST to EduAdmin REST API
    const token = await getToken();
    const eduRes = await fetch(`${API_URL}/v1/Booking`, {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eduBooking),
    });

    if (!eduRes.ok) {
      const errorText = await eduRes.text();
      console.error("EduAdmin booking failed:", eduRes.status, errorText);
      return NextResponse.json(
        { error: `EduAdmin: ${errorText || eduRes.statusText}` },
        { status: 500 },
      );
    }

    const eduResult = await eduRes.json();
    console.log("EduAdmin booking created:", eduResult.BookingId);

    // 4. Save in Supabase too (for our dashboard)
    let userId: string | null = null;
    let eduCustomerId = 0;

    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      const supabaseAdmin = createSupabaseAdmin();
      const { data: { user } } = await supabaseAdmin.auth.getUser(
        authHeader.replace("Bearer ", ""),
      );
      if (user) {
        userId = user.id;
        const { data: membership } = await supabaseAdmin
          .from("company_memberships")
          .select("edu_customer_id")
          .eq("user_id", user.id)
          .limit(1)
          .single();
        eduCustomerId = membership?.edu_customer_id ?? 0;
      }
    }

    const supabaseAdmin = createSupabaseAdmin();
    const unitPrice = eventData.eventCard.lowestPrice ?? 0;

    await supabaseAdmin.from("bookings").insert({
      user_id: userId,
      edu_customer_id: eduCustomerId || eduResult.CustomerId,
      event_id: body.eventId,
      course_name: eventData.eventCard.courseName,
      event_date: formatCompactDateRange(eventData.eventCard.startDate, eventData.eventCard.endDate),
      event_city: eventData.eventCard.city,
      customer_type: body.customerType,
      company_name: isCompany ? body.company!.companyName : contactName,
      org_number: isCompany ? body.company!.organizationNumber : null,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: isCompany ? body.company!.contactPhone : body.private!.phone,
      payment_method: body.paymentMethod,
      participants: body.participants,
      total_price_ex_vat: eduResult.TotalPriceExVat ?? unitPrice * body.participants.length,
      booking_number: String(eduResult.BookingId),
      status: "confirmed",
    });

    return NextResponse.json({
      success: true,
      bookingId: eduResult.BookingId,
      bookingNumber: String(eduResult.BookingId),
      totalPriceExVat: eduResult.TotalPriceExVat,
      totalPriceIncVat: eduResult.TotalPriceIncVat,
    });
  } catch (error) {
    console.error("Booking creation failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Bokningen kunde inte genomföras. Försök igen.",
      },
      { status: 500 },
    );
  }
}
