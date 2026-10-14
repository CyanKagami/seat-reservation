import serverless from 'serverless-http';
import app from './app.js';

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  return serverlessHandler(event, context);
};