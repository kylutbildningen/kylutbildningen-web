/** Format a date string to Swedish locale, e.g. "14 april 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Format a short date, e.g. "14 apr" */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
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

/** Format a compact date range for event rows, e.g. "14-15 apr 2026" */
export function formatCompactDateRange(
  startIso: string,
  endIso: string,
): string {
  const start = new Date(startIso);
  const end = new Date(endIso);

  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString("sv-SE", { month: "short", year: "numeric" })}`;
  }

  return `${start.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })}`;
}

/** Format time from ISO or HH:MM string, e.g. "09:00" */
export function formatTime(time: string): string {
  if (time.includes("T")) {
    return new Date(time).toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return time.slice(0, 5);
}

/** Format price in SEK, e.g. "8 900 kr" */
export function formatPrice(amount: number): string {
  return (
    amount.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr"
  );
}
