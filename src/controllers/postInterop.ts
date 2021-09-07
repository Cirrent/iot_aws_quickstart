import { Request, RequestHandler } from 'express';
import Joi from 'joi';

import { requestMiddleware } from '../middleware/request';

const postInteropSchema = Joi.object().keys({
  action: Joi.string().valid('status', 'provision', 'message').required(),
  certs: Joi.when('action', {
    is: 'provision',
    then: Joi.array().required(),
  }),
  fingerprint: Joi.when('action', {
    is: 'message',
    then: Joi.string().required(),
  }),
});

const post: RequestHandler = async (req: Request<{}, {}, any>, res) => {
  const { action } = req.body;

  res.send({
    message: 'Saved',
    action,
  });
};

export default requestMiddleware(post, {
  validation: { body: postInteropSchema },
});
