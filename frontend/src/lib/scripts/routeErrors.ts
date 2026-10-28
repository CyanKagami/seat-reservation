import { error } from '@sveltejs/kit';
import { ApiError } from '$lib/scripts/api';

export function throwRouteError(cause: unknown): never {
	if (cause instanceof ApiError) {
		if (cause.status === 403) error(403, 'คุณไม่มีสิทธิ์เข้าถึงเนื้อหานี้');
		if (cause.status === 404) error(404, 'ไม่พบเนื้อหาที่คุณกำลังค้นหา');
	}
	throw cause;
}

export async function withRouteErrors<T>(load: () => Promise<T>): Promise<T> {
	try {
		return await load();
	} catch (cause) {
		throwRouteError(cause);
	}
}

export async function requireSuccessfulResponse(response: Response, fallbackMessage: string) {
	if (response.ok) return;

	const body: unknown = await response.clone().json().catch(() => null);
	const message =
		typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
			? body.error
			: fallbackMessage;
	const code =
		typeof body === 'object' && body !== null && 'code' in body && typeof body.code === 'string'
			? body.code
			: undefined;
	throw new ApiError(message, response.status, code);
}
