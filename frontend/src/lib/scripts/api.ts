// src/lib/api.js
import { PUBLIC_API_URL } from '$env/static/public';
import { clearToken, getToken } from '$lib/scripts/auth';

export async function apiFetch(path:string, options:RequestInit = {}, fetchFunction?: typeof fetch) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  console.log("Token:", token);
  const res = await (fetchFunction || fetch)(`${PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' })
      // for FormData: leave Content-Type unset entirely so the
      // browser can add its own multipart boundary automatically
    }
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login?error=session_expired';
  }

  return res;
}