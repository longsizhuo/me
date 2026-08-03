// Access-protected write endpoints (routing only — auth already happened in
// index.ts via access.ts's requireAccess before handleAdmin is ever called).
import type { Env, AlbumRow, PhotoRow } from "./albums.ts";
import { jsonResponse, getAlbumRow } from "./albums.ts";
import { handleContent } from "./content.ts";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

function extOf(filename: string): string | null {
  const i = filename.lastIndexOf(".");
  return i < 0 ? null : filename.slice(i + 1).toLowerCase();
}

function isSlug(s: unknown): s is string {
  return typeof s === "string" && s.length > 0 && /^[a-z0-9-]+$/.test(s);
}

// src/App.tsx has exactly one static path segment under /album/ — /album/admin
// — and react-router ranks a literal segment above a :slug param regardless
// of route declaration order. An album using this slug would show up in the
// list, but its own card would open the admin tool instead of the album,
// and it could never be reached any other way. Check this at creation time,
// not just document it, since the slug is otherwise unrestricted.
const RESERVED_SLUGS = new Set(["admin"]);

async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return null;
  }
  return typeof body === "object" && body !== null
    ? (body as Record<string, unknown>)
    : null;
}

function foldAlbumAdmin(row: AlbumRow) {
  return {
    slug: row.slug,
    nameZh: row.name_zh,
    nameEn: row.name_en,
    descriptionZh: row.description_zh,
    descriptionEn: row.description_en,
    coverKey: row.cover_key,
    sortOrder: row.sort_order,
    photoCount: row.photo_count,
  };
}

function foldPhotoAdmin(row: PhotoRow & { album_id: number }) {
  return {
    id: row.id,
    key: row.key,
    w: row.w,
    h: row.h,
    sortOrder: row.sort_order,
    albumId: row.album_id,
  };
}

async function getPhotoRow(
  env: Env,
  id: number,
): Promise<(PhotoRow & { album_id: number }) | null> {
  const row = await env.DB.prepare("SELECT * FROM photos WHERE id = ?")
    .bind(id)
    .first<PhotoRow & { album_id: number }>();
  return row ?? null;
}

// If the deleted/moved-away key was the album's cover, promote the new
// first photo (by sort_order, id) to cover, or clear it if none are left.
// Must be called after the photo row itself has already been removed from
// (or moved out of) this album, so the "next" query doesn't see it.
async function reassignCoverIfNeeded(
  env: Env,
  albumId: number,
  removedKey: string,
): Promise<void> {
  const album = await env.DB.prepare(
    "SELECT cover_key FROM albums WHERE id = ?",
  )
    .bind(albumId)
    .first<{ cover_key: string | null }>();
  if (!album || album.cover_key !== removedKey) {
    return;
  }
  const next = await env.DB.prepare(
    "SELECT key FROM photos WHERE album_id = ? ORDER BY sort_order, id LIMIT 1",
  )
    .bind(albumId)
    .first<{ key: string }>();
  await env.DB.prepare("UPDATE albums SET cover_key = ? WHERE id = ?")
    .bind(next ? next.key : null, albumId)
    .run();
}

// ---------- albums ----------

async function createAlbum(env: Env, request: Request): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) {
    return jsonResponse({ error: "invalid JSON body" }, 400);
  }
  const { slug, nameZh, nameEn, descriptionZh, descriptionEn, sortOrder } =
    body;
  if (
    !isSlug(slug) ||
    typeof nameZh !== "string" ||
    !nameZh ||
    typeof nameEn !== "string" ||
    !nameEn
  ) {
    return jsonResponse(
      {
        error:
          "slug (lowercase letters/digits/hyphens), nameZh, nameEn are required",
      },
      400,
    );
  }
  if (RESERVED_SLUGS.has(slug)) {
    return jsonResponse(
      {
        error: `slug "${slug}" is reserved (shadowed by a static /album/* route) and cannot be used`,
      },
      400,
    );
  }
  if (await getAlbumRow(env, slug)) {
    return jsonResponse({ error: "slug already exists" }, 409);
  }
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO albums (slug, name_zh, name_en, description_zh, description_en, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      slug,
      nameZh,
      nameEn,
      typeof descriptionZh === "string" ? descriptionZh : "",
      typeof descriptionEn === "string" ? descriptionEn : "",
      typeof sortOrder === "number" ? sortOrder : 0,
      now,
    )
    .run();
  const created = await getAlbumRow(env, slug);
  return jsonResponse(created ? foldAlbumAdmin(created) : { slug }, 201);
}

async function updateAlbum(
  env: Env,
  slug: string,
  request: Request,
): Promise<Response> {
  const album = await getAlbumRow(env, slug);
  if (!album) {
    return jsonResponse({ error: "album not found" }, 404);
  }
  const body = await readJsonBody(request);
  if (!body) {
    return jsonResponse({ error: "invalid JSON body" }, 400);
  }

  const columnFor: Record<string, string> = {
    nameZh: "name_zh",
    nameEn: "name_en",
    descriptionZh: "description_zh",
    descriptionEn: "description_en",
    coverKey: "cover_key",
    sortOrder: "sort_order",
  };
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [field, column] of Object.entries(columnFor)) {
    if (field in body) {
      sets.push(`${column} = ?`);
      values.push(body[field]);
    }
  }
  if (sets.length === 0) {
    return jsonResponse({ error: "no valid fields to update" }, 400);
  }
  values.push(album.id);
  await env.DB.prepare(`UPDATE albums SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
  const updated = await getAlbumRow(env, slug);
  return jsonResponse(updated ? foldAlbumAdmin(updated) : null);
}

async function deleteAlbum(env: Env, slug: string): Promise<Response> {
  const album = await getAlbumRow(env, slug);
  if (!album) {
    return jsonResponse({ error: "album not found" }, 404);
  }

  const { results } = await env.DB.prepare(
    "SELECT key FROM photos WHERE album_id = ?",
  )
    .bind(album.id)
    .all<{ key: string }>();
  const keys = results.map((r) => r.key);

  if (keys.length > 0) {
    try {
      // R2Bucket.delete() accepts at most 1000 keys per call.
      for (let i = 0; i < keys.length; i += 1000) {
        await env.BUCKET.delete(keys.slice(i, i + 1000));
      }
    } catch (err) {
      // D1 is left untouched — the album and its photo rows still exist,
      // so this is safely retryable rather than leaving R2 orphans behind.
      console.error(
        "me-api: album delete — R2 cleanup failed, D1 left intact",
        slug,
        err,
      );
      return jsonResponse(
        { error: "failed to delete photo objects; album not deleted" },
        500,
      );
    }
  }

  // Only reaches D1 once the R2 objects are confirmed gone — D1's
  // ON DELETE CASCADE clears the photos rows but never touches R2.
  await env.DB.prepare("DELETE FROM albums WHERE id = ?")
    .bind(album.id)
    .run();
  return jsonResponse({ ok: true, deletedPhotos: keys.length });
}

// ---------- photos ----------

interface UploadEntry {
  file: string;
  id?: number;
  key?: string;
  w?: number;
  h?: number;
  error?: string;
}

async function uploadPhotos(
  env: Env,
  slug: string,
  request: Request,
): Promise<Response> {
  const album = await getAlbumRow(env, slug);
  if (!album) {
    return jsonResponse({ error: "album not found" }, 404);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: "expected multipart/form-data" }, 400);
  }

  // Contract: repeated "files" entries (one per photo) plus parallel
  // repeated "widths"/"heights" entries in the same order — the browser
  // appends all three per photo in one loop via createImageBitmap(), so
  // FormData.getAll() preserves the per-key append order and the indices
  // line up. There is no image library here to decode dimensions server
  // side, per the brief.
  const files = form
    .getAll("files")
    .filter((v): v is File => v instanceof File);
  const widths = form.getAll("widths");
  const heights = form.getAll("heights");

  if (files.length === 0) {
    return jsonResponse({ error: "no files (field name: files)" }, 400);
  }
  if (widths.length !== files.length || heights.length !== files.length) {
    return jsonResponse(
      { error: "widths/heights must have one entry per file, same order" },
      400,
    );
  }

  const maxSortRow = await env.DB.prepare(
    "SELECT COALESCE(MAX(sort_order), -1) AS maxSort FROM photos WHERE album_id = ?",
  )
    .bind(album.id)
    .first<{ maxSort: number }>();
  let nextSort = (maxSortRow?.maxSort ?? -1) + 1;

  const uploaded: UploadEntry[] = [];
  const failed: UploadEntry[] = [];
  let newCoverKey: string | null = null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const w = Number(widths[i]);
    const h = Number(heights[i]);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      failed.push({ file: file.name, error: "invalid width/height" });
      continue;
    }
    const ext = extOf(file.name);
    // Hoisted lookup + typeof check rather than `ext in MIME` — `in` walks
    // the prototype chain, so a file literally named "x.constructor" (or
    // ".toString"/".valueOf") would pass an `in`-based whitelist and then
    // hand `Object`'s constructor function to put()'s contentType.
    const mime = ext ? MIME[ext] : undefined;
    if (!ext || typeof mime !== "string") {
      failed.push({
        file: file.name,
        error: `unsupported file type: ${ext ?? "(none)"}`,
      });
      continue;
    }

    const key = `album/${slug}/${crypto.randomUUID()}.${ext}`;
    const buffer = await file.arrayBuffer();
    // R2 checks this digest against the bytes it actually received and
    // rejects the write on mismatch. This is the guard against a transfer
    // that stalls mid-body while Content-Length still reports the full
    // size — R2 recording the right size while the body never finished is
    // exactly the failure that poisoned an object earlier in this project
    // (see the SDD ledger); comparing sizes after the fact would not have
    // caught it, so this is computed and checked at write time instead.
    const digest = await crypto.subtle.digest("SHA-256", buffer);

    try {
      await env.BUCKET.put(key, buffer, {
        httpMetadata: { contentType: mime },
        sha256: digest,
      });
    } catch (err) {
      console.error("me-api: R2 put failed", key, err);
      failed.push({ file: file.name, error: "upload to storage failed" });
      continue;
    }

    try {
      const { meta } = await env.DB.prepare(
        "INSERT INTO photos (album_id, key, w, h, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
        .bind(album.id, key, w, h, nextSort, new Date().toISOString())
        .run();
      nextSort++;
      uploaded.push({ file: file.name, id: meta.last_row_id, key, w, h });
      if (!album.cover_key && !newCoverKey) {
        newCoverKey = key;
      }
    } catch (err) {
      // D1 write failed after R2 succeeded — delete the orphan so nothing
      // unreferenced is left in the bucket.
      console.error(
        "me-api: D1 insert failed after R2 put, rolling back R2",
        key,
        err,
      );
      try {
        await env.BUCKET.delete(key);
      } catch (cleanupErr) {
        console.error(
          "me-api: rollback delete also failed, orphan left",
          key,
          cleanupErr,
        );
      }
      failed.push({ file: file.name, error: "database write failed" });
    }
  }

  if (uploaded.length > 0) {
    if (newCoverKey) {
      await env.DB.prepare(
        "UPDATE albums SET photo_count = photo_count + ?, cover_key = ? WHERE id = ?",
      )
        .bind(uploaded.length, newCoverKey, album.id)
        .run();
    } else {
      await env.DB.prepare(
        "UPDATE albums SET photo_count = photo_count + ? WHERE id = ?",
      )
        .bind(uploaded.length, album.id)
        .run();
    }
  }

  return jsonResponse({ uploaded, failed }, uploaded.length > 0 ? 201 : 400);
}

async function updatePhoto(
  env: Env,
  id: number,
  request: Request,
): Promise<Response> {
  const photo = await getPhotoRow(env, id);
  if (!photo) {
    return jsonResponse({ error: "photo not found" }, 404);
  }
  const body = await readJsonBody(request);
  if (!body) {
    return jsonResponse({ error: "invalid JSON body" }, 400);
  }

  const hasSortOrder =
    "sortOrder" in body && typeof body.sortOrder === "number";
  const hasMove = "albumSlug" in body && typeof body.albumSlug === "string";
  if (!hasSortOrder && !hasMove) {
    return jsonResponse({ error: "provide sortOrder and/or albumSlug" }, 400);
  }

  let targetAlbumId = photo.album_id;
  if (hasMove) {
    const target = await getAlbumRow(env, body.albumSlug as string);
    if (!target) {
      return jsonResponse({ error: "target album not found" }, 404);
    }
    targetAlbumId = target.id;
  }
  const sortOrder = hasSortOrder ? (body.sortOrder as number) : photo.sort_order;
  const isCrossAlbumMove = hasMove && targetAlbumId !== photo.album_id;

  if (!isCrossAlbumMove) {
    await env.DB.prepare(
      "UPDATE photos SET album_id = ?, sort_order = ? WHERE id = ?",
    )
      .bind(targetAlbumId, sortOrder, id)
      .run();
  } else {
    // A cross-album move is the photo UPDATE plus four more D1 writes
    // (source/target photo_count, source cover reassignment, target cover
    // fill-in). Run unbatched, a D1 blip partway through used to leave the
    // photo moved with the counts and covers permanently wrong on both
    // albums, with nothing to retry. Reads that decide *which* writes are
    // needed happen first, against the still-unmoved photo, then every
    // write — including the move itself — lands in one batch() so D1
    // commits all of it or none of it (see uploadPhotos above for this
    // file's rollback convention on the R2+D1 boundary; this is the
    // equivalent for a request that never leaves D1).
    const sourceAlbum = await env.DB.prepare(
      "SELECT cover_key FROM albums WHERE id = ?",
    )
      .bind(photo.album_id)
      .first<{ cover_key: string | null }>();
    const targetAlbum = await env.DB.prepare(
      "SELECT cover_key FROM albums WHERE id = ?",
    )
      .bind(targetAlbumId)
      .first<{ cover_key: string | null }>();

    const statements = [
      env.DB.prepare(
        "UPDATE photos SET album_id = ?, sort_order = ? WHERE id = ?",
      ).bind(targetAlbumId, sortOrder, id),
      env.DB.prepare(
        "UPDATE albums SET photo_count = photo_count - 1 WHERE id = ?",
      ).bind(photo.album_id),
      env.DB.prepare(
        "UPDATE albums SET photo_count = photo_count + 1 WHERE id = ?",
      ).bind(targetAlbumId),
    ];

    if (sourceAlbum?.cover_key === photo.key) {
      // Old album is about to lose its cover photo. `id != ?` excludes the
      // moving photo itself — its album_id hasn't changed yet at read time,
      // so without this it would pick itself right back as the "next" cover.
      const next = await env.DB.prepare(
        "SELECT key FROM photos WHERE album_id = ? AND id != ? ORDER BY sort_order, id LIMIT 1",
      )
        .bind(photo.album_id, id)
        .first<{ key: string }>();
      statements.push(
        env.DB.prepare("UPDATE albums SET cover_key = ? WHERE id = ?").bind(
          next ? next.key : null,
          photo.album_id,
        ),
      );
    }

    if (targetAlbum && !targetAlbum.cover_key) {
      statements.push(
        env.DB.prepare("UPDATE albums SET cover_key = ? WHERE id = ?").bind(
          photo.key,
          targetAlbumId,
        ),
      );
    }

    await env.DB.batch(statements);
  }

  const updated = await getPhotoRow(env, id);
  return jsonResponse(updated ? foldPhotoAdmin(updated) : null);
}

async function deletePhoto(env: Env, id: number): Promise<Response> {
  const photo = await getPhotoRow(env, id);
  if (!photo) {
    return jsonResponse({ error: "photo not found" }, 404);
  }

  try {
    await env.BUCKET.delete(photo.key);
  } catch (err) {
    console.error(
      "me-api: photo delete — R2 delete failed, D1 left intact",
      id,
      err,
    );
    return jsonResponse({ error: "failed to delete photo object" }, 500);
  }

  await env.DB.prepare("DELETE FROM photos WHERE id = ?").bind(id).run();
  await env.DB.prepare(
    "UPDATE albums SET photo_count = photo_count - 1 WHERE id = ?",
  )
    .bind(photo.album_id)
    .run();
  await reassignCoverIfNeeded(env, photo.album_id, photo.key);

  return jsonResponse({ ok: true });
}

// ---------- dispatch ----------

export async function handleAdmin(
  method: string,
  pathname: string,
  request: Request,
  env: Env,
): Promise<Response> {
  if (pathname === "/api/admin/content") {
    return handleContent(method, request, env);
  }

  if (pathname === "/api/admin/albums") {
    if (method === "POST") {
      return createAlbum(env, request);
    }
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  const albumMatch = pathname.match(/^\/api\/admin\/albums\/([^/]+)$/);
  if (albumMatch) {
    const slug = decodeURIComponent(albumMatch[1]);
    if (method === "PATCH") {
      return updateAlbum(env, slug, request);
    }
    if (method === "DELETE") {
      return deleteAlbum(env, slug);
    }
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  const photosMatch = pathname.match(/^\/api\/admin\/albums\/([^/]+)\/photos$/);
  if (photosMatch) {
    if (method === "POST") {
      return uploadPhotos(env, decodeURIComponent(photosMatch[1]), request);
    }
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  const photoMatch = pathname.match(/^\/api\/admin\/photos\/(\d+)$/);
  if (photoMatch) {
    const id = Number(photoMatch[1]);
    if (method === "PATCH") {
      return updatePhoto(env, id, request);
    }
    if (method === "DELETE") {
      return deletePhoto(env, id);
    }
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  return jsonResponse({ error: "not found" }, 404);
}
