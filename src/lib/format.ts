/** Format a date string to Swedish locale, e.g. "14 april 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Format a date range, e.g. "14–15 april 2026" or "14 april – 3 maj 2026" */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);

  if (start.toDateString() === end.toDateString()) {
    return formatDate(startIso);
  }

  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString("sv-SE", { month: "long", year: "numeric" })}`;
  }

  return `${formatDate(startIso)} – ${formatDate(endIso)}`;
}

/** Format price in SEK, e.g. "8 900 kr" */
export function formatPrice(amount: number): string {
  return (
    amount.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr"
  );
}
