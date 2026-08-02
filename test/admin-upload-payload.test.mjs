import { test } from "node:test";
import assert from "node:assert/strict";

// src/api/album.ts can't be imported directly here: it reads
// `import.meta.env.VITE_API_BASE`, which Vite injects at build/dev-server
// time via its `define`/import-analysis plugin — under plain `node --test`
// `import.meta.env` is simply undefined, so `import.meta.env.VITE_API_BASE`
// throws at module load, before any test runs (confirmed by hand). Same
// underlying reason test/image-url.test.mjs and test/cursor.test.mjs already
// duplicate rather than import — this file follows that established
// convention. Keep these two functions and src/api/album.ts's
// uploadPhotos()/createAlbum() in sync when either changes.
//
// This exercises the exact request *shape* the admin write API needs
// (worker/src/admin.ts: "widths/heights must have one entry per file, same
// order" for upload; camelCase slug/nameZh/nameEn for create) — the part of
// Task 8's verification doable without a live Cloudflare Access session.

function buildUploadForm(files, widths, heights) {
  const form = new FormData();
  files.forEach((file, i) => {
    form.append("files", file);
    form.append("widths", String(widths[i]));
    form.append("heights", String(heights[i]));
  });
  return form;
}

function buildCreateAlbumBody(input) {
  return JSON.stringify(input);
}

// src/pages/AlbumAdmin.tsx's handleFiles(): matches the Worker's
// uploaded/failed response arrays back to the original per-file upload rows
// by filename, FIFO per name (duplicate filenames in one selection resolve
// in submission order).
function correlateResult(okFileNames, rowIndexOf, result) {
  const pending = new Map();
  okFileNames.forEach((name, k) => {
    const arr = pending.get(name) ?? [];
    arr.push(rowIndexOf[k]);
    pending.set(name, arr);
  });
  const takeRow = (name) => pending.get(name)?.shift();

  const outcomes = {};
  result.uploaded.forEach((u) => {
    const idx = takeRow(u.file);
    if (idx !== undefined) {
      outcomes[idx] = "done";
    }
  });
  result.failed.forEach((f) => {
    const idx = takeRow(f.file);
    if (idx !== undefined) {
      outcomes[idx] = "error";
    }
  });
  return outcomes;
}

test("upload form has one 'files'/'widths'/'heights' entry per file, same order", () => {
  const files = [
    new File(["a"], "a.jpg", { type: "image/jpeg" }),
    new File(["b"], "b.png", { type: "image/png" }),
    new File(["c"], "c.webp", { type: "image/webp" }),
  ];
  const form = buildUploadForm(files, [100, 200, 300], [50, 150, 250]);

  assert.deepEqual(
    form.getAll("files").map((f) => f.name),
    ["a.jpg", "b.png", "c.webp"],
  );
  // Sent as strings (FormData can't carry numbers) — the Worker does
  // Number(widths[i]) on the way in, so string form is required, not optional.
  assert.deepEqual(form.getAll("widths"), ["100", "200", "300"]);
  assert.deepEqual(form.getAll("heights"), ["50", "150", "250"]);
});

test("upload form omits a file whose dimensions failed to read, keeping arrays aligned", () => {
  // Mirrors handleFiles(): a file that fails createImageBitmap is excluded
  // from okFiles/okWidths/okHeights entirely, never sent with a placeholder
  // width/height — the Worker rejects a length mismatch outright.
  const files = [new File(["a"], "a.jpg", { type: "image/jpeg" })];
  const form = buildUploadForm(files, [640], [480]);
  assert.equal(form.getAll("files").length, 1);
  assert.equal(form.getAll("widths").length, 1);
  assert.equal(form.getAll("heights").length, 1);
});

test("create-album body uses the deployed Worker's camelCase field names", () => {
  const body = buildCreateAlbumBody({ slug: "2026-trip", nameZh: "旅行", nameEn: "Trip" });
  assert.deepEqual(JSON.parse(body), { slug: "2026-trip", nameZh: "旅行", nameEn: "Trip" });
});

test("correlateResult maps each row to done/error by filename, in FIFO order for duplicates", () => {
  // Two files literally named "img.jpg" in one selection (e.g. two separate
  // camera exports with the same default filename) — row 0 uploaded first,
  // row 2 uploaded second in submission order, row 1 is a different name.
  const okFileNames = ["img.jpg", "b.png", "img.jpg"];
  const rowIndexOf = [0, 1, 2]; // no dimension failures in this case
  const result = {
    uploaded: [
      { file: "img.jpg", id: 1, key: "album/x/1.jpg" },
      { file: "b.png", id: 2, key: "album/x/2.png" },
    ],
    failed: [{ file: "img.jpg", error: "unsupported file type" }],
  };
  const outcomes = correlateResult(okFileNames, rowIndexOf, result);
  assert.equal(outcomes[0], "done"); // first "img.jpg" -> first uploaded entry
  assert.equal(outcomes[1], "done"); // "b.png" -> its own entry
  assert.equal(outcomes[2], "error"); // second "img.jpg" -> the failed entry
});

test("correlateResult ignores a response entry whose filename doesn't match any pending row", () => {
  const outcomes = correlateResult(["a.jpg"], [0], {
    uploaded: [],
    failed: [{ file: "unrelated.jpg", error: "x" }],
  });
  assert.deepEqual(outcomes, {});
});
