import serverless from 'serverless-http';
import app from './app.js';

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  console.log('HANDLER INVOKED', JSON.stringify(event));
  return serverlessHandler(event, context);
};