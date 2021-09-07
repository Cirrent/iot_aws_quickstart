import { RequestHandler, Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import Joi from 'joi';

import ApiError from '../errors/ApiError';

const getMessageFromJoiError = (
  error: Joi.ValidationError
): string | undefined => {
  if (!error.details && error.message) {
    return error.message;
  }
  return error.details.map((details) => details.message).join(', ');
};

interface HandlerOptions {
  validation?: {
    body?: Joi.ObjectSchema;
  };
}

export const requestMiddleware =
  (handler: RequestHandler, options?: HandlerOptions): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (options?.validation?.body) {
      const { error } = options?.validation?.body.validate(req.body);
      if (error != null) {
        next(
          new ApiError(httpStatus.BAD_REQUEST, getMessageFromJoiError(error))
        );
        return;
      }
    }

    try {
      await handler(req, res, next);
      next();
    } catch (err) {
      next(err);
    }
  };

export default requestMiddleware;
