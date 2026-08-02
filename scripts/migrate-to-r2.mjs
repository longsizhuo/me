// scripts/migrate-to-r2.mjs
// 一次性迁移脚本。用法：node scripts/migrate-to-r2.mjs <group>
// group: album | models | archive | logos
import { execFileSync } from "node:child_process";
import { readdir, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { putObject, listObjects, r2Key, mimeOf } from "./r2.mjs";

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

/** 用系统 ImageMagick 读宽高，避免为一次性脚本引入依赖 */
function dimensions(file) {
  try {
    const out = execFileSync("identify", ["-format", "%w %h", `${file}[0]`], {
      encoding: "utf8",
    });
    const [w, h] = out.trim().split(/\s+/).map(Number);
    return Number.isFinite(w) && Number.isFinite(h) ? { w, h } : null;
  } catch {
    return null;
  }
}

/** 串行上传。104 个文件，并发省不下多少时间，串行的错误信息清楚得多 */
async function uploadAll(files, stripPrefix, keyPrefix) {
  const keys = [];
  for (const [i, f] of files.entries()) {
    const key = r2Key(f, stripPrefix, keyPrefix);
    process.stdout.write(`[${i + 1}/${files.length}] ${key}\n`);
    await putObject(key, f, mimeOf(f));
    keys.push(key);
  }
  return keys;
}

const GROUPS = {
  // album 分组已退休：照片元数据现在存 D1，上传走 /album/admin，
  // 不再有 src/content/album.json 这个清单文件。
  // logos / models / archive 三组仍然可用，用于一次性批量上传。

  models: async () => {
    for (const d of ["desktop_pc", "planet"]) {
      const files = (await walk(join("public", d))).sort();
      await uploadAll(files, "public", "models");
    }
  },

  archive: async () => {
    const files = (await walk("public/USYDCodingFest")).sort();
    await uploadAll(files, "public/USYDCodingFest", "_archive/USYDCodingFest");
  },

  logos: async () => {
    const dirs = ["src/assets/awards", "src/assets/company", "src/assets/education",
                  "src/assets/kwai-vector-logo-seeklogo", "src/assets/SpotFinder"];
    for (const d of dirs) {
      const files = (await walk(d)).sort();
      await uploadAll(files, "src/assets", "logos");
    }
    for (const f of ["src/assets/IMG_2862.webp", "src/assets/1234.webp"]) {
      await putObject(r2Key(f, "src/assets", "logos"), f, mimeOf(f));
      console.log(`logos/${f.split("/").pop()}`);
    }
  },
};

const group = process.argv[2];
if (!GROUPS[group]) {
  console.error(`用法: node scripts/migrate-to-r2.mjs <${Object.keys(GROUPS).join("|")}>`);
  process.exit(1);
}
await GROUPS[group]();
const prefix = { album: "album/", models: "models/", archive: "_archive/", logos: "logos/" }[group];
console.log(`R2 上 ${prefix} 现有 ${(await listObjects(prefix)).length} 个对象`);
