import compression from 'compression';
import express, { json, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import httpStatus from 'http-status';
import pino from 'pino-http';
import serverlessHttp from 'serverless-http';

import ApiError from './errors/ApiError';
import interop from './routes/interop';

const app = express();

const logger = pino();
const comp = compression();

app.use(logger);

app.use(comp);
app.use(json());
app.use(helmet());

app.get('/', (_, res) => res.sendStatus(httpStatus.OK));

app.use('/interop', interop);

app.use((err: ApiError, _: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.statusCode || 500).json({
    error: err.message,
  });
});

export const handler = serverlessHttp(app);
