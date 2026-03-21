/* ─── EduAdmin API response types ─── */

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
  StartTime?: string;
  EndTime?: string;
  MaxParticipantNumber: number;
  NumberOfBookedParticipants: number;
  LastApplicationDate: string;
  StatusText: string;
  HasPublicPriceName: boolean;
  CategoryName?: string;
  PriceNames?: EventPriceName[];
  Cancelled?: boolean;
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

export interface ODataResponse<T> {
  value: T[];
  "@odata.count"?: number;
}

export interface PriceOption {
  priceNameId: number;
  name: string;
  price: number;
  priceIncVat: number;
}

/** Flattened event used by the frontend */
export interface EventCard {
  eventId: number;
  courseTemplateId: number;
  courseName: string;
  categoryName: string;
  city: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  spotsLeft: number;
  maxParticipants: number;
  bookedParticipants: number;
  isFullyBooked: boolean;
  lowestPrice: number | null;
  lowestPriceIncVat: number | null;
  cancelled: boolean;
  priceOptions: PriceOption[];
}
