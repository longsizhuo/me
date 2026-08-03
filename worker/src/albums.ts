// Public read logic for the photo album API. Routing + CORS live in index.ts;
// this file only touches D1 and shapes responses.

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  // Public identifiers (not secrets) for Cloudflare Access JWT verification —
  // see access.ts. Set in wrangler.jsonc's `vars`.
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
}

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

type Lang = "zh" | "en";

export interface AlbumRow {
  id: number;
  slug: string;
  name_zh: string;
  name_en: string;
  description_zh: string;
  description_en: string;
  cover_key: string | null;
  sort_order: number;
  photo_count: number;
}

export interface PhotoRow {
  id: number;
  key: string;
  w: number;
  h: number;
  sort_order: number;
}

// limit is clamped into 1..100 rather than rejected — a caller passing
// limit=0 or limit=99999 still gets a usable response, not a 400.
function parseLimit(raw: string | null): number {
  const n = raw === null ? DEFAULT_LIMIT : Number(raw);
  if (!Number.isFinite(n)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(Math.trunc(n), 1), MAX_LIMIT);
}

// ?lang= wins, then Accept-Language starting with "zh", else "en". Never
// exposes name_zh/name_en both — the client gets one "name" field.
export function pickLang(url: URL, request: Request): Lang {
  const q = url.searchParams.get("lang");
  if (q === "zh" || q === "en") {
    return q;
  }
  const accept = (request.headers.get("Accept-Language") || "")
    .trim()
    .toLowerCase();
  return accept.startsWith("zh") ? "zh" : "en";
}

// Cursor = base64url("<sort_order>:<id>"). Workers has no node:buffer Buffer
// by default, so this uses the Web-standard btoa/atob instead — same
// round-trip contract as test/cursor.test.mjs's Buffer-based version.
export function encodeCursor(sort: number, id: number): string {
  const b64 = btoa(`${sort}:${id}`);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// base64url -> base64 (restore the alphabet, restore the "=" padding atob
// needs). Shared with access.ts's JWT verification, which decodes the same
// alphabet for an unrelated payload — one copy of the padding math so an
// RFC-edge-case fix can't land in one call site and not the other.
export function base64urlToBase64(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return b64 + pad;
}

export function decodeCursor(
  raw: string | null,
): { sort: number; id: number } | null {
  if (!raw) {
    return null;
  }
  let decoded: string;
  try {
    decoded = atob(base64urlToBase64(raw));
  } catch {
    return null;
  }
  const [s, i] = decoded.split(":");
  const sort = Number(s);
  const id = Number(i);
  return Number.isFinite(sort) && Number.isFinite(id) ? { sort, id } : null;
}

function foldAlbum(row: AlbumRow, lang: Lang) {
  return {
    slug: row.slug,
    name: lang === "zh" ? row.name_zh : row.name_en,
    description: lang === "zh" ? row.description_zh : row.description_en,
    coverKey: row.cover_key,
    photoCount: row.photo_count,
  };
}

function foldPhoto(row: PhotoRow) {
  return { id: row.id, key: row.key, w: row.w, h: row.h };
}

// Reads are edge-cacheable; errors are not — a 404 from a mistyped slug or a
// 405 from a bad method must not get pinned at the edge for 60s.
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": status < 400 ? "public, max-age=60" : "no-store",
    },
  });
}

export async function listAlbums(env: Env, lang: Lang): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT * FROM albums ORDER BY sort_order, id",
  ).all<AlbumRow>();
  return jsonResponse(results.map((r: AlbumRow) => foldAlbum(r, lang)));
}

// Exported for admin.ts — the write endpoints need the same "does this
// slug exist" lookup (existence check before create, 404 before
// update/delete/upload).
export async function getAlbumRow(env: Env, slug: string): Promise<AlbumRow | null> {
  const row = await env.DB.prepare("SELECT * FROM albums WHERE slug = ?")
    .bind(slug)
    .first<AlbumRow>();
  return row ?? null;
}

// Shared paging step used by both /api/albums/:slug (first page) and
// /api/albums/:slug/photos (any page). Fetches limit+1 rows to know whether
// there's a next page, then slices the extra row off before returning.
async function pagePhotos(
  env: Env,
  albumId: number,
  cursor: { sort: number; id: number } | null,
  limit: number,
): Promise<{
  photos: ReturnType<typeof foldPhoto>[];
  nextCursor: string | null;
}> {
  const stmt = cursor
    ? env.DB.prepare(
        `SELECT id, key, w, h, sort_order FROM photos
         WHERE album_id = ? AND (sort_order > ? OR (sort_order = ? AND id > ?))
         ORDER BY sort_order, id LIMIT ?`,
      ).bind(albumId, cursor.sort, cursor.sort, cursor.id, limit + 1)
    : env.DB.prepare(
        `SELECT id, key, w, h, sort_order FROM photos
         WHERE album_id = ?
         ORDER BY sort_order, id LIMIT ?`,
      ).bind(albumId, limit + 1);

  const { results } = await stmt.all<PhotoRow>();
  const hasMore = results.length > limit;
  const page = hasMore ? results.slice(0, limit) : results;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor(last.sort_order, last.id) : null;
  return { photos: page.map(foldPhoto), nextCursor };
}

export async function getAlbum(
  env: Env,
  slug: string,
  lang: Lang,
  limit: number,
): Promise<Response> {
  const album = await getAlbumRow(env, slug);
  if (!album) {
    return jsonResponse({ error: "album not found" }, 404);
  }
  const { photos, nextCursor } = await pagePhotos(env, album.id, null, limit);
  return jsonResponse({ ...foldAlbum(album, lang), photos, nextCursor });
}

export async function getAlbumPhotos(
  env: Env,
  slug: string,
  cursorRaw: string | null,
  limit: number,
): Promise<Response> {
  const album = await getAlbumRow(env, slug);
  if (!album) {
    return jsonResponse({ error: "album not found" }, 404);
  }
  // A garbage cursor decodes to null and is treated as "start from page 1"
  // rather than a 400/500 — visitors hand-edit URLs.
  const cursor = decodeCursor(cursorRaw);
  const { photos, nextCursor } = await pagePhotos(env, album.id, cursor, limit);
  return jsonResponse({ photos, nextCursor });
}

export async function latestPhotos(env: Env, limit: number): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT photos.id, photos.key, photos.w, photos.h, albums.slug AS album_slug
     FROM photos JOIN albums ON albums.id = photos.album_id
     ORDER BY photos.created_at DESC, photos.id DESC
     LIMIT ?`,
  )
    .bind(limit)
    .all<PhotoRow & { album_slug: string }>();
  return jsonResponse(
    results.map((r: PhotoRow & { album_slug: string }) => ({
      id: r.id,
      key: r.key,
      w: r.w,
      h: r.h,
      albumSlug: r.album_slug,
    })),
  );
}

export { parseLimit };
