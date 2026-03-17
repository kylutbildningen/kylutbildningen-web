import { CheckIcon } from "@/components/icons";

interface VerificationResultProps {
  status: "verified" | "not_contact" | "not_found";
  companyName: string;
  contactName?: string;
  onContinue?: () => void;
}

export function VerificationResult({
  status,
  companyName,
  contactName,
  onContinue,
}: VerificationResultProps) {
  if (status === "verified") {
    return (
      <div
        className="rounded-lg border p-6 text-center"
        style={{
          borderColor: "var(--success)",
          backgroundColor: "#ecfdf5",
        }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--success)", color: "#fff" }}
        >
          <CheckIcon />
        </div>
        <h3
          className="mb-2 text-lg font-medium"
          style={{ color: "var(--slate-deep)" }}
        >
          Vi hittade dig!
        </h3>
        <p className="text-sm" style={{ color: "var(--slate-light)" }}>
          {contactName && (
            <>
              <strong style={{ color: "var(--slate-deep)" }}>
                {contactName}
              </strong>
              {" — "}
            </>
          )}
          du är registrerad som kontaktperson för{" "}
          <strong style={{ color: "var(--slate-deep)" }}>{companyName}</strong>.
        </p>
        {onContinue && (
          <button
            onClick={onContinue}
            className="mt-5 rounded-lg px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{
              background:
                "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
            }}
          >
            Fortsätt
          </button>
        )}
      </div>
    );
  }

  if (status === "not_contact") {
    return (
      <div
        className="rounded-lg border p-6"
        style={{
          borderColor: "var(--warning)",
          backgroundColor: "#fffbeb",
        }}
      >
        <h3
          className="mb-2 text-lg font-medium"
          style={{ color: "var(--slate-deep)" }}
        >
          Inte kontaktperson
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--slate-light)" }}>
          Du finns registrerad hos{" "}
          <strong style={{ color: "var(--slate-deep)" }}>{companyName}</strong>{" "}
          men inte som kontaktperson. Kontakta oss för att få behörighet att boka.
        </p>
        <a
          href="mailto:info@kylutbildningen.se?subject=Beh%C3%B6righet%20som%20kontaktperson"
          className="mt-4 inline-block text-sm font-medium underline"
          style={{ color: "var(--frost)" }}
        >
          Kontakta oss
        </a>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border p-6"
      style={{
        borderColor: "var(--danger)",
        backgroundColor: "#fef2f2",
      }}
    >
      <h3
        className="mb-2 text-lg font-medium"
        style={{ color: "var(--slate-deep)" }}
      >
        E-post hittades inte
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--slate-light)" }}>
        Vi kan inte hitta din e-post kopplad till{" "}
        <strong style={{ color: "var(--slate-deep)" }}>{companyName}</strong>.
        Om du nyligen blivit anställd, kontakta oss så lägger vi till dig.
      </p>
      <a
        href="mailto:info@kylutbildningen.se?subject=L%C3%A4gg%20till%20kontaktperson"
        className="mt-4 inline-block text-sm font-medium underline"
        style={{ color: "var(--frost)" }}
      >
        Kontakta oss
      </a>
    </div>
  );
}
