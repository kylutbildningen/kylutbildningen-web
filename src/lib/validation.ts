import { z } from "zod";

/** Swedish org number Luhn check */
function validateOrgNumber(value: string): boolean {
  const clean = value.replace(/\D/g, "");
  if (clean.length !== 10) return false;

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let digit = parseInt(clean[i], 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/**
 * Validate a Swedish personnummer (YYYY-MM-DD-XXXX or YYYYMMDD-XXXX).
 * Checks format, date validity, and Luhn check digit.
 */
export function validatePersonnummer(value: string): boolean {
  const clean = value.replace(/\D/g, "");
  if (clean.length !== 12) return false;

  const year = parseInt(clean.substring(0, 4), 10);
  const month = parseInt(clean.substring(4, 6), 10);
  const day = parseInt(clean.substring(6, 8), 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return false;

  // Luhn check on the last 10 digits (YYMMDDXXXX)
  const luhnDigits = clean.substring(2);
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let digit = parseInt(luhnDigits[i], 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/**
 * Format a personnummer string to YYYY-MM-DD-XXXX.
 * Accepts various formats: YYYYMMDDXXXX, YYYYMMDD-XXXX, YYYY-MM-DD-XXXX, etc.
 * Returns the cleaned input if it can't be formatted.
 */
export function formatPersonnummer(value: string): string {
  const clean = value.replace(/\D/g, "");
  if (clean.length === 12) {
    return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}-${clean.substring(8)}`;
  }
  return value;
}

const participantSchema = z.object({
  firstName: z.string().min(1, "Förnamn krävs"),
  lastName: z.string().min(1, "Efternamn krävs"),
  email: z.string().email("Ogiltig e-postadress"),
  phone: z.string().min(1, "Telefon krävs"),
  civicRegistrationNumber: z.string().min(1, "Personnummer krävs").refine(
    (val) => validatePersonnummer(val),
    { message: "Ogiltigt personnummer (YYYY-MM-DD-XXXX)" }
  ),
  isPrimaryContact: z.boolean(),
  priceNameId: z.number().optional(),
});

const companySchema = z.object({
  organizationNumber: z.string(),
  companyName: z.string(),
  streetAddress: z.string(),
  postalCode: z.string(),
  city: z.string(),
  contactFirstName: z.string(),
  contactLastName: z.string(),
  contactEmail: z.string(),
  contactPhone: z.string(),
  // Fakturauppgifter
  invoiceEmail: z.string().optional(),
  invoiceReference: z.string().optional(),
  useAlternateInvoiceAddress: z.boolean().optional(),
  invoiceStreetAddress: z.string().optional(),
  invoicePostalCode: z.string().optional(),
  invoiceCity: z.string().optional(),
});

const privateSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  streetAddress: z.string(),
  postalCode: z.string(),
  city: z.string(),
});

export const bookingStep1Schema = z
  .object({
    customerType: z.enum(["company", "private"]),
    paymentMethod: z.enum(["card", "invoice"]),
    company: companySchema,
    private: privateSchema,
    participants: z.array(participantSchema).min(1, "Minst en deltagare krävs"),
  })
  .superRefine((data, ctx) => {
    if (data.customerType === "company") {
      if (!data.company.organizationNumber) {
        ctx.addIssue({ code: "custom", message: "Organisationsnummer krävs", path: ["company", "organizationNumber"] });
      } else if (!validateOrgNumber(data.company.organizationNumber)) {
        ctx.addIssue({ code: "custom", message: "Ogiltigt organisationsnummer", path: ["company", "organizationNumber"] });
      }
      if (!data.company.companyName) ctx.addIssue({ code: "custom", message: "Företagsnamn krävs", path: ["company", "companyName"] });
      if (!data.company.streetAddress) ctx.addIssue({ code: "custom", message: "Gatuadress krävs", path: ["company", "streetAddress"] });
      if (!data.company.postalCode) {
        ctx.addIssue({ code: "custom", message: "Postnummer krävs", path: ["company", "postalCode"] });
      } else if (!/^\d{3}\s?\d{2}$/.test(data.company.postalCode)) {
        ctx.addIssue({ code: "custom", message: "Ogiltigt postnummer", path: ["company", "postalCode"] });
      }
      if (!data.company.city) ctx.addIssue({ code: "custom", message: "Stad krävs", path: ["company", "city"] });
      if (!data.company.contactFirstName) ctx.addIssue({ code: "custom", message: "Förnamn krävs", path: ["company", "contactFirstName"] });
      if (!data.company.contactLastName) ctx.addIssue({ code: "custom", message: "Efternamn krävs", path: ["company", "contactLastName"] });
      if (!data.company.contactEmail) {
        ctx.addIssue({ code: "custom", message: "E-post krävs", path: ["company", "contactEmail"] });
      } else if (!z.string().email().safeParse(data.company.contactEmail).success) {
        ctx.addIssue({ code: "custom", message: "Ogiltig e-postadress", path: ["company", "contactEmail"] });
      }
      if (!data.company.contactPhone) ctx.addIssue({ code: "custom", message: "Telefon krävs", path: ["company", "contactPhone"] });
    }

    if (data.customerType === "private") {
      if (data.paymentMethod === "invoice") {
        ctx.addIssue({ code: "custom", message: "Faktura är endast tillgängligt för företag", path: ["paymentMethod"] });
      }
      if (!data.private.firstName) ctx.addIssue({ code: "custom", message: "Förnamn krävs", path: ["private", "firstName"] });
      if (!data.private.lastName) ctx.addIssue({ code: "custom", message: "Efternamn krävs", path: ["private", "lastName"] });
      if (!data.private.email) {
        ctx.addIssue({ code: "custom", message: "E-post krävs", path: ["private", "email"] });
      } else if (!z.string().email().safeParse(data.private.email).success) {
        ctx.addIssue({ code: "custom", message: "Ogiltig e-postadress", path: ["private", "email"] });
      }
      if (!data.private.phone) ctx.addIssue({ code: "custom", message: "Telefon krävs", path: ["private", "phone"] });
      if (!data.private.streetAddress) ctx.addIssue({ code: "custom", message: "Gatuadress krävs", path: ["private", "streetAddress"] });
      if (!data.private.postalCode) {
        ctx.addIssue({ code: "custom", message: "Postnummer krävs", path: ["private", "postalCode"] });
      } else if (!/^\d{3}\s?\d{2}$/.test(data.private.postalCode)) {
        ctx.addIssue({ code: "custom", message: "Ogiltigt postnummer", path: ["private", "postalCode"] });
      }
      if (!data.private.city) ctx.addIssue({ code: "custom", message: "Stad krävs", path: ["private", "city"] });
    }
  });

export type BookingStep1Data = z.infer<typeof bookingStep1Schema>;

export { participantSchema, companySchema, privateSchema };
