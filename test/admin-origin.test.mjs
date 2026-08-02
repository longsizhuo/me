import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/src/index.ts";

// Proves the fix for the CSRF review finding: POST /api/admin/* is a
// CORS-simple request (no JSON content-type required, and the upload
// endpoint is multipart/form-data — both are simple-request types), so no
// preflight ever runs and CORS alone does not stop a cross-site POST. The
// only thing that stopped it before this fix was the Access session
// cookie's browser-default SameSite=Lax — a Cloudflare/browser property,
// not something the Worker's own code guaranteed, and Access sets
// SameSite=None when CORS is enabled on the application (a checkbox, not a
// constant). index.ts now checks Origin itself before dispatching into
// handleAdmin(). This test exercises the real fetch() handler end to end —
// not just the JWT check in isolation — with one variable held constant
// (a genuinely valid, correctly signed token) and only the Origin header
// changed, so a status difference can only come from the Origin check.

const TEAM_DOMAIN = "involutionhell.cloudflareaccess.com";
const AUD = "58915fbecc45ec929a4871815c3d2fd1ddc1035dc65fd79beedb0d75a32eacaa";
const KID = "test-key-1";

const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"],
);
const publicJwk = await crypto.subtle.exportKey("jwk", publicKey);

global.fetch = async (url) => {
  if (String(url) === `https://${TEAM_DOMAIN}/cdn-cgi/access/certs`) {
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

async function signToken(payload) {
  const headerB64 = b64url(Buffer.from(JSON.stringify({ alg: "RS256", kid: KID })));
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    new TextEncoder().encode(`${headerB64}.${payloadB64}`),
  );
  return `${headerB64}.${payloadB64}.${b64url(sig)}`;
}

const now = Math.floor(Date.now() / 1000);
const validToken = await signToken({
  aud: [AUD],
  iss: `https://${TEAM_DOMAIN}`,
  exp: now + 3600,
  email: "longsizhuo@gmail.com",
});

// A fake D1 good enough for createAlbum() to run its full course (no
// existing album, insert "succeeds", re-fetch after insert also finds
// nothing — the handler falls back to `{ slug }` in that case) without
// touching real data. R2 is untouched by this endpoint, so BUCKET stays null.
function fakeEnv() {
  return {
    ACCESS_TEAM_DOMAIN: TEAM_DOMAIN,
    ACCESS_AUD: AUD,
    BUCKET: null,
    DB: {
      prepare() {
        return {
          bind() {
            return this;
          },
          async first() {
            return null;
          },
          async all() {
            return { results: [] };
          },
          async run() {
            return { success: true, meta: { last_row_id: 1, changes: 1, duration: 0 } };
          },
        };
      },
    },
  };
}

function adminRequest(origin) {
  const headers = { "Content-Type": "application/json", "Cf-Access-Jwt-Assertion": validToken };
  if (origin) {
    headers.Origin = origin;
  }
  return new Request("https://longsizhuo.com/api/admin/albums", {
    method: "POST",
    headers,
    body: JSON.stringify({ slug: "test-album", nameZh: "测试", nameEn: "Test" }),
  });
}

test("legit Origin + valid token: dispatched to the handler, not rejected at the gate", async () => {
  const res = await worker.fetch(adminRequest("https://longsizhuo.com"), fakeEnv());
  const body = await res.json();
  assert.notEqual(res.status, 401);
  assert.notEqual(body.error, "unauthorized");
});

test("evil Origin + the SAME valid token: still rejected — the Origin check runs even when the token is genuinely fine", async () => {
  const res = await worker.fetch(adminRequest("https://evil.example"), fakeEnv());
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.error, "unauthorized");
});

test("no Origin header (curl, or same-origin engines that omit it) + valid token: still dispatched — only a mismatched Origin is rejected, not a missing one", async () => {
  const res = await worker.fetch(adminRequest(null), fakeEnv());
  const body = await res.json();
  assert.notEqual(res.status, 401);
  assert.notEqual(body.error, "unauthorized");
});
