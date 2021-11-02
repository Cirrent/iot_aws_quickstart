"use strict";

const { pki } = require("node-forge");
const Joi = require("joi");
const {
  IoTClient,
  RegisterCertificateWithoutCACommand,
  CreateThingCommand,
  AttachThingPrincipalCommand,
  DescribeEndpointCommand,
  AttachPolicyCommand,
  GetPolicyCommand,
} = require("@aws-sdk/client-iot");

const requestMiddleware = require("../middleware/request");
const { iotPolicy, baseTopic } = require("../vars");

const client = new IoTClient();

const postInteropSchema = Joi.object().keys({
  action: Joi.string().valid("status", "provision", "message").required(),
  certs: Joi.when("action", {
    is: "provision",
    then: Joi.array().items(
      Joi.object().keys({
        ref: Joi.string().required(),
        cert: Joi.string().base64().required(),
      })
    ),
  }),
});

async function post(req, res, next) {
  const { action } = req.body;
  let resp;

  switch (action) {
    case "provision": {
      const { certs } = req.body;

      resp = await provision(certs);
      break;
    }
    case "message": {
      resp = await message();
      break;
    }
    case "status": {
      resp = await status();
      break;
    }
  }

  res.send(resp);
}

async function status() {
  return {
    message: "Not yet implemented.",
    action: "status",
  };
}

async function message() {
  return {
    message: "Not yet implemented.",
    action: "message",
  };
}

async function provision(certs) {
  let resp = [];

  const endpoint = await getEndpoint();
  const policy = await getPolicy();

  for (const item of certs) {
    let certBuf;
    let parsedCert;

    try {
      certBuf = Buffer.from(item.cert, "base64");
      parsedCert = pki.certificateFromPem(certBuf.toString("ascii"), true);
    } catch (err) {
      resp.push({
        ref: item.ref,
        status: "ERROR",
        message: "Cannot decode certitifcate",
      });
      continue;
    }

    try {
      await createAndRegisterThing(
        certBuf.toString("ascii"),
        parsedCert.serialNumber,
        policy
      );

      resp.push({
        ref: item.ref,
        status: "SUCCESS",
        endpoint: endpoint,
        topic: baseTopic,
        policyApplied: policy,
      });
    } catch (err) {
      resp.push({
        ref: item.ref,
        status: "ERROR",
        message: "Failed creating and registering thing",
      });
      continue;
    }
  }

  return resp;
}

async function getEndpoint() {
  let resp;

  try {
    const depCmd = new DescribeEndpointCommand({
      endpointType: "iot:Data-ATS",
    });

    const depResp = await client.send(depCmd);
    resp = depResp.endpointAddress;
  } catch (err) {
    resp = null;
  }

  return resp;
}

async function getPolicy() {
  let resp = false;

  try {
    const policyCmd = new GetPolicyCommand({
      policyName: iotPolicy,
    });

    const policyResp = await client.send(policyCmd);
    if (policyResp.policyArn) resp = true;
  } catch (err) {
    resp = false;
  }

  return resp;
}

async function createAndRegisterThing(cert, serialNum, policy) {
  let certArn;
  let certId;
  try {
    const regCmd = new RegisterCertificateWithoutCACommand({
      certificatePem: cert,
      status: "ACTIVE",
    });

    const regResp = await client.send(regCmd);

    certArn = regResp.certificateArn;
    certId = regResp.certificateId;
  } catch (err) {
    if (err.name == "ResourceAlreadyExistsException") {
      certArn = err.resourceArn;
      certId = err.resourceId;
    } else {
      throw err;
    }
  }

  const thingCmd = new CreateThingCommand({
    thingName: certId,
    attributePayload: {
      attributes: {
        serialNumber: serialNum,
      },
      merge: true,
    },
  });

  const thingResp = await client.send(thingCmd);

  if (policy) {
    const policyCmd = new AttachPolicyCommand({
      policyName: iotPolicy,
      target: certArn,
    });

    await client.send(policyCmd);
  }

  const principalCmd = new AttachThingPrincipalCommand({
    thingName: thingResp.thingName,
    principal: certArn,
  });

  await client.send(principalCmd);

  return true;
}

module.exports = requestMiddleware(post, {
  validation: { body: postInteropSchema },
});
