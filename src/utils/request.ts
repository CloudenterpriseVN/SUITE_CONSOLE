const API_URL = import.meta.env.VITE_API_URL

const mockUrls = import.meta.glob<{ default: string }>("../mock/*.json", {
  query: "url",
  eager: true,
});

function getAccessTokenFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const cookies = document.cookie.split(';').map((c) => c.trim())
  for (const cookie of cookies) {
    if (!cookie) continue
    const [k, v] = cookie.split('=')
    if (k === 'access_token') return decodeURIComponent(v || '')
  }
  return undefined
}

export async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = API_URL
    ? `${API_URL}${path}`
    : mockUrls[`../mock${path}.json`]?.default;

  if (!API_URL) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  
  // Attach X-Access-Token header from cookie when present
  const token = getAccessTokenFromCookie()
  const headers = new Headers(options?.headers as HeadersInit)
  if (token) headers.set('X-Access-Token', token)

  const response = await fetch(url, { ...(options ?? {}), headers });
  return response.json() as T;
}

export async function requestWithFallback<T>(
  path: string,
  fallbackValue: T,
  options?: RequestInit
): Promise<T> {
  try {
    return await request<T>(path, options);
  } catch {
    return fallbackValue;
  }
}

export async function requestWithPost<P, T>(
  path: string,
  payload: P,
  options: RequestInit
): Promise<T> {
  const token = getAccessTokenFromCookie()
  const baseHeaders = new Headers(options?.headers as HeadersInit)
  if (!baseHeaders.has('Content-Type')) baseHeaders.set('Content-Type', 'application/json')
  if (token) baseHeaders.set('X-Access-Token', token)

  const opts: RequestInit = {
    ...(options ?? {}),
    method: 'POST',
    body: JSON.stringify(payload),
    headers: baseHeaders,
  }

  return await request<T>(path, opts)
}
