// src/routes/api/auth/google/callback/+server.ts
// GET /api/auth/google/callback - exchange code, upsert user, issue JWT
import { redirect, type RequestHandler } from '@sveltejs/kit';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import { addUser, fetchUser } from '$lib/scripts/server/dynamo';
import type { User } from '$lib/type/user';

const adminEmails = (env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const GET: RequestHandler = async ({ url }) => {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    redirect(303, '/login?error=google_auth_failed');
  }

  const oauth2Client = new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${url.origin}/api/auth/google/callback`
  );

  // redirect() works by throwing, so it must not be called inside the try
  // block (the catch would swallow it and send everyone to auth_failed).
  // Decide the destination inside, redirect once at the end.
  let destination: string;

  try {
    const { tokens } = await oauth2Client.getToken(code);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email_verified) {
      destination = '/login?error=unverified_email';
    } else {
      let user = (await fetchUser(payload.email!)) as User | null;

      if (!user) {
        user = {
          googleId: payload.sub,
          email: payload.email ?? '',
          name: payload.name ?? '',
          picture: payload.picture ?? '',
          role: adminEmails.includes(payload.email ?? '') ? 'admin' : 'guest'
        } as User;
        await addUser(user);
      }

      const token = jwt.sign(
        {
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role
        },
        env.JWT_SECRET!,
        { expiresIn: '1d' }
      );

      // Same flow the frontend already uses: token in the URL fragment,
      // picked up and stored by /auth/callback.
      destination = `/auth/callback#token=${token}`;
    }
  } catch (err) {
    console.error('OAuth Callback Error:', err);
    destination = '/login?error=auth_failed';
  }

  redirect(303, destination);
};