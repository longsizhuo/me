// worker/src/assets.ts 的 handleAssets：用一个假的 R2 桶把整个处理函数真跑一遍，
// 而不是只测几个纯函数。这条路径的真实 HTTP 调用被 Cloudflare Access 挡着，
// 本地没有 Access 会话就发不出去，所以覆盖只能落在这一层。
import { test } from "node:test";
import assert from "node:assert/strict";
import { handleAssets } from "../worker/src/assets.ts";

/** 记录每次 put 的假桶。返回 { env, puts }。 */
function fakeEnv({ fail = false } = {}) {
  const puts = [];
  const env = {
    BUCKET: {
      put(key, body, options) {
        if (fail) throw new Error("simulated R2 failure");
        puts.push({ key, bytes: body.byteLength, options });
        return Promise.resolve();
      },
    },
  };
  return { env, puts };
}

function upload(file) {
  const form = new FormData();
  if (file) form.append("file", file);
  return new Request("https://longsizhuo.com/api/admin/assets", {
    method: "POST",
    body: form,
  });
}

const png = (name, size = 32) => new File([new Uint8Array(size)], name, { type: "image/png" });

test("上传成功后返回 content/ 下的 key 和完整 CDN 地址", async () => {
  const { env, puts } = fakeEnv();
  const res = await handleAssets("POST", upload(png("Kwai Logo.png")), env);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.match(body.key, /^content\/kwai-logo-[0-9a-f]{8}\.png$/);
  assert.equal(body.url, `https://cdn.longsizhuo.com/${body.key}`);
  assert.equal(puts.length, 1);
  assert.equal(puts[0].key, body.key);
});

test("同名文件两次上传不会互相覆盖", async () => {
  const { env } = fakeEnv();
  const a = await (await handleAssets("POST", upload(png("logo.png")), env)).json();
  const b = await (await handleAssets("POST", upload(png("logo.png")), env)).json();
  assert.notEqual(a.key, b.key);
});

test("纯中文文件名不会产生以连字符开头的 key", async () => {
  const { env } = fakeEnv();
  const body = await (await handleAssets("POST", upload(png("公司标志.png")), env)).json();
  assert.match(body.key, /^content\/asset-[0-9a-f]{8}\.png$/);
});

test("写入时带上 sha256，让 R2 自己拒绝半截 body", async () => {
  const { env, puts } = fakeEnv();
  await handleAssets("POST", upload(png("a.png", 64)), env);
  assert.ok(puts[0].options.sha256 instanceof ArrayBuffer);
  assert.equal(puts[0].options.sha256.byteLength, 32);
  assert.equal(puts[0].options.httpMetadata.contentType, "image/png");
});

test("不支持的扩展名被拒绝，且没有任何东西写进 R2", async () => {
  const { env, puts } = fakeEnv();
  const res = await handleAssets("POST", upload(new File([new Uint8Array(8)], "evil.exe")), env);
  assert.equal(res.status, 400);
  assert.equal(puts.length, 0);
});

test("MIME 白名单不吃原型链上的属性名", async () => {
  const { env, puts } = fakeEnv();
  // `ext in MIME` 会让这个文件通过，然后把 Object 的构造函数当 contentType。
  for (const name of ["x.constructor", "x.toString", "x.valueOf"]) {
    const res = await handleAssets("POST", upload(new File([new Uint8Array(8)], name)), env);
    assert.equal(res.status, 400, `${name} 应当被拒绝`);
  }
  assert.equal(puts.length, 0);
});

test("超过 5MB 被拒绝", async () => {
  const { env, puts } = fakeEnv();
  const res = await handleAssets("POST", upload(png("big.png", 5 * 1024 * 1024 + 1)), env);
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /上限/);
  assert.equal(puts.length, 0);
});

test("空文件被拒绝", async () => {
  const { env, puts } = fakeEnv();
  const res = await handleAssets("POST", upload(png("empty.png", 0)), env);
  assert.equal(res.status, 400);
  assert.equal(puts.length, 0);
});

test("没有 file 字段时报错而不是崩溃", async () => {
  const { env } = fakeEnv();
  const res = await handleAssets("POST", upload(null), env);
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /file/);
});

test("R2 写入失败返回 502 而不是假装成功", async () => {
  const { env } = fakeEnv({ fail: true });
  const res = await handleAssets("POST", upload(png("a.png")), env);
  assert.equal(res.status, 502);
});

test("GET 之类的方法返回 405", async () => {
  const { env } = fakeEnv();
  const res = await handleAssets("GET", upload(png("a.png")), env);
  assert.equal(res.status, 405);
});
