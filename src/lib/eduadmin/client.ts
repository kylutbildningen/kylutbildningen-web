/**
 * Shared EduAdmin API fetch helper.
 * Handles authentication and token caching.
 */

const API_URL = process.env.EDUADMIN_API_BASE ?? "https://api.eduadmin.se";
const API_USER = process.env.EDUADMIN_USERNAME ?? "";
const API_PASS = process.env.EDUADMIN_PASSWORD ?? "";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      username: API_USER,
      password: API_PASS,
    }),
  });

  if (!res.ok) {
    throw new Error(`EduAdmin auth failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 3600) * 1000;
  return cachedToken!;
}

/**
 * Authenticated fetch against the EduAdmin API.
 *
 * For GET requests: pass OData params as Record<string, string>.
 * For POST/PATCH/DELETE: include __method and __body in params.
 */
export async function eduAdminFetch<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const token = await getToken();
  const method = params?.__method ?? "GET";
  const body = params?.__body;
  const url = new URL(path, API_URL);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (k.startsWith("__")) continue;
      url.searchParams.set(k, v);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const headers: Record<string, string> = {
      Authorization: `bearer ${token}`,
    };
    if (body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body || undefined,
      next: method === "GET" ? { revalidate: 0 } : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`EduAdmin ${method} ${path}: ${res.status} ${text}`);
    }

    if (method === "DELETE" || res.status === 204) {
      return undefined as T;
    }

    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}
