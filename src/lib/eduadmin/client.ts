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
 * Path should start with `/v1/odata/...`
 */
export async function eduAdminFetch<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const token = await getToken();
  const url = new URL(path, API_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `bearer ${token}` },
      next: { revalidate: 0 },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`EduAdmin ${path}: ${res.status} ${res.statusText}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}
