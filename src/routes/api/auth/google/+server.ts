// src/routes/api/auth/google/+server.ts
import type { GoogleUser } from '$lib/type/googleUser';
import { json, type RequestHandler } from '@sveltejs/kit';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, NODE_ENV, GOOGLE_CLIENT_ID } from '$env/static/private';

export const GET: RequestHandler = async ({ request, cookies }) => {
  try {
        // Read cookie or Bearer token
        const token = request.headers.get('Authorization')?.split(" ")[1] || cookies.get('user_session') || "";

        // Verify the token signature
        const decoded = jwt.verify(token, JWT_SECRET);

        // Fetch user details from database using decoded.userId
        const user = decoded // Assuming you have a function to get user by ID
        return json({
            statusCode: 200,
            body: user
        });
    } catch (err) {
        return json({
            statusCode: 401,
            body: null
        });
    }
};

export const DELETE: RequestHandler = async ({ cookies }) => {
    cookies.delete('user_session', { path: '/' });
    return json({
        statusCode: 200,
        body: { message: 'Logged out successfully' }
    });
};