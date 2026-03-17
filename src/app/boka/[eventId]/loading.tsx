import { SiteHeader } from "@/components/layout/SiteHeader";

export default function Loading() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <SiteHeader />
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: "var(--frost)", borderTopColor: "transparent" }} />
        <span className="ml-3 text-sm" style={{ color: "var(--slate-light)" }}>
          Laddar bokningssida...
        </span>
      </div>
    </div>
  );
}
