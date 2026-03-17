/**
 * EduAdmin API client — server-side only.
 *
 * Auth: POST /token  →  bearer token (valid ~2 weeks)
 * Data: OData v4 endpoints under /v1/odata/
 */

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
  // Expire 1 hour before actual expiry to be safe
  tokenExpiry = Date.now() + (data.expires_in - 3600) * 1000;
  return cachedToken!;
}

async function odata<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> {
  const token = await getToken();
  const url = new URL(`/v1/odata/${endpoint}`, API_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `bearer ${token}` },
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!res.ok) {
    throw new Error(
      `EduAdmin OData ${endpoint}: ${res.status} ${res.statusText}`,
    );
  }

  return res.json();
}

/* ─── Types ─── */
export interface CourseTemplate {
  CourseTemplateId: number;
  CourseName: string;
  CourseDescription: string;
  CourseDescriptionShort: string;
  CourseGoal: string;
  TargetGroup: string;
  Prerequisites: string;
  Days: number;
  StartTime: string;
  EndTime: string;
  ImageUrl: string;
  CategoryId: number;
  CategoryName: string;
  ShowOnWeb: boolean;
  MinParticipantNumber: number;
  MaxParticipantNumber: number;
  CourseLevelId: number;
  Events?: CourseEvent[];
  PriceNames?: CoursePriceName[];
  Subjects?: CourseSubject[];
}

export interface CourseEvent {
  EventId: number;
  CourseTemplateId: number;
  CourseName: string;
  EventName: string;
  City: string;
  StartDate: string;
  EndDate: string;
  MaxParticipantNumber: number;
  NumberOfBookedParticipants: number;
  LastApplicationDate: string;
  StatusText: string;
  HasPublicPriceName: boolean;
  PriceNames?: EventPriceName[];
}

export interface CoursePriceName {
  PriceNameId: number;
  PriceNameDescription: string;
  Price: number;
  PublicPriceName: boolean;
  PriceNameVat: number;
}

export interface EventPriceName {
  PriceNameId: number;
  PriceNameDescription: string;
  Price: number;
  PublicPriceName: boolean;
  DiscountPercent: number;
  MaxParticipantNumber: number;
  NumberOfParticipants: number;
  PriceNameVat: number;
}

export interface CourseSubject {
  SubjectId: number;
  SubjectName: string;
}

interface ODataResponse<T> {
  value: T[];
}

/* ─── Public API ─── */

/**
 * Fetch all course templates visible on web, with upcoming events and prices.
 */
export async function getCourseTemplates(): Promise<CourseTemplate[]> {
  const now = new Date().toISOString();
  const data = await odata<ODataResponse<CourseTemplate>>("CourseTemplates", {
    $filter: "ShowOnWeb eq true",
    $expand: `Events($filter=StartDate ge ${now};$orderby=StartDate asc;$expand=PriceNames),PriceNames,Subjects`,
    $orderby: "CourseName asc",
    $select:
      "CourseTemplateId,CourseName,CourseDescription,CourseDescriptionShort,CourseGoal,TargetGroup,Prerequisites,Days,StartTime,EndTime,ImageUrl,CategoryId,CategoryName,ShowOnWeb,MinParticipantNumber,MaxParticipantNumber",
  });
  return data.value;
}

/**
 * Fetch a single course template by ID with full details.
 */
export async function getCourseTemplate(
  id: number,
): Promise<CourseTemplate | null> {
  try {
    const data = await odata<CourseTemplate>(`CourseTemplates(${id})`, {
      $expand: `Events($filter=StartDate ge ${new Date().toISOString()};$orderby=StartDate asc;$expand=PriceNames),PriceNames,Subjects`,
    });
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetch upcoming events for a specific course template.
 */
export async function getEventsForCourse(
  courseTemplateId: number,
): Promise<CourseEvent[]> {
  const data = await odata<ODataResponse<CourseEvent>>("Events", {
    $filter: `CourseTemplateId eq ${courseTemplateId} and StartDate ge ${new Date().toISOString()}`,
    $orderby: "StartDate asc",
    $expand: "PriceNames",
    $select:
      "EventId,CourseTemplateId,CourseName,EventName,City,StartDate,EndDate,MaxParticipantNumber,NumberOfBookedParticipants,LastApplicationDate,StatusText,HasPublicPriceName",
  });
  return data.value;
}
