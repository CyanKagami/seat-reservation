// services/core/app.js
import express from 'express';
import cors from 'cors';
import placeRouter from './routers/placeRouter.js';
import userRouter from './routers/userRouter.js';
import eventRouter from './routers/eventRouter.js';
import locationRouter from './routers/locationRouter.js';
import { requestLogger } from '/opt/nodejs/index.js';

const app = express();
const allowedOrigins = [process.env.FRONTEND_ORIGIN, 'http://localhost:5173'].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(requestLogger('core'));
app.use(express.json());
app.use('/api/place', placeRouter);
app.use('/api/user', userRouter);
app.use('/api/event', eventRouter);
app.use('/api/location', locationRouter);

export default app;