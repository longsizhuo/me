// src/content/index.ts

export const CDN_BASE = "https://cdn.longsizhuo.com";

/**
 * R2 key → 可访问 URL。key 里的空格等字符必须转义，
 * 但 / 要保留成路径分隔符。
 */
export function cdnUrl(key: string): string {
  return `${CDN_BASE}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
