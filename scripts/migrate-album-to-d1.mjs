// scripts/migrate-album-to-d1.mjs
// 一次性迁移脚本：把现有 R2 相册照片 + 归档的 17 张 USYD Coding Fest 照片
// 整理进 D1 的 albums / photos 表。
//
// 用法：
//   node scripts/migrate-album-to-d1.mjs migrate
//     把 _archive/USYDCodingFest/ 下的照片复制到 album/2024-usyd-coding-fest/，
//     每张上传后立刻读回校验字节数，全部通过才生成 SQL 文件（不删除旧 key）。
//   node scripts/migrate-album-to-d1.mjs cleanup
//     确认 D1 已写入、验证查询通过之后再跑：重新核对一遍新 key 字节数，
//     全部一致才删除 _archive/USYDCodingFest/ 下的旧 key。
//
// R2 没有 rename，只能复制后删除；三个相册里只有这一组需要搬 key，
// 2025-Kwai / 2025-UNSW 已经在 album/ 前缀下，原地写入 D1 即可。

import { readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  putObject,
  listObjects,
  listObjectsMeta,
  getObject,
  deleteObject,
  mimeOf,
} from "./r2.mjs";

const ARCHIVE_OLD_PREFIX = "_archive/USYDCodingFest/";
const ARCHIVE_NEW_PREFIX = "album/2024-usyd-coding-fest/";
const EXPECTED_ARCHIVE_COUNT = 17;

const ALBUMS = [
  { slug: "2025-kwai", name_zh: "2025 快手", name_en: "2025 Kuaishou", sort_order: 0 },
  { slug: "2025-unsw", name_zh: "2025 UNSW", name_en: "2025 UNSW", sort_order: 1 },
  {
    slug: "2024-usyd-coding-fest",
    name_zh: "2024 悉尼大学编程节",
    name_en: "2024 USYD Coding Fest",
    sort_order: 2,
  },
];

/** 用系统 ImageMagick 读宽高 */
function dimensions(file) {
  const out = execFileSync("identify", ["-format", "%w %h", `${file}[0]`], {
    encoding: "utf8",
  });
  const [w, h] = out.trim().split(/\s+/).map(Number);
  if (!Number.isFinite(w) || !Number.isFinite(h)) {
    throw new Error(`identify 输出无法解析: ${out}`);
  }
  return { w, h };
}

function esc(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

async function existingAlbumPhotos(folder) {
  const manifest = JSON.parse(await readFile("src/content/album.json", "utf8"));
  const entry = manifest.find((a) => a.folder === folder);
  if (!entry) throw new Error(`album.json 里没找到 folder=${folder}`);
  return [...entry.photos].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

/** 复制阶段：下载旧 key、读宽高、上传新 key、读回新 key 校验字节数。全通过才生成 SQL */
async function migrate() {
  const oldMeta = (await listObjectsMeta(ARCHIVE_OLD_PREFIX)).sort((a, b) =>
    a.key < b.key ? -1 : a.key > b.key ? 1 : 0
  );
  console.log(`_archive/ 下 ${oldMeta.length} 个对象待搬运`);
  if (oldMeta.length !== EXPECTED_ARCHIVE_COUNT) {
    throw new Error(
      `期望 ${EXPECTED_ARCHIVE_COUNT} 张归档照片，实际列出 ${oldMeta.length} 张，先停下核实`
    );
  }

  const results = [];
  for (const [i, { key, size }] of oldMeta.entries()) {
    const filename = key.slice(ARCHIVE_OLD_PREFIX.length);
    const newKey = ARCHIVE_NEW_PREFIX + filename;
    process.stdout.write(`[${i + 1}/${oldMeta.length}] ${filename} (${size} bytes)\n`);

    const buf = await getObject(key);
    if (buf.byteLength !== size) {
      throw new Error(
        `下载字节数不一致 ${key}: R2 报告 ${size}，实际下载 ${buf.byteLength}`
      );
    }

    const tmpFile = join(tmpdir(), `${randomUUID()}-${filename}`);
    await writeFile(tmpFile, buf);
    let dim;
    try {
      dim = dimensions(tmpFile);
      await putObject(newKey, tmpFile, mimeOf(filename));
    } finally {
      await rm(tmpFile, { force: true });
    }

    // 新 key 必须能读回，且字节数与旧对象一致，这一张才算搬运成功
    const newBuf = await getObject(newKey);
    if (newBuf.byteLength !== size) {
      throw new Error(
        `新 key 字节数不一致 ${newKey}: 期望 ${size}，实际 ${newBuf.byteLength}`
      );
    }

    results.push({ oldKey: key, newKey, filename, w: dim.w, h: dim.h, size });
  }

  console.log(
    `\n全部 ${results.length} 张校验通过（新 key 可读回、字节数与旧对象一致）。`
  );
  console.log("旧 key 尚未删除。请先用生成的 SQL 写 D1、跑验证查询，再执行 cleanup。\n");

  await writeSql(results);
}

async function writeSql(archiveResults) {
  const now = new Date().toISOString();
  const lines = [];

  const albumRows = [
    { ...ALBUMS[0], photos: (await existingAlbumPhotos("2025-Kwai")).map((p) => ({ key: p.key, w: p.w, h: p.h })) },
    { ...ALBUMS[1], photos: (await existingAlbumPhotos("2025-UNSW")).map((p) => ({ key: p.key, w: p.w, h: p.h })) },
    { ...ALBUMS[2], photos: archiveResults.map((r) => ({ key: r.newKey, w: r.w, h: r.h })) },
  ];

  for (const album of albumRows) {
    const coverKey = album.photos[0]?.key ?? null;
    lines.push(
      `INSERT INTO albums (slug, name_zh, name_en, description_zh, description_en, cover_key, sort_order, photo_count, created_at) VALUES (` +
        `${esc(album.slug)}, ${esc(album.name_zh)}, ${esc(album.name_en)}, '', '', ` +
        `${coverKey ? esc(coverKey) : "NULL"}, ${album.sort_order}, ${album.photos.length}, ${esc(now)});`
    );
  }
  for (const album of albumRows) {
    album.photos.forEach((p, i) => {
      lines.push(
        `INSERT INTO photos (album_id, key, w, h, sort_order, created_at) VALUES (` +
          `(SELECT id FROM albums WHERE slug = ${esc(album.slug)}), ${esc(p.key)}, ${p.w}, ${p.h}, ${i}, ${esc(now)});`
      );
    });
  }

  const outPath = join(tmpdir(), `me-db-migrate-${Date.now()}.sql`);
  await writeFile(outPath, lines.join("\n") + "\n");
  console.log(`SQL 已生成：${outPath}`);
  console.log(`执行：npx wrangler d1 execute me-db --remote --file=${outPath}`);
}

/** 删除阶段：重新核对新 key 字节数，全部一致才删旧 key */
async function cleanup() {
  const newMeta = await listObjectsMeta(ARCHIVE_NEW_PREFIX);
  if (newMeta.length !== EXPECTED_ARCHIVE_COUNT) {
    throw new Error(
      `期望新前缀下有 ${EXPECTED_ARCHIVE_COUNT} 个对象，实际 ${newMeta.length}，不删除旧 key`
    );
  }

  const oldMeta = await listObjectsMeta(ARCHIVE_OLD_PREFIX);
  const oldByFilename = new Map(
    oldMeta.map((o) => [o.key.slice(ARCHIVE_OLD_PREFIX.length), o.size])
  );
  if (oldByFilename.size !== EXPECTED_ARCHIVE_COUNT) {
    throw new Error(
      `期望旧前缀下还有 ${EXPECTED_ARCHIVE_COUNT} 个对象，实际 ${oldByFilename.size}`
    );
  }

  for (const [i, { key: newKey, size: newSize }] of newMeta.entries()) {
    const filename = newKey.slice(ARCHIVE_NEW_PREFIX.length);
    const oldSize = oldByFilename.get(filename);
    if (oldSize === undefined) {
      throw new Error(`旧前缀下找不到对应文件：${filename}`);
    }
    if (oldSize !== newSize) {
      throw new Error(`字节数不一致，停止删除：${filename} 旧=${oldSize} 新=${newSize}`);
    }
    process.stdout.write(`[${i + 1}/${newMeta.length}] 核对通过 ${filename}\n`);
  }

  for (const filename of oldByFilename.keys()) {
    const oldKey = ARCHIVE_OLD_PREFIX + filename;
    await deleteObject(oldKey);
    console.log(`已删除 ${oldKey}`);
  }

  const remaining = await listObjects(ARCHIVE_OLD_PREFIX);
  console.log(`_archive/USYDCodingFest/ 剩余对象数：${remaining.length}`);
}

const mode = process.argv[2];
if (mode === "migrate") await migrate();
else if (mode === "cleanup") await cleanup();
else {
  console.error("用法: node scripts/migrate-album-to-d1.mjs <migrate|cleanup>");
  process.exit(1);
}
