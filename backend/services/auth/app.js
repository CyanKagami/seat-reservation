import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const frontendOrigin = process.env.FRONTEND_ORIGIN;
const localstackUrl = process.env.AWS_LOCALSTACK_URL;
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(localstackUrl && { endpoint: localstackUrl, credentials: { accessKeyId: 'test', secretAccessKey: 'test' } })
}));
const app = express();
app.use(cors({ origin: frontendOrigin || true, credentials: true }));
app.use(express.json());

function envelope(res, body, status = 200) {
  res.status(status).json({ statusCode: status, body });
}

function sessionFromRequest(req) {
  const bearer = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  const cookie = req.get('cookie')?.match(/(?:^|;\s*)user_session=([^;]+)/)?.[1];
  return bearer || (cookie && decodeURIComponent(cookie));
}

function authenticate(req, res, next) {
  try {
    const token = sessionFromRequest(req);
    if (!token) return envelope(res, null, 401);
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { envelope(res, null, 401); }
}

function cookieOptions() {
  const crossSite = Boolean(frontendOrigin && !frontendOrigin.includes('localhost'));
  return { httpOnly: true, path: '/', sameSite: crossSite ? 'none' : 'lax', secure: crossSite, maxAge: 86_400_000 };
}

app.get('/api/auth/google', authenticate, (req, res) => envelope(res, req.user));
app.delete('/api/auth/google', (_req, res) => {
  res.clearCookie('user_session', { path: '/' });
  envelope(res, { message: 'Logged out successfully' });
});
app.get('/api/auth/google/callback', async (req, res) => {
  if (req.query.error || !req.query.code) return res.redirect(303, '/login?error=google_auth_failed');
  const callbackUrl = `${req.protocol}://${req.get('host')}${req.path}`;
  try {
    const oauth = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, callbackUrl);
    const { tokens } = await oauth.getToken(req.query.code);
    const ticket = await oauth.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const profile = ticket.getPayload();
    if (!profile?.email_verified) return res.redirect(303, '/login?error=unverified_email');
    const key = { googleId: profile.sub };
    let user = (await dynamo.send(new GetCommand({ TableName: 'users', Key: key }))).Item;
    if (!user) {
      user = { ...key, email: profile.email ?? '', name: profile.name ?? '', picture: profile.picture ?? '', role: 'admin' };
      await dynamo.send(new PutCommand({ TableName: 'users', Item: user }));
    }
    res.cookie('user_session', jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d' }), cookieOptions());
    res.redirect(303, frontendOrigin || '/');
  } catch (error) {
    console.error('OAuth callback failed', error);
    res.redirect(303, '/login?error=auth_failed');
  }
});

export default app;
