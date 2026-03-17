"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { TrashIcon } from "@/components/icons";
import type { BookingStep1Data } from "@/lib/validation";

interface ParticipantFormProps {
  index: number;
  register: UseFormRegister<BookingStep1Data>;
  errors: FieldErrors<BookingStep1Data>;
  onRemove?: () => void;
  showPrimaryContact: boolean;
}

export function ParticipantForm({
  index,
  register,
  errors,
  onRemove,
  showPrimaryContact,
}: ParticipantFormProps) {
  const participantErrors = errors.participants?.[index];

  return (
    <div
      className="rounded-lg border p-5"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h4
          className="text-sm font-semibold"
          style={{ color: "var(--slate-deep)" }}
        >
          Deltagare {index + 1}
        </h4>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-xs transition-colors"
            style={{ color: "var(--danger)" }}
          >
            <TrashIcon />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup
          label="Förnamn"
          error={participantErrors?.firstName?.message}
        >
          <input
            {...register(`participants.${index}.firstName`)}
            placeholder="Anna"
            className="form-input"
          />
        </FieldGroup>
        <FieldGroup
          label="Efternamn"
          error={participantErrors?.lastName?.message}
        >
          <input
            {...register(`participants.${index}.lastName`)}
            placeholder="Svensson"
            className="form-input"
          />
        </FieldGroup>
        <FieldGroup
          label="E-post"
          error={participantErrors?.email?.message}
        >
          <input
            type="email"
            {...register(`participants.${index}.email`)}
            placeholder="anna@foretag.se"
            className="form-input"
          />
        </FieldGroup>
        <FieldGroup
          label="Telefon"
          error={participantErrors?.phone?.message}
        >
          <input
            type="tel"
            {...register(`participants.${index}.phone`)}
            placeholder="070-123 45 67"
            className="form-input"
          />
        </FieldGroup>
      </div>

      {showPrimaryContact && (
        <label className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--slate-light)" }}>
          <input
            type="checkbox"
            {...register(`participants.${index}.isPrimaryContact`)}
            className="accent-[var(--frost)]"
          />
          Primär kontaktperson
        </label>
      )}
    </div>
  );
}

function FieldGroup({
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
        <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
