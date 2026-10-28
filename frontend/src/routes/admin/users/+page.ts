import { error } from '@sveltejs/kit';
import { apiFetchJson } from '$lib/scripts/api';
import type { User } from '$lib/type/user';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
  const requestedPage = Number(url.searchParams.get('page') ?? '1');
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  let cursorStack: (string | null)[] = [null];
  const serializedCursorStack = url.searchParams.get('cursors');
  if (serializedCursorStack) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(serializedCursorStack);
    } catch {
      error(400, 'ข้อมูลแบ่งหน้าผู้ใช้ไม่ถูกต้อง');
    }
    if (
      !Array.isArray(parsed) ||
      parsed.length < currentPage ||
      parsed.some((cursor) => cursor !== null && typeof cursor !== 'string')
    ) {
      error(400, 'ข้อมูลแบ่งหน้าผู้ใช้ไม่ถูกต้อง');
    }
    cursorStack = parsed;
  }
  const nextToken = cursorStack[currentPage - 1];
  const path = nextToken
    ? `/user?nextToken=${encodeURIComponent(nextToken)}`
    : '/user';

  return {
    users: await apiFetchJson<{ items: User[]; nextToken: string | null }>(path, { method: 'GET' }, fetch),
    currentPage,
    cursorStack
  };
};
