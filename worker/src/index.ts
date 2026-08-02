// Routing + CORS only. Public-read D1 logic lives in albums.ts; the
// Access-protected write logic lives in admin.ts + access.ts.
import {
  type Env,
  jsonResponse,
  listAlbums,
  getAlbum,
  getAlbumPhotos,
  latestPhotos,
  pickLang,
  parseLimit,
} from "./albums";
import { requireAccess } from "./access";
import { handleAdmin } from "./admin";

const ALLOWED_ORIGINS = ["https://longsizhuo.com", "http://localhost:5173"];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, HEAD, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Cf-Access-Jwt-Assertion",
    Vary: "Origin",
  };
}

function withCors(res: Response, origin: string | null): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders(origin))) {
    headers.set(k, v);
  }
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Only /api/admin/* is gated. Verifying the Access JWT's own RS256
    // signature here (not just trusting that the header is present) is the
    // point — Access sitting in front of the route is not itself a check
    // the Worker can rely on if it's ever reached another way.
    if (pathname.startsWith("/api/admin/")) {
      const denied = await requireAccess(request, env);
      if (denied) {
        return withCors(denied, origin);
      }
      let res: Response;
      try {
        res = await handleAdmin(method, pathname, request, env);
      } catch (err) {
        console.error("me-api: admin unhandled error", err);
        res = jsonResponse({ error: "internal server error" }, 500);
      }
      return withCors(res, origin);
    }

    // HEAD must behave like GET with the body stripped — HTTP semantics
    // require it wherever GET is supported, and Cloudflare's cache
    // sometimes issues HEAD requests.
    const isHead = method === "HEAD";
    if (method !== "GET" && !isHead) {
      return withCors(
        jsonResponse({ error: "method not allowed" }, 405),
        origin,
      );
    }

    const lang = pickLang(url, request);
    const limit = parseLimit(url.searchParams.get("limit"));

    // Every route below hits D1. One try/catch here (rather than one per
    // D1 call in albums.ts) keeps a D1 blip answering in the same
    // { error } JSON shape as every other error, instead of the runtime's
    // bare default 500. The real error goes to the Worker's logs, never to
    // the response body.
    let res: Response;
    try {
      if (pathname === "/api/albums") {
        res = await listAlbums(env, lang);
      } else if (pathname === "/api/photos/latest") {
        res = await latestPhotos(env, limit);
      } else {
        const photosMatch = pathname.match(/^\/api\/albums\/([^/]+)\/photos$/);
        const albumMatch = pathname.match(/^\/api\/albums\/([^/]+)$/);
        if (photosMatch) {
          res = await getAlbumPhotos(
            env,
            decodeURIComponent(photosMatch[1]),
            url.searchParams.get("cursor"),
            limit,
          );
        } else if (albumMatch) {
          res = await getAlbum(
            env,
            decodeURIComponent(albumMatch[1]),
            lang,
            limit,
          );
        } else {
          res = jsonResponse({ error: "not found" }, 404);
        }
      }
    } catch (err) {
      console.error("me-api: unhandled error", err);
      res = jsonResponse({ error: "internal server error" }, 500);
    }

    if (isHead) {
      res = new Response(null, { status: res.status, headers: res.headers });
    }

    return withCors(res, origin);
  },
};
