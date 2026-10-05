// services/auth/app.js
import express from 'express';
import cors from 'cors';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { addUser, fetchUser } from '/opt/nodejs/dynamo.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

const router = express.Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function getOAuthClient(req) {
  // req.originalUrl under API Gateway's {proxy+} still reflects the real path,
  // but the host/stage prefix needs reconstructing for the redirect URI.
  const redirectUri = `${process.env.API_BASE_URL}/api/auth/google/callback`;
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

// GET /api/auth/google — kick off the OAuth flow
router.get('/google', (req, res) => {
  const oauth2Client = getOAuthClient(req);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account'
  });
  res.redirect(authUrl);
});

// GET /api/auth/google/callback — exchange code, upsert user, issue JWT
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_ORIGIN;

  if (error || !code) {
    return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }

  const oauth2Client = getOAuthClient(req);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email_verified) {
      return res.redirect(`${frontendUrl}/login?error=unverified_email`);
    }
    console.log('OAuth Callback Payload:', payload);
    console.log('LocalStack URL:', process.env.AWS_LOCALSTACK_URL);
    let user = await fetchUser(payload.sub);

    if (!user) {
      user = {
        googleId: payload.sub,
        email: payload.email ?? '',
        name: payload.name ?? '',
        picture: payload.picture ?? '',
        role: ADMIN_EMAILS.includes(payload.email) ? 'admin' : 'guest'
      };
      await addUser(user);
    }

    const signedToken = jwt.sign(
      {
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Token goes in the URL fragment (#), not a query param or cookie:
    // fragments never reach the server/logs and work fine cross-origin
    // against an S3-hosted static frontend.
    return res.redirect(`${frontendUrl}/auth/callback#token=${signedToken}`);
  } catch (err) {
    console.error('OAuth Callback Error:', err);
    return res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
});

// GET /api/auth/me — client calls this to check/bootstrap the current session.
// This route is public at the gateway level (no Lambda authorizer on /api/auth/*),
// so it verifies the JWT itself.
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ body: null });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ body: user });
  } catch (err) {
    return res.status(401).json({ body: null });
  }
});

// POST /api/auth/logout — JWTs are stateless, so this is purely a client-side
// no-op endpoint for symmetry; the actual logout is deleting the token client-side.
router.post('/logout', (req, res) => {
  res.status(200).json({ body: { message: 'Logged out successfully' } });
});

app.use('/api/auth', router);

export default app;