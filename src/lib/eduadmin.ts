/**
 * EduAdmin API client — server-side only.
 *
 * Auth: POST /token  →  bearer token (valid ~2 weeks)
 * Data: OData v4 endpoints under /v1/odata/
 */

import type {
  CourseTemplate,
  CourseEvent,
  EventCard,
  ODataResponse,
} from "@/types/eduadmin";

const API_URL = process.env.EDUADMIN_API_BASE ?? "https://api.eduadmin.se";
const API_USER = process.env.EDUADMIN_USERNAME ?? "";
const API_PASS = process.env.EDUADMIN_PASSWORD ?? "";

/* ─── Token cache ─── */
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

  if (!res.ok) {
    throw new Error(`EduAdmin auth failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 3600) * 1000;
  return cachedToken!;
}

async function odata<T>(
  endpoint: string,
  params?: Record<string, string>,
  revalidate = 300,
): Promise<T> {
  const token = await getToken();
  const url = new URL(`/v1/odata/${endpoint}`, API_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `bearer ${token}` },
      next: { revalidate },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(
        `EduAdmin OData ${endpoint}: ${res.status} ${res.statusText}`,
      );
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/* ─── Helpers ─── */

export function getSpotsLeft(event: CourseEvent): number {
  return event.MaxParticipantNumber - event.NumberOfBookedParticipants;
}

export function isFullyBooked(event: CourseEvent): boolean {
  return getSpotsLeft(event) <= 0;
}

export function getLowestPrice(
  priceNames?: Array<{ Price: number; PublicPriceName: boolean; PriceNameVat: number }>,
): { price: number; priceIncVat: number } | null {
  const prices = priceNames?.filter((p) => p.PublicPriceName) ?? [];
  if (prices.length === 0) return null;
  const cheapest = prices.reduce((a, b) => (a.Price < b.Price ? a : b));
  return {
    price: cheapest.Price,
    priceIncVat: cheapest.Price * (1 + cheapest.PriceNameVat / 100),
  };
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/** Convert a CourseEvent to a flat EventCard for the frontend */
export function toEventCard(
  event: CourseEvent,
  course?: CourseTemplate,
): EventCard {
  const priceInfo = getLowestPrice(event.PriceNames) ??
    (course ? getLowestPrice(course.PriceNames) : null);

  return {
    eventId: event.EventId,
    courseTemplateId: event.CourseTemplateId,
    courseName: event.CourseName || course?.CourseName || "",
    categoryName: event.CategoryName || course?.CategoryName || "",
    city: event.City || "",
    startDate: event.StartDate,
    endDate: event.EndDate,
    startTime: event.StartTime || course?.StartTime || "",
    endTime: event.EndTime || course?.EndTime || "",
    spotsLeft: getSpotsLeft(event),
    maxParticipants: event.MaxParticipantNumber,
    bookedParticipants: event.NumberOfBookedParticipants,
    isFullyBooked: isFullyBooked(event),
    lowestPrice: priceInfo?.price ?? null,
    lowestPriceIncVat: priceInfo?.priceIncVat ?? null,
    cancelled: event.Cancelled ?? false,
  };
}

/* ─── Public API ─── */

/**
 * Fetch all course templates visible on web, with upcoming events and prices.
 */
export async function getCourseTemplates(): Promise<CourseTemplate[]> {
  const now = new Date().toISOString();
  const data = await odata<ODataResponse<CourseTemplate>>(
    "CourseTemplates",
    {
      $filter: "ShowOnWeb eq true",
      $expand: `Events($filter=StartDate ge ${now};$orderby=StartDate asc;$expand=PriceNames),PriceNames,Subjects`,
      $orderby: "CourseName asc",
      $select:
        "CourseTemplateId,CourseName,CourseDescription,CourseDescriptionShort,CourseGoal,TargetGroup,Prerequisites,Days,StartTime,EndTime,ImageUrl,CategoryId,CategoryName,ShowOnWeb,MinParticipantNumber,MaxParticipantNumber",
    },
    60,
  );
  return data.value;
}

/**
 * Fetch a single course template by ID with full details.
 */
export async function getCourseTemplate(
  id: number,
): Promise<CourseTemplate | null> {
  try {
    const data = await odata<CourseTemplate>(
      `CourseTemplates(${id})`,
      {
        $expand: `Events($filter=StartDate ge ${new Date().toISOString()};$orderby=StartDate asc;$expand=PriceNames),PriceNames,Subjects`,
      },
      300,
    );
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetch all upcoming events across all courses, flattened into EventCard[].
 */
export async function getUpcomingEvents(): Promise<EventCard[]> {
  const courses = await getCourseTemplates();
  const events: EventCard[] = [];

  for (const course of courses) {
    for (const event of course.Events ?? []) {
      if (event.Cancelled) continue;
      events.push(toEventCard(event, course));
    }
  }

  events.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  return events;
}

/**
 * Fetch a single event by ID with full details.
 */
export async function getEvent(eventId: number): Promise<{
  event: CourseEvent;
  course: CourseTemplate;
  eventCard: EventCard;
} | null> {
  try {
    const courses = await getCourseTemplates();
    for (const course of courses) {
      const event = course.Events?.find((e) => e.EventId === eventId);
      if (event) {
        return {
          event,
          course,
          eventCard: toEventCard(event, course),
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get unique cities from all upcoming events.
 */
export async function getUniqueCities(): Promise<string[]> {
  const events = await getUpcomingEvents();
  const cities = new Set(events.map((e) => e.city).filter(Boolean));
  return Array.from(cities).sort();
}

/**
 * Get unique category names from all upcoming events.
 */
export async function getUniqueCategories(): Promise<string[]> {
  const events = await getUpcomingEvents();
  const cats = new Set(events.map((e) => e.categoryName).filter(Boolean));
  return Array.from(cats).sort();
}

/* ─── Booking API ─── */

export async function createBooking(body: {
  eventId: number;
  customerName: string;
  customerEmail: string;
  invoiceReference?: string;
  paymentMethodId?: number;
}): Promise<{ BookingId: number; BookingNumber: string }> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/v1/odata/Bookings`, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      EventId: body.eventId,
      CustomerName: body.customerName,
      CustomerEmail: body.customerEmail,
      InvoiceReference: body.invoiceReference,
      PaymentMethodId: body.paymentMethodId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EduAdmin create booking failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function addBookingParticipant(body: {
  bookingId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/v1/odata/BookingParticipants`, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BookingId: body.bookingId,
      FirstName: body.firstName,
      LastName: body.lastName,
      Email: body.email,
      Phone: body.phone,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EduAdmin add participant failed: ${res.status} ${text}`);
  }
}
