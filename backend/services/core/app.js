// services/core/app.js
import express from 'express';
import cors from 'cors';
import placeRouter from './routers/placeRouter.js';
import userRouter from './routers/userRouter.js';
import eventRouter from './routers/eventRouter.js';
import locationRouter from './routers/locationRouter.js';
import { logError, normalizeJsonApiResponse, requestLogger, requestLogContext } from '/opt/nodejs/index.js';

const app = express();
const allowedOrigins = [process.env.FRONTEND_ORIGIN, 'http://localhost:5173'].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(requestLogger('core'));
app.use(normalizeJsonApiResponse);
app.use(express.json());
app.use('/api/place', placeRouter);
app.use('/api/user', userRouter);
app.use('/api/event', eventRouter);
app.use('/api/location', locationRouter);
app.use((req, res) => {
  res.status(404).json({ error: 'ไม่พบเส้นทาง API ที่ร้องขอ' });
});
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) && error.status >= 400 ? error.status : 500;
  if (status >= 500) {
    logError('Unhandled core API error', error, requestLogContext(req));
  }
  return res.status(status).json({
    error: status >= 500 ? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองอีกครั้งภายหลัง' : 'คำขอไม่ถูกต้อง'
  });
});

export default app;