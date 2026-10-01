/**
 * Fetch readable text from incert.se pages (HTML or PDF) for the chat
 * assistant's search_web tool. Only incert.se is allowed.
 */

import { extractText, getDocumentProxy } from "unpdf";

const ALLOWED_HOSTS = ["incert.se"];
const MAX_CHARS = 4_000;
const FETCH_TIMEOUT_MS = 10_000;

export function isAllowedIncertUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" &&
      ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`))
    );
  } catch {
    return false;
  }
}

function fetchIncert(url: string) {
  return fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Kylutbildningen-assistent)" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    // Allow Next/Vercel to cache for an hour — the content changes rarely
    next: { revalidate: 3600 },
  });
}

/** The price list is a regular web page (it used to be a yearly PDF). */
const PRICE_LIST_URL = "https://incert.se/prislista/";

function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|nav|header|footer)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/\s+/g, " ")
    .trim();
}

async function pdfToText(buffer: ArrayBuffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text.replace(/[ \t]+/g, " ").trim();
}

/** Return the part of `text` around the first query word, capped in length. */
function focusOnQuery(text: string, query: string): string {
  if (text.length <= MAX_CHARS) return text;
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const lower = text.toLowerCase();
  const hit = words.map((w) => lower.indexOf(w)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
  const start = hit === undefined ? 0 : Math.max(0, hit - 500);
  return text.slice(start, start + MAX_CHARS);
}

export async function fetchIncertText(url: string, query: string): Promise<string> {
  if (!isAllowedIncertUrl(url)) return "Sökning är bara tillåten på incert.se.";

  try {
    let res = await fetchIncert(url);

    // Outdated price-list link (e.g. an old PDF) → use the current page
    if (res.status === 404 && /prislista/i.test(url) && url !== PRICE_LIST_URL) {
      res = await fetchIncert(PRICE_LIST_URL);
    }
    if (!res.ok) return "Kunde inte läsa sidan.";

    const isPdf =
      res.headers.get("content-type")?.includes("pdf") || res.url.toLowerCase().endsWith(".pdf");
    const text = isPdf ? await pdfToText(await res.arrayBuffer()) : htmlToText(await res.text());

    return text ? focusOnQuery(text, query) : "Ingen information hittades.";
  } catch (err) {
    console.error("INCERT fetch error:", err);
    return "Kunde inte hämta information just nu.";
  }
}
