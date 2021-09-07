// import { Request, RequestHandler } from 'express';

import Joi from 'joi';

export const postInteropSchema = Joi.object().keys({
  action: Joi.string().required(),
});
