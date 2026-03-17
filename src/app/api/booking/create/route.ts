import { NextResponse } from "next/server";
import { createBooking, addBookingParticipant, getEvent } from "@/lib/eduadmin";
import { fortnoxPreflight } from "@/lib/fortnox";
import { initSveaCheckout } from "@/lib/svea";
import type { BookingCreateRequest } from "@/types/booking";

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
        {
          error: `Endast ${remainingSpots} plats${remainingSpots !== 1 ? "er" : ""} kvar`,
        },
        { status: 409 },
      );
    }

    // 2. Fortnox preflight (if invoice)
    let fortnoxCustomerNumber: string | undefined;
    if (body.paymentMethod === "invoice" && body.company) {
      const contactEmail = body.company.contactEmail;
      fortnoxCustomerNumber = await fortnoxPreflight({
        organizationNumber: body.company.organizationNumber,
        companyName: body.company.companyName,
        streetAddress: body.company.streetAddress,
        postalCode: body.company.postalCode,
        city: body.company.city,
        email: contactEmail,
      });
    }

    // 3. Create booking in EduAdmin
    const customerName =
      body.customerType === "company"
        ? body.company!.companyName
        : `${body.private!.firstName} ${body.private!.lastName}`;
    const customerEmail =
      body.customerType === "company"
        ? body.company!.contactEmail
        : body.private!.email;

    const booking = await createBooking({
      eventId: body.eventId,
      customerName,
      customerEmail,
      invoiceReference: fortnoxCustomerNumber,
    });

    // 4. Add participants
    for (const participant of body.participants) {
      await addBookingParticipant({
        bookingId: booking.BookingId,
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
        phone: participant.phone,
      });
    }

    // 5. Handle payment
    if (body.paymentMethod === "card") {
      const unitPrice = eventData.eventCard.lowestPrice ?? 0;
      const totalExVat = unitPrice * body.participants.length;
      const totalIncVat = totalExVat * 1.25;

      const redirectUrl = await initSveaCheckout({
        bookingId: booking.BookingId,
        bookingNumber: booking.BookingNumber,
        totalAmountIncVat: totalIncVat,
        customerEmail,
        description: eventData.eventCard.courseName,
      });

      return NextResponse.json({
        success: true,
        bookingId: booking.BookingId,
        bookingNumber: booking.BookingNumber,
        redirectUrl,
      });
    }

    // 6. Invoice — return success directly
    // TODO: Create booking_token in Supabase and send magic link email via Resend
    return NextResponse.json({
      success: true,
      bookingId: booking.BookingId,
      bookingNumber: booking.BookingNumber,
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
