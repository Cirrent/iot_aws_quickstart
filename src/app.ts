import express, { json } from 'express';
import helmet from 'helmet';
import httpStatus from 'http-status';
import serverlessHttp from 'serverless-http';

const app = express();

app.use(json());
app.use(helmet());

app.post('/action', (_, res) =>
  res.json({
    msg: 'Hello World',
  })
);

app.use((_, res) => {
  res.sendStatus(httpStatus.NOT_FOUND);
});

export const handler = serverlessHttp(app);
