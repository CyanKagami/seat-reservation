// services/core/app.js
import express from 'express';
import placeRouter from './routers/placeRouter.js';
import userRouter from './routers/userRouter.js';

const app = express();
app.use(express.json());
app.use('/api/place', placeRouter);
app.use('/api/user', userRouter);

export default app;