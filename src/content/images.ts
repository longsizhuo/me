// src/content/images.ts
const CDN = "https://cdn.longsizhuo.com";

export interface ImageUrlOptions {
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "scale-down";
}

/**
 * R2 里的相册原图是未压缩的单份原件（有的 10MB、2400万像素），从不直接
 * 对外served。这个函数是全站唯一拼 Cloudflare Images 变换 URL
 * （/cdn-cgi/image/<options>/<source>）的地方 —— 一张 1364KB 的原图，
 * 用 width=400,format=auto 拿到的是 26KB 的 AVIF。
 *
 * format=auto 永远追加在最后：漏了它 Cloudflare 就会原样吐出原图格式，
 * 变换等于白做。key 里的空格、括号等字符要逐段 encodeURIComponent，
 * 但 "/" 必须保留成路径分隔符 —— 与 src/content/index.ts 的 cdnUrl 一致。
 */
export function imageUrl(key: string, opts: ImageUrlOptions = {}): string {
  const enc = key.split("/").map(encodeURIComponent).join("/");
  const parts: string[] = [];
  if (opts.width) {
    parts.push(`width=${opts.width}`);
  }
  if (opts.height) {
    parts.push(`height=${opts.height}`);
  }
  if (opts.fit) {
    parts.push(`fit=${opts.fit}`);
  }
  parts.push("format=auto");
  return `${CDN}/cdn-cgi/image/${parts.join(",")}/${enc}`;
}
