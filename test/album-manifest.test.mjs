import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const album = JSON.parse(readFileSync("src/content/album.json", "utf8"));

// cdnUrl 的逻辑复制一份到测试里：src/content/index.ts 是 TS，
// node --test 不编译 TS。这几行足够简单，重复比引入编译步骤划算。
const cdnUrl = (key) =>
  `https://cdn.longsizhuo.com/${key.split("/").map(encodeURIComponent).join("/")}`;

test("每个相册都有 id、folder 和至少一张照片", () => {
  assert.ok(album.length > 0, "清单不能是空的");
  for (const g of album) {
    assert.ok(g.id, `相册缺 id: ${JSON.stringify(g)}`);
    assert.ok(g.folder, `相册缺 folder: ${g.id}`);
    assert.ok(g.photos.length > 0, `相册 ${g.id} 没有照片`);
  }
});

test("每张照片都有非零宽高——否则瀑布流会塌成 0 高度", () => {
  for (const g of album) {
    for (const p of g.photos) {
      assert.ok(p.w > 0 && p.h > 0, `${p.key} 宽高缺失: ${p.w}x${p.h}`);
    }
  }
});

test("照片 key 全局唯一", () => {
  const keys = album.flatMap((g) => g.photos.map((p) => p.key));
  assert.equal(new Set(keys).size, keys.length, "存在重复 key");
});

test("cdnUrl 转义空格但保留路径分隔符", () => {
  assert.equal(
    cdnUrl("album/2025 Kwai/a b.jpg"),
    "https://cdn.longsizhuo.com/album/2025%20Kwai/a%20b.jpg"
  );
});
