import { test } from "node:test";
import assert from "node:assert/strict";

// 游标编解码。与 worker/src/albums.ts 保持一致（算法层面 —— worker 里用
// btoa/atob 而不是 Buffer，因为 Workers 运行时默认没有 node:buffer；
// 往返行为和"坏游标不抛异常"这两条不变量在两边都要成立）。
export const encodeCursor = (sort, id) => Buffer.from(`${sort}:${id}`).toString("base64url");
export const decodeCursor = (c) => {
  if (!c) return null;
  const [s, i] = Buffer.from(c, "base64url").toString().split(":");
  const sort = Number(s), id = Number(i);
  return Number.isFinite(sort) && Number.isFinite(id) ? { sort, id } : null;
};

test("游标可往返", () => {
  const c = encodeCursor(3, 42);
  assert.deepEqual(decodeCursor(c), { sort: 3, id: 42 });
});

test("坏游标返回 null 而不是抛异常 —— 用户会手改 URL", () => {
  assert.equal(decodeCursor("not-base64!!"), null);
  assert.equal(decodeCursor(Buffer.from("abc").toString("base64url")), null);
  assert.equal(decodeCursor(""), null);
  assert.equal(decodeCursor(undefined), null);
});

test("按 (sort_order, id) 翻页不重不漏", () => {
  // 模拟 25 条，其中有重复 sort_order —— 这正是只按 sort_order 翻页会出错的场景
  const rows = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, sort: Math.floor(i / 5) }));
  const page = (cur, limit) => {
    const after = decodeCursor(cur);
    const rest = after
      ? rows.filter((r) => r.sort > after.sort || (r.sort === after.sort && r.id > after.id))
      : rows;
    const slice = rest.slice(0, limit);
    const last = slice[slice.length - 1];
    return { slice, next: rest.length > limit ? encodeCursor(last.sort, last.id) : null };
  };
  const seen = [];
  let cur = null;
  for (let guard = 0; guard < 10; guard++) {
    const { slice, next } = page(cur, 10);
    seen.push(...slice.map((r) => r.id));
    if (!next) break;
    cur = next;
  }
  assert.equal(seen.length, 25, `取到 ${seen.length} 条，应为 25`);
  assert.equal(new Set(seen).size, 25, "出现重复");
  assert.deepEqual(seen, rows.map((r) => r.id), "顺序错乱");
});
