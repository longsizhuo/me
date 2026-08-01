import { test } from "node:test";
import assert from "node:assert/strict";
import { r2Key, mimeOf } from "../scripts/r2.mjs";

test("r2Key 剥离本地前缀并加上 R2 前缀", () => {
  assert.equal(
    r2Key("src/assets/album/2025-Kwai/a.jpg", "src/assets/album", "album"),
    "album/2025-Kwai/a.jpg"
  );
});

test("r2Key 保留文件名里的空格，不做转义", () => {
  assert.equal(
    r2Key("public/USYDCodingFest/Coding Fest 2024 AWARDS_-516.jpg",
          "public/USYDCodingFest", "_archive/USYDCodingFest"),
    "_archive/USYDCodingFest/Coding Fest 2024 AWARDS_-516.jpg"
  );
});

test("r2Key 不产生重复斜杠", () => {
  assert.equal(r2Key("public/planet/scene.bin", "public/planet", "models/planet"),
               "models/planet/scene.bin");
  assert.ok(!r2Key("public/planet/scene.bin", "public/planet", "models/planet").includes("//"));
});

test("mimeOf 按扩展名给出正确 MIME", () => {
  assert.equal(mimeOf("a.JPG"), "image/jpeg");
  assert.equal(mimeOf("scene.gltf"), "model/gltf+json");
  assert.equal(mimeOf("scene.bin"), "application/octet-stream");
  assert.equal(mimeOf("x.unknown"), "application/octet-stream");
});
