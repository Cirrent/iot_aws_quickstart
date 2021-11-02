"use strict";

const { createVerifier } = require("fast-jwt");
const fs = require("fs");
const got = require("got");
const cacheManager = require("cache-manager");
const cache = cacheManager.caching({
  store: "memory",
  max: 10,
  ttl: 600 /*seconds*/,
});

const { audience, verifyCacheKey, isLocal, publicKeyURL } = require("../vars");

async function fetchPublicKey() {
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

module.exports = { fetchPublicKey };
