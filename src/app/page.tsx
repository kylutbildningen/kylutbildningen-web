import Link from "next/link";
import { SnowflakeIcon } from "@/components/icons";

export default function HomePage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      {/* Navigation */}
      <nav
        className="sticky top-0 z-40 border-b"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "rgba(248, 248, 246, 0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <SnowflakeIcon className="opacity-70" />
            <span
              className="text-lg font-semibold tracking-tight"
              style={{ color: "var(--slate-deep)" }}
            >
              Kylutbildningen
            </span>
          </Link>
          <div className="flex items-center gap-6 sm:gap-8">
            <Link
              href="/"
              className="hidden text-sm font-medium transition-colors sm:block"
              style={{ color: "var(--frost)" }}
            >
              Start
            </Link>
            <Link
              href="/kurser"
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--slate-light)" }}
            >
              Kursutbud
            </Link>
            <Link
              href="/kurser"
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--frost)" }}
            >
              Boka nu
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header
        className="relative overflow-hidden border-b"
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(160deg, var(--slate-deep) 0%, #1e3a4c 50%, var(--slate-mid) 100%)",
        }}
      >
        <div
          className="absolute -right-20 -top-20 h-96 w-96 rounded-full opacity-5"
          style={{
            background:
              "radial-gradient(circle, var(--frost) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -left-10 bottom-0 h-64 w-64 rounded-full opacity-5"
          style={{
            background:
              "radial-gradient(circle, var(--frost) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="max-w-2xl">
            <div className="animate-fade-up mb-4 flex items-center gap-2">
              <div
                className="h-px w-8"
                style={{ backgroundColor: "var(--frost)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--frost)" }}
              >
                Certifierade utbildningar
              </span>
            </div>
            <h1
              className="animate-fade-up stagger-1 text-4xl leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Boka din
              <br />
              kylutbildning
            </h1>
            <p
              className="animate-fade-up stagger-2 mt-6 max-w-lg text-base leading-relaxed sm:text-lg"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              Professionella utbildningar inom kylteknik, köldmediehantering och
              F-gasförordningen. Certifiera dig och ditt team med branschens
              mest erfarna utbildare.
            </p>
            <div className="animate-fade-up stagger-3 mt-10 flex flex-wrap gap-4">
              <Link
                href="/kurser"
                className="rounded-lg px-8 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
                }}
              >
                Se kommande kurser
              </Link>
              <a
                href="#om-oss"
                className="rounded-lg border border-white/20 px-8 py-3.5 text-sm font-medium text-white/70 transition-all hover:border-white/40 hover:text-white"
              >
                Läs mer
              </a>
            </div>
            <div className="animate-fade-up stagger-4 mt-10 flex flex-wrap items-center gap-8">
              {["INCERT-certifierade", "Små grupper", "Teori & praktik"].map(
                (label) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ backgroundColor: "rgba(8, 145, 178, 0.2)" }}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: "var(--frost)" }}
                      />
                    </div>
                    <span className="text-sm text-white/50">{label}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Info sections */}
      <section id="om-oss" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12">
          <h2
            className="text-3xl tracking-tight sm:text-4xl"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--slate-deep)",
            }}
          >
            Varför Kylutbildningen?
          </h2>
          <p
            className="mt-3 max-w-lg text-base leading-relaxed"
            style={{ color: "var(--slate-light)" }}
          >
            Vi erbjuder branschens mest kvalificerade utbildningar med
            erfarna instruktörer och moderna lokaler.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Certifierade utbildningar",
              desc: "Alla våra utbildningar är godkända av INCERT och följer gällande regelverk och EU-förordningar.",
            },
            {
              title: "Erfarna instruktörer",
              desc: "Våra utbildare har mångårig erfarenhet från kylbranschen och håller sig uppdaterade med de senaste teknikerna.",
            },
            {
              title: "Teori & praktik",
              desc: "En kombination av teoretisk kunskap och praktiska övningar ger dig de bästa förutsättningarna.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border bg-white p-8"
              style={{ borderColor: "var(--border)" }}
            >
              <h3
                className="mb-3 text-lg"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--slate-deep)",
                }}
              >
                {item.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--slate-light)" }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="border-t"
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(160deg, var(--slate-deep) 0%, #1e3a4c 100%)",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2
            className="text-3xl tracking-tight text-white sm:text-4xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Redo att boka?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/60">
            Se alla kommande kurstillfällen och boka din plats direkt online.
          </p>
          <Link
            href="/kurser"
            className="mt-8 inline-block rounded-lg px-10 py-4 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{
              background:
                "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
            }}
          >
            Se kurskatalogen
          </Link>
        </div>
      </section>

      {/* Footer */}
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
            &copy; {new Date().getFullYear()} Kylutbildningen i Göteborg AB.
            Alla rättigheter förbehållna.
          </p>
        </div>
      </footer>
    </div>
  );
}
