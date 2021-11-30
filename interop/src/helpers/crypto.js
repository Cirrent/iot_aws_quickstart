"use strict";

/**
 * @file Helper class for handling cryptography related logics
 * @author Cirrent Cloud Team
 */

const { createVerifier } = require("fast-jwt");
const fs = require("fs");
const got = require("got");
const cacheManager = require("cache-manager");
const { X509 } = require("jsrsasign");
const Joi = require("joi");

const cache = cacheManager.caching({
  store: "memory",
  max: 10,
  ttl: 600 /*seconds*/,
});

const { audience, verifyCacheKey, isLocal, publicKeyURL } = require("../vars");

/**
 * Create token verifier function
 * @returns {function} token verify function
 */
async function createTokenVerifier() {
  let cacheRes = await cache.get(verifyCacheKey);
  if (cacheRes) return cacheRes;

  let publicKey;

  if (isLocal) {
    publicKey = fs.readFileSync("./tests/cert/test-public.key");
  } else {
    const dl = await got(publicKeyURL);

    if (dl.rawBody) {
      publicKey = dl.rawBody;
    }
  }

  if (publicKey && audience) {
    const verify = createVerifier({
      key: publicKey,
      allowedAud: audience,
    });
    await cache.set(verifyCacheKey, verify);

    return verify;
  } else {
    throw new Error("Cannot create verifier");
  }
}

const serialNumberSchema = Joi.string().required();

async function getSerialNumber(certificate) {
  const serialNumber = certificate.getSerialNumberHex();

  await serialNumberSchema.validateAsync(serialNumber);
  return serialNumber;
}

async function getCertificate(certBuf) {
  const certString = certBuf.toString("ascii");
  let x509 = new X509();
  x509.readCertPEM(certString);

  return x509;
}

module.exports = { createTokenVerifier, getSerialNumber, getCertificate };
