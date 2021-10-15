// import {
//   IoTClient,
//   RegisterCertificateWithoutCACommand,
// } from '@aws-sdk/client-iot';
import { X509Certificate } from 'crypto';
import { Request, RequestHandler } from 'express';
import Joi from 'joi';

import { requestMiddleware } from '../middleware/request';

//const client = new IoTClient({ region: process.env.AWS_REGION });

const postInteropSchema = Joi.object().keys({
  action: Joi.string().valid('status', 'provision', 'message').required(),
  certs: Joi.when('action', {
    is: 'provision',
    then: Joi.array().items(Joi.string().base64()).required(),
  }),
  fingerprint: Joi.when('action', {
    is: 'message',
    then: Joi.string().required(),
  }),
});

const post: RequestHandler = async (req: Request<{}, {}, any>, res) => {
  const { action } = req.body;

  if (action === 'provision') {
    const { certs } = req.body;

    for (const cert of certs) {
      const certBuf = Buffer.from(cert, 'base64');
      const x = new X509Certificate(certBuf);

      console.log(x);
    }
  }

  return res.send({
    message: 'Saved',
    action,
  });
};

// const createAndRegisterThing = async (cert: string): Promise<boolean> => {
//   const params = {
//     certificatePem: cert,
//     status: 'ENABLE',
//   };

//   const cmd = new RegisterCertificateWithoutCACommand(params);
//   const data = await client.send(cmd);

//   return true;
// };

export default requestMiddleware(post, {
  validation: { body: postInteropSchema },
});
