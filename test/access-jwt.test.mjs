import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyAccessJwt, AccessJwtError } from "../worker/src/access.ts";

// This is the security boundary the task explicitly says must not be faked:
// Cloudflare Access sitting in front of /api/admin/* is not itself proof
// that a request is legitimate, so verifyAccessJwt() must independently
// reject a token that Access itself would never have issued. Rather than
// duplicating the algorithm in plain JS (this project's usual pattern for
// worker/ logic, e.g. test/cursor.test.mjs), this test imports and calls the
// real function — Node 24 strips TS types natively, so no build step is
// needed, and a signature check is exactly the kind of logic where testing
// a hand-copied stand-in would prove nothing about the real code.

const TEAM_DOMAIN = "involutionhell.cloudflareaccess.com";
const AUD = "58915fbecc45ec929a4871815c3d2fd1ddc1035dc65fd79beedb0d75a32eacaa";
const KID = "test-key-1";

const env = { DB: null, BUCKET: null, ACCESS_TEAM_DOMAIN: TEAM_DOMAIN, ACCESS_AUD: AUD };

// The key pair the (mocked) JWKS actually advertises under KID.
const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"],
);
const publicJwk = await crypto.subtle.exportKey("jwk", publicKey);

// An unrelated key pair — used to sign a token that claims KID but was never
// actually issued by whoever controls the advertised public key.
const { privateKey: wrongPrivateKey } = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"],
);

let jwksFetchCount = 0;
global.fetch = async (url) => {
  if (String(url) === `https://${TEAM_DOMAIN}/cdn-cgi/access/certs`) {
    jwksFetchCount++;
    return {
      ok: true,
      json: async () => ({
        keys: [{ kid: KID, kty: publicJwk.kty, n: publicJwk.n, e: publicJwk.e }],
      }),
    };
  }
  throw new Error(`unexpected fetch in test: ${url}`);
};

function b64url(bufferSource) {
  return Buffer.from(bufferSource).toString("base64url");
}

async function signToken(payload, signingKey, { kid = KID, alg = "RS256" } = {}) {
  const headerB64 = b64url(Buffer.from(JSON.stringify({ alg, kid })));
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    signingKey,
    new TextEncoder().encode(`${headerB64}.${payloadB64}`),
  );
  return `${headerB64}.${payloadB64}.${b64url(sig)}`;
}

const now = Math.floor(Date.now() / 1000);
const validPayload = {
  aud: [AUD],
  iss: `https://${TEAM_DOMAIN}`,
  exp: now + 3600,
  email: "longsizhuo@gmail.com",
};

test("valid token, correctly signed — verifies and returns the payload", async () => {
  const token = await signToken(validPayload, privateKey);
  const payload = await verifyAccessJwt(token, env);
  assert.equal(payload.email, "longsizhuo@gmail.com");
});

test("token signed by the wrong key is rejected even though header/claims look right", async () => {
  // Same kid, same aud/iss/exp as the valid token — only the actual signing
  // key differs from what the JWKS advertises for that kid. If this passed,
  // Access's redirect would be the *only* thing stopping a forged token.
  const token = await signToken(validPayload, wrongPrivateKey);
  await assert.rejects(() => verifyAccessJwt(token, env), AccessJwtError);
});

test("expired token is rejected", async () => {
  const token = await signToken({ ...validPayload, exp: now - 10 }, privateKey);
  await assert.rejects(() => verifyAccessJwt(token, env), /expired/);
});

test("token with the wrong aud is rejected", async () => {
  const token = await signToken({ ...validPayload, aud: ["some-other-app-aud"] }, privateKey);
  await assert.rejects(() => verifyAccessJwt(token, env), /aud/);
});

test("token with the wrong iss is rejected", async () => {
  const token = await signToken(
    { ...validPayload, iss: "https://attacker.cloudflareaccess.com" },
    privateKey,
  );
  await assert.rejects(() => verifyAccessJwt(token, env), /iss/);
});

test("malformed token (not header.payload.signature) is rejected without throwing something unexpected", async () => {
  await assert.rejects(() => verifyAccessJwt("not-a-jwt", env), AccessJwtError);
  await assert.rejects(
    () => verifyAccessJwt("eyJhbGciOiJIUzI1NiJ9.e30.x", env), // HS256, the classic "none/weak alg" forgery attempt
    /alg/,
  );
});

test("JWKS is fetched once and cached across verifications (module-scope cache)", async () => {
  const before = jwksFetchCount;
  assert.ok(before >= 1, "JWKS should have been fetched by the earlier tests");
  await verifyAccessJwt(await signToken(validPayload, privateKey), env);
  await verifyAccessJwt(await signToken(validPayload, privateKey), env);
  assert.equal(jwksFetchCount, before, "verifying more tokens must not refetch the JWKS");
});
