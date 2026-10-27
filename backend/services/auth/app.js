// services/auth/app.js
import express from 'express';
import cors from 'cors';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { addUser, fetchUser } from '/opt/nodejs/dynamo.js';
import { logError, requestLogger, requestLogContext } from '/opt/nodejs/logger.js';

const app = express();
const allowedOrigins = [process.env.FRONTEND_ORIGIN, 'http://localhost:5173'].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(requestLogger('auth'));
app.use(express.json());

const router = express.Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function getBaseUrl(req) {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${req.headers.host}`;
}

function getOAuthClient(req) {
  const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`;
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

// GET /api/auth/google — kick off the OAuth flow
router.get('/google', (req, res) => {
  const origin = req.query.origin || (req.headers.referer && new URL(req.headers.referer).origin) || '';
  const oauth2Client = getOAuthClient(req);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
    state: origin || undefined
  });
  res.redirect(authUrl);
});

// GET /api/auth/google/callback — exchange code, upsert user, issue JWT
router.get('/google/callback', async (req, res) => {
  const { code, error, state } = req.query;
  let frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  if (state && (state.startsWith('http://localhost') || state.startsWith('https://localhost'))) {
    frontendUrl = state;
  }

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

    // Look up by email — the users table hash key.
    let user = await fetchUser(payload.email);

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

    // Token goes in the URL fragment (#) — never reaches server/logs.
    return res.redirect(`${frontendUrl}/auth/callback#token=${signedToken}`);
  } catch (err) {
    logError('OAuth callback failed', err, requestLogContext(req));
    return res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
});

// GET /api/auth/me — verify JWT and return user info.
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ body: null });
  }

  try {
    const tokenUser = jwt.verify(token, process.env.JWT_SECRET);
    const user = await fetchUser(tokenUser.email);
    if (!user) return res.status(401).json({ body: null });
    return res.status(200).json({ body: user });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ body: null });
    }
    logError('Failed to load current user', err, requestLogContext(req));
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout — stateless; client deletes the token.
router.post('/logout', (req, res) => {
  res.status(200).json({ body: { message: 'Logged out successfully' } });
});

app.use('/api/auth', router);

export default app;
