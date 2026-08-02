import { test } from "node:test";
import assert from "node:assert/strict";

// The merge step src/pages/AlbumDetail.tsx runs after every fetchPhotos()
// page: append the new page, but drop anything whose id was already on
// screen. Duplicated here rather than imported — same convention as
// test/cursor.test.mjs / test/image-url.test.mjs (node --test doesn't
// compile TSX). The one real branch worth covering: an overlapping page
// (e.g. a cursor re-used after a retry) must not produce duplicate tiles.
function mergePage(prev, incoming) {
  const seen = new Set(prev.map((p) => p.id));
  return [...prev, ...incoming.filter((p) => !seen.has(p.id))];
}

test("appends a disjoint page in order", () => {
  const prev = [{ id: 1 }, { id: 2 }];
  const merged = mergePage(prev, [{ id: 3 }, { id: 4 }]);
  assert.deepEqual(merged.map((p) => p.id), [1, 2, 3, 4]);
});

test("drops ids already present instead of duplicating tiles", () => {
  const prev = [{ id: 1 }, { id: 2 }, { id: 3 }];
  // id 3 overlaps — e.g. a retried fetch reusing the same cursor.
  const merged = mergePage(prev, [{ id: 3 }, { id: 4 }]);
  assert.deepEqual(merged.map((p) => p.id), [1, 2, 3, 4]);
});

test("first page (prev empty) passes through untouched", () => {
  const merged = mergePage([], [{ id: 1 }, { id: 2 }]);
  assert.deepEqual(merged.map((p) => p.id), [1, 2]);
});
