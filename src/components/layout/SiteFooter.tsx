import { SnowflakeIcon } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer
      className="border-t"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--card-bg)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <SnowflakeIcon className="h-4 w-4 opacity-40" />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--slate-light)" }}
          >
            Kylutbildningen
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--slate-light)" }}>
          &copy; {new Date().getFullYear()} Kylutbildningen i Göteborg AB. Alla
          rättigheter förbehållna.
        </p>
      </div>
    </footer>
  );
}
