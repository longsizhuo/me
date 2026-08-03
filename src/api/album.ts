// src/api/album.ts
// Thin client for the public read endpoints in worker/src/albums.ts
// (deployed at https://longsizhuo.com/api/*). Response shapes are
// camelCase — see that file's foldAlbum()/foldPhoto() — which differs
// from the snake_case sketched in the design doc; this file matches
// what the live API actually returns.

const BASE: string = import.meta.env.VITE_API_BASE ?? "https://longsizhuo.com";

export type Lang = "zh" | "en";

export interface AlbumSummary {
  slug: string;
  name: string;
  description: string;
  coverKey: string | null;
  photoCount: number;
}

export interface Photo {
  id: number;
  key: string;
  w: number;
  h: number;
}

export interface AlbumDetail extends AlbumSummary {
  photos: Photo[];
  nextCursor: string | null;
}

export interface PhotoPage {
  photos: Photo[];
  nextCursor: string | null;
}

export interface LatestPhoto extends Photo {
  albumSlug: string;
}

/** Thrown for any non-2xx response. `status` lets callers branch on 404 (unknown slug) vs. everything else. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function get<T>(
  path: string,
  params: Record<string, string | number | null | undefined> = {},
  { fresh = false }: { fresh?: boolean } = {},
): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined) {
      url.searchParams.set(k, String(v));
    }
  }
  // 读接口带 Cache-Control: public, max-age=60，对公开页面是对的。
  // 但管理页写完之后正是用同一个 URL 重新拉取，命中浏览器缓存就会读到
  // 写之前的副本——删掉的照片还在、刚传的照片不见，管理员会重复操作。
  // 写请求打的是 /api/admin/* 另一个 URL，不会让这些缓存失效，所以只能
  // 由调用方显式要求绕过。
  const res = await fetch(url.toString(), fresh ? { cache: "no-store" } : undefined);
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchAlbums(lang?: Lang, opts: { fresh?: boolean } = {}): Promise<AlbumSummary[]> {
  return get<AlbumSummary[]>("/api/albums", { lang }, opts);
}

export function fetchAlbum(
  slug: string,
  { fresh, ...params }: { lang?: Lang; limit?: number; fresh?: boolean } = {},
): Promise<AlbumDetail> {
  return get<AlbumDetail>(`/api/albums/${encodeURIComponent(slug)}`, params, { fresh });
}

export function fetchPhotos(
  slug: string,
  cursor?: string | null,
  limit?: number,
): Promise<PhotoPage> {
  return get<PhotoPage>(`/api/albums/${encodeURIComponent(slug)}/photos`, {
    cursor,
    limit,
  });
}

export function fetchLatest(limit?: number): Promise<LatestPhoto[]> {
  return get<LatestPhoto[]>("/api/photos/latest", { limit });
}

// ---------------------------------------------------------------------
// Admin (write) API — worker/src/admin.ts, gated by Cloudflare Access.
// Nothing here does auth: the browser carries the Access session for
// same-origin requests automatically, and worker/src/access.ts verifies the
// Cf-Access-Jwt-Assertion signature server-side. This file only needs to
// send requests with the field names admin.ts actually expects (confirmed
// against the deployed Worker — camelCase, not the snake_case sketched in
// the design doc, same gap as the public API noted at the top of this file).
// ---------------------------------------------------------------------

export interface UploadOutcome {
  file: string;
  id?: number;
  key?: string;
  w?: number;
  h?: number;
  error?: string;
}

export interface UploadResult {
  uploaded: UploadOutcome[];
  failed: UploadOutcome[];
}

// `fetch`'s own second-parameter type, derived rather than naming RequestInit
// directly — RequestInit is a type-only DOM global with no runtime value
// backing it, which trips this config's plain (non-type-aware) `no-undef`.
type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

async function adminRequest<T>(path: string, init: FetchInit): Promise<T> {
  const res = await fetch(BASE + path, init);
  if (!res.ok) {
    let message = `${init.method ?? "GET"} ${path} -> ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body && typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      // Body wasn't JSON (or empty) — keep the generic status message.
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export function createAlbum(input: {
  slug: string;
  nameZh: string;
  nameEn: string;
}): Promise<{ slug: string }> {
  return adminRequest("/api/admin/albums", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/**
 * Uploads a batch of photos to `slug` in a single multipart request. `files`,
 * `widths`, `heights` must be the same length and in the same order — the
 * Worker rejects the whole batch otherwise (see worker/src/admin.ts:
 * "widths/heights must have one entry per file, same order"). Callers are
 * expected to have already read each file's dimensions client-side (the
 * Worker has no image library to do it server-side).
 */
export function uploadPhotos(
  slug: string,
  files: File[],
  widths: number[],
  heights: number[],
): Promise<UploadResult> {
  const form = new FormData();
  files.forEach((file, i) => {
    form.append("files", file);
    form.append("widths", String(widths[i]));
    form.append("heights", String(heights[i]));
  });
  // No Content-Type header set here on purpose — the browser fills in the
  // multipart boundary itself; setting it manually would drop the boundary.
  return adminRequest(`/api/admin/albums/${encodeURIComponent(slug)}/photos`, {
    method: "POST",
    body: form,
  });
}

export function updatePhotoSortOrder(id: number, sortOrder: number): Promise<unknown> {
  return adminRequest(`/api/admin/photos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sortOrder }),
  });
}

export function deletePhoto(id: number): Promise<unknown> {
  return adminRequest(`/api/admin/photos/${id}`, { method: "DELETE" });
}

export function setAlbumCover(slug: string, coverKey: string): Promise<unknown> {
  return adminRequest(`/api/admin/albums/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coverKey }),
  });
}
