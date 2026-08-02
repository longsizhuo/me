// Routing + CORS only. Actual D1 logic lives in albums.ts.
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

const ALLOWED_ORIGINS = ["https://longsizhuo.com", "http://localhost:5173"];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function withCors(res: Response, origin: string | null): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders(origin))) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "GET") {
      return withCors(jsonResponse({ error: "method not allowed" }, 405), origin);
    }

    const lang = pickLang(url, request);
    const limit = parseLimit(url.searchParams.get("limit"));

    let res: Response;
    if (pathname === "/api/albums") {
      res = await listAlbums(env, lang);
    } else if (pathname === "/api/photos/latest") {
      res = await latestPhotos(env, limit);
    } else {
      const photosMatch = pathname.match(/^\/api\/albums\/([^/]+)\/photos$/);
      const albumMatch = pathname.match(/^\/api\/albums\/([^/]+)$/);
      if (photosMatch) {
        res = await getAlbumPhotos(env, decodeURIComponent(photosMatch[1]), url.searchParams.get("cursor"), limit);
      } else if (albumMatch) {
        res = await getAlbum(env, decodeURIComponent(albumMatch[1]), lang, limit);
      } else {
        res = jsonResponse({ error: "not found" }, 404);
      }
    }

    return withCors(res, origin);
  },
};
