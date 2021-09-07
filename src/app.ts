import compression from 'compression';
import express, { json } from 'express';
import helmet from 'helmet';
import httpStatus from 'http-status';
import pino from 'pino-http';
import serverlessHttp from 'serverless-http';

const app = express();

const logger = pino();
const comp = compression();

app.use(logger);

app.use(comp);
app.use(json());
app.use(helmet());

app.get('/', (_, res) => res.sendStatus(httpStatus.OK));

app.post('/interop', (_, res) =>
  res.json({
    msg: 'Hello World',
  })
);

app.use((_, res) => {
  res.sendStatus(httpStatus.NOT_FOUND);
});

export const handler = serverlessHttp(app);
