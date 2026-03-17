"use client";

import type { UseFormRegister, UseFormWatch } from "react-hook-form";
import { CreditCardIcon, FileTextIcon } from "@/components/icons";
import type { BookingStep1Data } from "@/lib/validation";

interface PaymentSelectorProps {
  register: UseFormRegister<BookingStep1Data>;
  watch: UseFormWatch<BookingStep1Data>;
  isCompany: boolean;
}

export function PaymentSelector({
  register,
  watch,
  isCompany,
}: PaymentSelectorProps) {
  const selected = watch("paymentMethod");

  return (
    <div>
      <label
        className="mb-3 block text-sm font-semibold"
        style={{ color: "var(--slate-deep)" }}
      >
        Betalningsmetod
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label
          className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all"
          style={{
            borderColor:
              selected === "card" ? "var(--frost)" : "var(--border)",
            backgroundColor:
              selected === "card" ? "var(--frost-light)" : "transparent",
          }}
        >
          <input
            type="radio"
            value="card"
            {...register("paymentMethod")}
            className="accent-[var(--frost)]"
          />
          <CreditCardIcon />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--slate-deep)" }}
          >
            Betala med kort
          </span>
        </label>

        <label
          className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${
            !isCompany ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
          style={{
            borderColor:
              selected === "invoice" ? "var(--frost)" : "var(--border)",
            backgroundColor:
              selected === "invoice" ? "var(--frost-light)" : "transparent",
          }}
        >
          <input
            type="radio"
            value="invoice"
            disabled={!isCompany}
            {...register("paymentMethod")}
            className="accent-[var(--frost)]"
          />
          <FileTextIcon />
          <div>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--slate-deep)" }}
            >
              Faktura
            </span>
            {!isCompany && (
              <span className="block text-xs" style={{ color: "var(--slate-light)" }}>
                Endast för företag
              </span>
            )}
          </div>
        </label>
      </div>
    </div>
  );
}
