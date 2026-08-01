// scripts/r2.mjs
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, relative } from "node:path";

const ACCOUNT_ID = "e604afaf71a0dab4d6beb8f7ec2eca66";
const BUCKET = "me-assets";
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}`;

let cachedToken;
async function token() {
  if (cachedToken) return cachedToken;
  cachedToken =
    process.env.CF_API_TOKEN ??
    (await readFile(join(homedir(), ".cloudflare-token"), "utf8")).trim();
  return cachedToken;
}

const MIME = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", svg: "image/svg+xml", bin: "application/octet-stream",
  gltf: "model/gltf+json", txt: "text/plain",
};

export function mimeOf(path) {
  return MIME[path.split(".").pop().toLowerCase()] ?? "application/octet-stream";
}

/**
 * 本地路径 → R2 key。空格等字符原样保留，由 encodeURIComponent 在请求时处理。
 * r2Key("public/USYDCodingFest/a b.jpg", "public/USYDCodingFest", "_archive/USYDCodingFest")
 *   === "_archive/USYDCodingFest/a b.jpg"
 */
export function r2Key(localPath, stripPrefix, keyPrefix) {
  const rel = relative(stripPrefix, localPath).split("\\").join("/");
  return `${keyPrefix}/${rel}`;
}

export async function putObject(key, filePath, contentType = mimeOf(filePath)) {
  const body = await readFile(filePath);
  // key 里的 / 要保留成路径分隔符，只转义各段内部的特殊字符
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(`${API}/objects/${encoded}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${await token()}`,
      "Content-Type": contentType,
      "Content-Length": String(body.byteLength),
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`PUT ${key} failed: ${res.status} ${await res.text()}`);
  }
}

export async function listObjects(prefix) {
  const keys = [];
  let cursor;
  do {
    const url = new URL(`${API}/objects`);
    url.searchParams.set("prefix", prefix);
    url.searchParams.set("per_page", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${await token()}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error(JSON.stringify(data.errors));
    keys.push(...data.result.map((o) => o.key));
    cursor = data.result_info?.cursor || undefined;
  } while (cursor);
  return keys;
}
