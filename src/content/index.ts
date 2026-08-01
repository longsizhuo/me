// src/content/index.ts
import albumManifest from "./album.json";

export const CDN_BASE = "https://cdn.longsizhuo.com";

export interface AlbumPhoto {
  key: string;
  w: number;
  h: number;
}

export interface AlbumGroup {
  id: string;
  folder: string;
  photos: AlbumPhoto[];
}

export const album = albumManifest as AlbumGroup[];

/**
 * R2 key → 可访问 URL。key 里的空格等字符必须转义，
 * 但 / 要保留成路径分隔符。
 */
export function cdnUrl(key: string): string {
  return `${CDN_BASE}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
