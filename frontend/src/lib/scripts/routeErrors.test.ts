import { describe, expect, it } from 'vitest';
import { ApiError } from './api';
import { requireSuccessfulResponse, withRouteErrors } from './routeErrors';

describe('route error handling', () => {
	it.each([403, 404])('maps API status %s to a SvelteKit route error', async (status) => {
		await expect(
			withRouteErrors(async () => {
				throw new ApiError('API message', status);
			})
		).rejects.toMatchObject({ status });
	});

	it('preserves unexpected errors', async () => {
		const cause = new Error('unexpected');
		await expect(withRouteErrors(async () => { throw cause; })).rejects.toBe(cause);
	});

	it('maps failed raw API responses to route errors', async () => {
		const response = new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

		await expect(
			withRouteErrors(() => requireSuccessfulResponse(response, 'Request failed'))
		).rejects.toMatchObject({ status: 403 });
	});
});
