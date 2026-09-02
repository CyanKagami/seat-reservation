// src/routes/api/auth/google/callback/+server.ts
import { redirect, type RequestHandler } from '@sveltejs/kit';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from "uuid";

// Add CLIENT_SECRET to your environment variables (.env)
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, NODE_ENV } from '$env/static/private';
import { addData, addDataIfNotExists, addUser, fetchUser } from '$lib/scripts/dynamo';
import type { User } from '$lib/type/user';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    throw redirect(303, '/login?error=google_auth_failed');
  }

  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Verify the ID token returned by Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email_verified) {
      throw redirect(303, '/login?error=unverified_email');
    }
    const user: User = {
        googleId: payload.sub ?? '',
        email: payload.email ?? '',
        name: payload.name ?? '',
        picture: payload.picture ?? '',
        role: 'admin'
    };
    
    let existingUser = await fetchUser(user.googleId);
    if (!existingUser) {
      console.log("User not found in DynamoDB. Adding new user:", user);
      await addUser(user); // Store user data in DynamoDB
    }
    const signedToken = jwt.sign(user, JWT_SECRET, { expiresIn: '1d' });
    
        // 1. ฝากข้อมูล User ไว้ใน Cookie (เข้ารหัส/แปลงเป็น JSON String)
    cookies.set('user_session', signedToken, {
        path: '/',
        httpOnly: true, // ป้องกัน XSS
        sameSite: 'lax',
        secure: NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 // หมดอายุใน 1 วัน
    });

  } catch (err) {
    console.error('OAuth Callback Error:', err);
    throw redirect(303, '/login?error=auth_failed');
  }

  // Successfully authenticated -> Redirect to app home
  throw redirect(303, '/');
};