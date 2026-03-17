import { CheckIcon } from "@/components/icons";

const steps = [
  { num: 1, label: "E-post" },
  { num: 2, label: "Verifiera" },
  { num: 3, label: "Företag" },
  { num: 4, label: "Profil" },
];

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
              style={{
                backgroundColor:
                  currentStep > step.num
                    ? "var(--success)"
                    : currentStep === step.num
                      ? "var(--frost)"
                      : "var(--border)",
                color:
                  currentStep >= step.num ? "#fff" : "var(--slate-light)",
              }}
            >
              {currentStep > step.num ? <CheckIcon /> : step.num}
            </div>
            <span
              className="hidden text-sm font-medium sm:inline"
              style={{
                color:
                  currentStep === step.num
                    ? "var(--slate-deep)"
                    : "var(--slate-light)",
              }}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="h-px w-6 sm:w-10"
              style={{
                backgroundColor:
                  currentStep > step.num ? "var(--success)" : "var(--border)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
