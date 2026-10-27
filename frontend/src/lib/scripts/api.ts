// src/lib/api.js
import { PUBLIC_API_URL } from '$env/static/public';
import { clearToken, getToken } from '$lib/scripts/auth';
import { userStore } from '$lib/store/auth.svelte';
import { alertModal } from '$lib/store/alert.svelte';

async function refreshUserAfterRoleChange(fetchFunction: typeof fetch) {
  const token = getToken();
  if (!token) {
    userStore.setUser(null);
    return;
  }

  const response = await fetchFunction(`${PUBLIC_API_URL}/auth/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.status === 401) {
    clearToken();
    userStore.setUser(null);
    window.location.href = '/login?error=session_expired';
    return;
  }
  if (!response.ok) {
    throw new Error(`Failed to refresh user after role change (${response.status}).`);
  }

  const data = await response.json();
  if (!data.body) {
    throw new Error('Current user data is missing after role change.');
  }
  userStore.setUser(data.body);
}

export async function apiFetch(path:string, options:RequestInit = {}, fetchFunction?: typeof fetch) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const fetcher = fetchFunction || fetch;
  const res = await fetcher(`${PUBLIC_API_URL}${path}`, {
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
    userStore.setUser(null);
    window.location.href = '/login?error=session_expired';
  } else if (res.status === 403) {
    const data = await res.clone().json().catch(() => null);
    if (data?.code === 'ROLE_CHANGED') {
      try {
        await refreshUserAfterRoleChange(fetcher);
        alertModal.warning(
          'สิทธิ์การใช้งานมีการเปลี่ยนแปลง',
          'อัปเดตบทบาทของคุณแล้ว คำขอนี้ยังไม่ได้ดำเนินการ กรุณาตรวจสอบสิทธิ์และลองอีกครั้ง'
        );
      } catch {
        alertModal.failure(
          'อัปเดตสิทธิ์ไม่สำเร็จ',
          'ตรวจพบว่าบทบาทของคุณมีการเปลี่ยนแปลง แต่ไม่สามารถโหลดข้อมูลล่าสุดได้ กรุณาโหลดหน้าใหม่'
        );
      }
    }
  }

  return res;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}


// Success bodies look like { body: ... }, errors like { error, code? }.
export async function unwrap<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error ?? 'Request failed', res.status, data.code);
  }
  return data.body as T;
}

export async function apiFetchJson<T>(
  path: string,
  options: RequestInit = {},
  fetchFunction?: typeof fetch
): Promise<T> {
  return unwrap(await apiFetch(path, options, fetchFunction));
}