// 把仓库里的 src/i18n/{zh,en}.json 灌进 D1 的 content 表。
//
// 什么时候跑：
//   1. 第一次启用内容管理系统时（初始化）
//   2. 任何时候直接手改了这两个文件之后 —— 不重新灌，下一次在 /admin 里
//      保存会拿 D1 里的旧副本覆盖掉你的手改
//
// 跑完会把新 version 写进同步服务的标记文件，这样 content-sync 不会把这次
// 灌种误判成一次「管理页保存」而多跑一遍构建。
import { readFileSync, writeFileSync } from "node:fs";
import { query } from "./d1.mjs";
import { VERSION_FILE, LANGS, i18nPath } from "./content-paths.mjs";

const now = new Date().toISOString();

const rows = LANGS.map((lang) => {
  const raw = readFileSync(i18nPath(lang), "utf8");
  JSON.parse(raw); // 先解析一次：宁可在这里炸，也不要把坏 JSON 灌进 D1
  return { lang, raw };
});

// 两条记录必须拿到同一个 version：同步服务只比 MAX(version)，如果 zh 先写
// 成 5、en 还是 4，它会在这中间的某一秒读到「zh 新 en 旧」的组合并发布出去。
const [{ next }] = await query("SELECT COALESCE(MAX(version), 0) + 1 AS next FROM content");

for (const { lang, raw } of rows) {
  await query(
    `INSERT INTO content (lang, data, version, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(lang) DO UPDATE SET data = excluded.data, version = excluded.version, updated_at = excluded.updated_at`,
    [lang, raw, next, now],
  );
  console.log(`  ${lang}: ${raw.length} 字符 -> D1 (version ${next})`);
}

writeFileSync(VERSION_FILE, String(next), "utf8");
console.log(`  标记文件已更新: ${VERSION_FILE} = ${next}`);
