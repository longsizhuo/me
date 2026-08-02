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
): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined) {
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchAlbums(lang?: Lang): Promise<AlbumSummary[]> {
  return get<AlbumSummary[]>("/api/albums", { lang });
}

export function fetchAlbum(
  slug: string,
  opts: { lang?: Lang; limit?: number } = {},
): Promise<AlbumDetail> {
  return get<AlbumDetail>(`/api/albums/${encodeURIComponent(slug)}`, opts);
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
