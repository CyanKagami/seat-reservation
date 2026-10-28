import { error, redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
	const { user } = await parent();

	if (!user) redirect(302, '/login');
	if (user.role !== 'admin' && user.role !== 'organizer') {
		error(403, 'คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการกิจกรรม');
	}

	return {};
};
