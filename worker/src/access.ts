// Verifies Cloudflare Access JWTs (the `Cf-Access-Jwt-Assertion` header) with
// WebCrypto — no dependency, no shared secret.
//
// Why this exists even though Access already sits in front of /api/admin/*:
// Access protects the *path*, not the Worker. Any request that reaches this
// Worker some other way (a misconfigured route, a future Worker-to-Worker
// call, Access itself being reconfigured) would otherwise be trusted purely
// because the header is present. So this file re-derives trust from the
// token's RS256 signature against Access's own published keys, independent
// of whether Access actually ran. This is exactly the check the sibling
// `sylvia-photo-api` Worker skips — it hardcodes an `ADMIN_SECRET` string
// instead, which is not an acceptable substitute.
import type { Env } from "./albums.ts";

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
}

interface Jwks {
  keys: Jwk[];
}

export interface AccessPayload {
  aud: string | string[];
  iss: string;
  exp: number;
  email?: string;
  [key: string]: unknown;
}

export class AccessJwtError extends Error {}

// Module-scope cache: fetched once per Worker isolate (not per request), and
// refetched after JWKS_TTL_MS so a key rotation on Cloudflare's side is
// eventually picked up without needing a redeploy.
const JWKS_TTL_MS = 60 * 60 * 1000;
let jwksCache: { keys: Jwk[]; fetchedAt: number } | null = null;

async function getJwks(env: Env): Promise<Jwk[]> {
  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(
    `https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`,
  );
  if (!res.ok) {
    throw new AccessJwtError(`JWKS fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as Jwks;
  // A 200 whose body doesn't actually have a usable `keys` array must not be
  // cached — that would turn one transient upstream glitch into every admin
  // request being rejected for the next JWKS_TTL_MS instead of just this one.
  if (!Array.isArray(data.keys) || data.keys.length === 0) {
    throw new AccessJwtError("JWKS response missing keys");
  }
  jwksCache = { keys: data.keys, fetchedAt: now };
  return data.keys;
}

function base64urlToBytes(b64url: string): Uint8Array<ArrayBuffer> {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function base64urlToJson<T>(b64url: string): T {
  const text = new TextDecoder().decode(base64urlToBytes(b64url));
  return JSON.parse(text) as T;
}

// Verifies the RS256 signature against Access's JWKS, then checks aud / iss
// / exp. Throws AccessJwtError on any failure — never returns a "maybe".
// Exported (not just used via requireAccess) so tests can call it directly
// with a hand-built token, per the task's requirement to prove the check
// itself rejects a bad token, not just that Access's redirect exists.
export async function verifyAccessJwt(
  token: string,
  env: Env,
): Promise<AccessPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new AccessJwtError("malformed token");
  }
  const [headerB64, payloadB64, sigB64] = parts;

  const header = base64urlToJson<{ alg: string; kid: string }>(headerB64);
  if (header.alg !== "RS256") {
    throw new AccessJwtError(`unsupported alg: ${header.alg}`);
  }

  const keys = await getJwks(env);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    throw new AccessJwtError("no matching JWK for kid");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const signedInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64urlToBytes(sigB64);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signature,
    signedInput,
  );
  if (!valid) {
    throw new AccessJwtError("signature verification failed");
  }

  const payload = base64urlToJson<AccessPayload>(payloadB64);

  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(env.ACCESS_AUD)) {
    throw new AccessJwtError("aud mismatch");
  }
  if (payload.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) {
    throw new AccessJwtError("iss mismatch");
  }
  if (
    typeof payload.exp !== "number" ||
    payload.exp <= Math.floor(Date.now() / 1000)
  ) {
    throw new AccessJwtError("token expired");
  }

  return payload;
}

// Exported so index.ts's Origin check (a separate gate on the same
// /api/admin/* branch, see the CSRF note there) answers with the identical
// 401 shape rather than inventing a second one.
export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// Gate for every /api/admin/* request. Returns null when the request is
// authenticated and may proceed; otherwise the 401 Response to send back.
export async function requireAccess(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) {
    return unauthorized();
  }
  try {
    await verifyAccessJwt(token, env);
    return null;
  } catch (err) {
    console.error("me-api: access jwt rejected", err);
    return unauthorized();
  }
}
