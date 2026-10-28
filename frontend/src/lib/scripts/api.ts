// src/lib/api.js
import { PUBLIC_API_URL } from '$env/static/public';
import { clearToken, getToken, saveToken } from '$lib/scripts/auth';
import { userStore } from '$lib/store/auth.svelte';
import { alertModal } from '$lib/store/alert.svelte';
import type { User } from '$lib/type/user';

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false;
  return (
    'googleId' in value && typeof value.googleId === 'string' &&
    'email' in value && typeof value.email === 'string' &&
    'name' in value && typeof value.name === 'string' &&
    'picture' in value && typeof value.picture === 'string' &&
    'role' in value && typeof value.role === 'string'
  );
}

async function refreshUserAfterRoleChange(fetchFunction: typeof fetch): Promise<string> {
  const token = getToken();
  if (!token) {
    userStore.setUser(null);
    throw new Error('ไม่มีเซสชันสำหรับอัปเดตสิทธิ์ กรุณาเข้าสู่ระบบอีกครั้ง');
  }

  const response = await fetchFunction(`${PUBLIC_API_URL}/auth/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.status === 401) {
    clearToken();
    userStore.setUser(null);
    window.location.href = '/login?error=session_expired';
    throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
  }
  if (!response.ok) {
    throw new Error(`ไม่สามารถอัปเดตข้อมูลสิทธิ์ได้ (${response.status})`);
  }

  const data: unknown = await response.json();
  if (
    typeof data !== 'object' ||
    data === null ||
    !('body' in data) ||
    !isUser(data.body) ||
    !('token' in data) ||
    typeof data.token !== 'string' ||
    !data.token
  ) {
    throw new Error('ข้อมูลผู้ใช้หรือโทเคนที่อัปเดตไม่ถูกต้อง');
  }

  saveToken(data.token);
  userStore.setUser(data.body);
  return data.token;
}

export async function apiFetch(path:string, options:RequestInit = {}, fetchFunction?: typeof fetch) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const fetcher = fetchFunction || fetch;
  let res = await fetcher(`${PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' })
      // for FormData: leave Content-Type unset entirely so the
      // browser can add its own multipart boundary automatically
    }
  });

  if (res.status === 403) {
    const data = await res.clone().json().catch(() => null);
    if (data?.code === 'ROLE_CHANGED') {
      let refreshedToken: string;
      try {
        refreshedToken = await refreshUserAfterRoleChange(fetcher);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        alertModal.failure(
          'อัปเดตสิทธิ์ไม่สำเร็จ',
          `ตรวจพบว่าบทบาทของคุณมีการเปลี่ยนแปลง แต่ไม่สามารถโหลดข้อมูลล่าสุดได้: ${message}`
        );
        return res;
      }

      alertModal.warning(
        'สิทธิ์การใช้งานมีการเปลี่ยนแปลง',
        'อัปเดตบทบาทของคุณแล้ว ระบบกำลังดำเนินการคำขออีกครั้งด้วยสิทธิ์ปัจจุบัน'
      );
      res = await fetcher(`${PUBLIC_API_URL}${path}`, {
        ...options,
        headers: {
          ...(options.headers ?? {}),
          Authorization: `Bearer ${refreshedToken}`,
          ...(isFormData ? {} : { 'Content-Type': 'application/json' })
        }
      });
    }
  }

  if (res.status === 401) {
    clearToken();
    userStore.setUser(null);
    window.location.href = '/login?error=session_expired';
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