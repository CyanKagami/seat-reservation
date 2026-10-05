// src/lib/api.js
import { PUBLIC_API_URL } from '$env/static/public';
import { clearToken, getToken } from '$lib/scripts/auth';

export async function apiFetch(fetchFunction: typeof fetch, path:string, options:RequestInit = {}) {
  const token = getToken();

  const res = await fetchFunction(`${PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json'
    }
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login?error=session_expired';
  }

  return res;
}