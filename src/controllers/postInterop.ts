import { Request, RequestHandler } from 'express';
import Joi from 'joi';

import { requestMiddleware } from '../middleware/request';

export const postInteropSchema = Joi.object().keys({
  action: Joi.string().valid('status', 'provision', 'message').required(),
});

interface PostReqBody {
  action: string;
}

const post: RequestHandler = async (req: Request<{}, {}, PostReqBody>, res) => {
  const { action } = req.body;

  res.send({
    message: 'Saved',
    action,
  });
};

export default requestMiddleware(post, {
  validation: { body: postInteropSchema },
});
