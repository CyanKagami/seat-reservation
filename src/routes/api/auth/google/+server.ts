// src/routes/api/auth/google/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';

const CLIENT_ID = '105840083664-qflud4d4d32sqo6fp27d57v7rm6pd0m3.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { token } = await request.json();
    const ticket = await client.verifyIdToken({ idToken: token, audience: CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload) return json({ success: false }, { status: 401 });

    const user = {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? '',
      picture: payload.picture ?? ''
    };

    // 1. ฝากข้อมูล User ไว้ใน Cookie (เข้ารหัส/แปลงเป็น JSON String)
    cookies.set('user_session', JSON.stringify(user), {
      path: '/',
      httpOnly: true, // ป้องกัน XSS
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 // หมดอายุใน 1 วัน
    });

    // 2. ส่ง response บอก Frontend ว่าให้ไปหน้าไหนต่อ
    return json({ success: true, redirectTo: '/', user });

  } catch (error) {
    return json({ success: false, message: 'Invalid token' }, { status: 401 });
  }
};