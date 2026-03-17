/* ─── Booking flow types ─── */

export type CustomerType = "company" | "private";
export type PaymentMethod = "card" | "invoice";

export interface Participant {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isPrimaryContact: boolean;
}

export interface CompanyInfo {
  organizationNumber: string;
  companyName: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
}

export interface PrivateInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  streetAddress: string;
  postalCode: string;
  city: string;
}

export interface BookingFormData {
  customerType: CustomerType;
  paymentMethod: PaymentMethod;
  company?: CompanyInfo;
  private?: PrivateInfo;
  participants: Participant[];
  acceptTerms: boolean;
}

export interface BookingCreateRequest {
  eventId: number;
  customerType: CustomerType;
  paymentMethod: PaymentMethod;
  company?: CompanyInfo;
  private?: PrivateInfo;
  participants: Participant[];
}

export interface BookingCreateResponse {
  success: boolean;
  bookingId?: number;
  bookingNumber?: string;
  redirectUrl?: string;
  magicLinkToken?: string;
  error?: string;
}
