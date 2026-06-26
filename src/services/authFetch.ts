/**
 * Auth-aware fetch wrapper.
 * Automatically adds Authorization header and handles 401 (token expired).
 */

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('aishield_token')
  } catch { return null }
}

export function clearAuth() {
  try {
    localStorage.removeItem('aishield_token')
    localStorage.removeItem('aishield_user')
  } catch {}
}

export async function authFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(url, { ...options, headers })

    if (res.status === 401) {
      // Token expired or invalid — clear auth, dispatch will be handled by caller
      clearAuth()
      return { data: null, error: 'Token expired, please login again', status: 401 }
    }

    const json = await res.json()

    if (!res.ok) {
      return { data: null, error: json.error || 'Request failed', status: res.status }
    }

    return { data: json, error: null, status: res.status }
  } catch (e) {
    return { data: null, error: 'Network error', status: 0 }
  }
}
