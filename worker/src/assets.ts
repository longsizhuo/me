// 单文件图片上传（POST /api/admin/assets），给管理后台「站点文案」里那些
// icon / image 字段用。鉴权已经在 index.ts 里由 access.ts 做过。
//
// 和相册上传（admin.ts 的 uploadPhotos）的区别：这里不写 D1。相册的照片要
// 排序、要设封面，所以有一张表记着；而 logo 只是一个被文案引用的 URL，文案
// 本身就是它的索引，再建一张表只会多一处需要同步的状态。代价是删掉引用后
// R2 里会留下孤儿对象 —— 一个 logo 几十 KB，不值得为它做引用计数。
import type { Env } from "./albums.ts";
import { jsonResponse } from "./albums.ts";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
};

// 站点上的 logo 都是几十 KB 的小图。给到 5MB 已经宽松得多，主要作用是挡住
// 手滑选中原图（几十 MB 的相机 JPEG）—— 那种图当 logo 用会拖垮首屏。
const MAX_BYTES = 5 * 1024 * 1024;

const CDN_BASE = "https://cdn.longsizhuo.com";

function extOf(filename: string): string | null {
  const i = filename.lastIndexOf(".");
  return i < 0 ? null : filename.slice(i + 1).toLowerCase();
}

/**
 * 把原始文件名压成可以安全放进 R2 key 的一段：只留 ASCII 字母数字和连字符。
 *
 * 保留可读的文件名而不是像相册那样纯 UUID，是因为这些对象将来只能靠人在 R2
 * 控制台里辨认 —— 文案里存的是完整 URL，没有任何一张表记着「这个 key 是谁的
 * logo」。名字全没了就等于没法清理。
 */
function slugifyName(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const base = dot < 0 ? filename : filename.slice(0, dot);
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  // 中文文件名会被上面这步清成空串，退回一个固定前缀而不是产生 "-abc123.png"
  return cleaned || "asset";
}

async function uploadAsset(env: Env, request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: "需要 multipart/form-data" }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return jsonResponse({ error: "缺少文件（字段名：file）" }, 400);
  }
  if (file.size === 0) {
    return jsonResponse({ error: "文件是空的" }, 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonResponse(
      { error: `文件 ${(file.size / 1024 / 1024).toFixed(1)}MB，超过 ${MAX_BYTES / 1024 / 1024}MB 上限` },
      400,
    );
  }

  const ext = extOf(file.name);
  // 先取值再判类型，不用 `ext in MIME`：`in` 会走原型链，一个名叫
  // "x.constructor" 的文件能骗过白名单，然后把 Object 的构造函数当
  // contentType 传给 put()。（同 admin.ts 里的同一处考量）
  const mime = ext ? MIME[ext] : undefined;
  if (!ext || typeof mime !== "string") {
    return jsonResponse(
      { error: `不支持的文件类型：${ext ?? "（无扩展名）"}，支持 ${Object.keys(MIME).join("、")}` },
      400,
    );
  }

  const key = `content/${slugifyName(file.name)}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const buffer = await file.arrayBuffer();
  // R2 会拿这个摘要核对它实际收到的字节，对不上就拒绝写入。防的是「传输中途
  // 断了但 Content-Length 仍报完整大小」——这个项目早先真的被这种半截对象
  // 坑过一次，事后比大小是看不出来的，所以在写入时就校验。
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  try {
    await env.BUCKET.put(key, buffer, {
      httpMetadata: {
        contentType: mime,
        // logo 换了就是换了新 key（名字带随机后缀），所以可以放心长缓存。
        cacheControl: "public, max-age=31536000, immutable",
      },
      sha256: digest,
    });
  } catch (err) {
    console.error("me-api: R2 put failed", key, err);
    return jsonResponse({ error: "上传到存储失败" }, 502);
  }

  return jsonResponse({ key, url: `${CDN_BASE}/${key}` });
}

export async function handleAssets(
  method: string,
  request: Request,
  env: Env,
): Promise<Response> {
  if (method === "POST") {return uploadAsset(env, request);}
  return jsonResponse({ error: "method not allowed" }, 405);
}
