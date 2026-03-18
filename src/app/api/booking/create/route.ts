import { NextResponse } from "next/server";
import { getEvent } from "@/lib/eduadmin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { sendBookingConfirmation } from "@/lib/email";
import { formatCompactDateRange } from "@/lib/format";
import type { BookingCreateRequest } from "@/types/booking";

function generateBookingNumber(): string {
  const prefix = "KYL";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function POST(request: Request) {
  try {
    const body: BookingCreateRequest = await request.json();

    // 1. Verify event still has spots
    const eventData = await getEvent(body.eventId);
    if (!eventData) {
      return NextResponse.json(
        { error: "Kursen hittades inte" },
        { status: 404 },
      );
    }

    if (eventData.eventCard.isFullyBooked) {
      return NextResponse.json(
        { error: "Kursen är fullbokad" },
        { status: 409 },
      );
    }

    const remainingSpots = eventData.eventCard.spotsLeft;
    if (body.participants.length > remainingSpots) {
      return NextResponse.json(
        { error: `Endast ${remainingSpots} plats${remainingSpots !== 1 ? "er" : ""} kvar` },
        { status: 409 },
      );
    }

    // 2. Build booking data
    const customerName =
      body.customerType === "company"
        ? body.company!.companyName
        : `${body.private!.firstName} ${body.private!.lastName}`;
    const contactEmail =
      body.customerType === "company"
        ? body.company!.contactEmail
        : body.private!.email;
    const contactName =
      body.customerType === "company"
        ? `${body.company!.contactFirstName} ${body.company!.contactLastName}`
        : `${body.private!.firstName} ${body.private!.lastName}`;
    const contactPhone =
      body.customerType === "company"
        ? body.company!.contactPhone
        : body.private!.phone;

    const unitPrice = eventData.eventCard.lowestPrice ?? 0;
    const totalPriceExVat = unitPrice * body.participants.length;
    const bookingNumber = generateBookingNumber();

    // 3. Get user from auth header
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

        // Get edu_customer_id from membership
        const { data: membership } = await supabaseAdmin
          .from("company_memberships")
          .select("edu_customer_id")
          .eq("user_id", user.id)
          .limit(1)
          .single();
        eduCustomerId = membership?.edu_customer_id ?? 0;
      }
    }

    // 4. Save booking in Supabase
    const supabaseAdmin = createSupabaseAdmin();
    const { data: booking, error: insertError } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: userId,
        edu_customer_id: eduCustomerId,
        event_id: body.eventId,
        course_name: eventData.eventCard.courseName,
        event_date: formatCompactDateRange(
          eventData.eventCard.startDate,
          eventData.eventCard.endDate,
        ),
        event_city: eventData.eventCard.city,
        customer_type: body.customerType,
        company_name: customerName,
        org_number:
          body.customerType === "company"
            ? body.company!.organizationNumber
            : null,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        payment_method: body.paymentMethod,
        participants: body.participants,
        total_price_ex_vat: totalPriceExVat,
        booking_number: bookingNumber,
        status: "confirmed",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Booking insert failed:", insertError);
      return NextResponse.json(
        { error: "Kunde inte spara bokningen: " + insertError.message },
        { status: 500 },
      );
    }

    // 5. Send confirmation emails
    const emailRecipients = new Set<string>();
    emailRecipients.add(contactEmail);
    for (const p of body.participants) {
      if (p.email) emailRecipients.add(p.email);
    }

    await sendBookingConfirmation(Array.from(emailRecipients), {
      bookingNumber,
      courseName: eventData.eventCard.courseName,
      eventDate: formatCompactDateRange(
        eventData.eventCard.startDate,
        eventData.eventCard.endDate,
      ),
      eventCity: eventData.eventCard.city || "",
      companyName: customerName,
      contactName,
      paymentMethod: body.paymentMethod,
      participants: body.participants,
      totalPriceExVat,
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingNumber,
    });
  } catch (error) {
    console.error("Booking creation failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Bokningen kunde inte genomföras. Försök igen.",
      },
      { status: 500 },
    );
  }
}
