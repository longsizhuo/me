import { test } from "node:test";
import assert from "node:assert/strict";

// 与 src/content/images.ts 保持一致。node --test 不编译 TS，
// 这里重复一份实现 —— 同 test/lang-from-path.test.mjs 的既有做法。
// 改 imageUrl 时两处都要改。
const CDN = "https://cdn.longsizhuo.com";
function imageUrl(key, opts = {}) {
  const enc = key.split("/").map(encodeURIComponent).join("/");
  const parts = [];
  if (opts.width) parts.push(`width=${opts.width}`);
  if (opts.height) parts.push(`height=${opts.height}`);
  if (opts.fit) parts.push(`fit=${opts.fit}`);
  parts.push("format=auto");
  return `${CDN}/cdn-cgi/image/${parts.join(",")}/${enc}`;
}

test("生成带宽度的变换 URL", () => {
  assert.equal(
    imageUrl("album/2025-Kwai/a.jpg", { width: 400 }),
    "https://cdn.longsizhuo.com/cdn-cgi/image/width=400,format=auto/album/2025-Kwai/a.jpg"
  );
});

test("文件名里的空格和括号被转义，路径分隔符保留", () => {
  const u = imageUrl("album/2025-Kwai/image (2).jpg", { width: 600 });
  assert.ok(u.includes("image%20(2).jpg"), `未正确转义: ${u}`);
  // 8 = "https://" 的两条 + cdn-cgi/ image/ options/ album/ 2025-Kwai/ 各一条
  assert.equal((u.match(/\//g) || []).length, 8, `路径段数不对: ${u}`);
});

test("format=auto 总是存在 —— 少了它就发不出 AVIF/WebP", () => {
  assert.ok(imageUrl("a/b.jpg").includes("format=auto"));
  assert.ok(imageUrl("a/b.jpg", { width: 100 }).includes("format=auto"));
});

test("不传选项时也是合法的变换 URL，不会退化成原图地址", () => {
  const u = imageUrl("album/x/y.jpg");
  assert.ok(u.includes("/cdn-cgi/image/"), `退化成了原图: ${u}`);
});
