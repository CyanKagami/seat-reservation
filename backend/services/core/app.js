// services/core/app.js
import express from 'express';
import cors from 'cors';
import placeRouter from './routers/placeRouter.js';
import userRouter from './routers/userRouter.js';
import eventRouter from './routers/eventRouter.js';
import locationRouter from './routers/locationRouter.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use('/api/place', placeRouter);
app.use('/api/user', userRouter);
app.use('/api/event', eventRouter);
app.use('/api/location', locationRouter);

export default app;