import { auth } from '@/lib/firebase'

const API_URL = import.meta.env.VITE_API_URL

const mockUrls = import.meta.glob<{ default: string }>("../mock/*.json", {
  query: "url",
  eager: true,
});

async function getAccessToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null

  try {
    return await user.getIdToken()
  } catch {
    return null
  }
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

  // Lấy token từ Firebase
  const token = await getAccessToken()
  const headers = new Headers(options?.headers as HeadersInit)
  if (token) {
    headers.set('X-Access-Token', token)
  }

  const response = await fetch(url, { ...(options ?? {}), headers });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    throw new Error('Unauthorized')
  }

  // Handle other errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
  }

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
  options?: RequestInit
): Promise<T> {
  const opts: RequestInit = {
    ...(options ?? {}),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    body: JSON.stringify(payload),
  }

  return await request<T>(path, opts)
}

export async function requestWithPatch<P, T>(
  path: string,
  payload: P,
  options?: RequestInit
): Promise<T> {
  const opts: RequestInit = {
    ...(options ?? {}),
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    body: JSON.stringify(payload),
  }

  return await request<T>(path, opts)
}

export async function requestWithDelete<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const opts: RequestInit = {
    ...(options ?? {}),
    method: 'DELETE',
  }

  return await request<T>(path, opts)
}
