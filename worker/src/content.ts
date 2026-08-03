// 站点文案的读写接口（/api/admin/content）。鉴权已经在 index.ts 里由
// access.ts 的 requireAccess 做过，这里只管数据。
//
// 这些接口写的是 D1 的 content 表，不直接影响线上页面 —— 真正的发布由本机的
// scripts/content-sync.mjs 轮询到 version 变大后完成（写回 src/i18n/*.json
// 并重新构建）。原因见那个文件顶部的说明。
import type { Env } from "./albums.ts";
import { jsonResponse } from "./albums.ts";

const LANGS = ["zh", "en"] as const;
type Lang = (typeof LANGS)[number];

// 两份文案加起来现在约 20KB。留出几十倍余量即可 —— 这个上限存在的意义是
// 防止一次误操作把 D1 的行大小配额撑爆，不是精确的业务限制。
const MAX_CHARS = 512 * 1024;

interface ContentRow {
  lang: string;
  data: string;
  version: number;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * 校验一份待保存的文案。返回错误信息，null 表示通过。
 *
 * 这里的规则和 scripts/content-sync.mjs 里的 publish() 是同一套，两边都做：
 * Worker 这边做是为了让管理页当场看到错误，同步服务那边做是因为它才是真正
 * 决定要不要发布的那一环，不能把安全性寄托在调用方身上。
 */
function validate(payload: Record<string, unknown>): string | null {
  const objs: Record<Lang, Record<string, unknown>> = {} as never;
  for (const lang of LANGS) {
    const v = payload[lang];
    if (!isPlainObject(v)) {return `${lang} 必须是一个对象`;}
    objs[lang] = v;
  }
  // 顶层区块必须两种语言一致。少一块不会让构建失败，只会让那门语言的页面
  // 悄悄少一整段内容 —— 属于没人会察觉的故障。
  const shapes = LANGS.map((l) => Object.keys(objs[l]).sort().join(","));
  if (new Set(shapes).size !== 1) {
    const only = (a: Lang, b: Lang) =>
      Object.keys(objs[a]).filter((k) => !(k in objs[b]));
    const missingInEn = only("zh", "en");
    const missingInZh = only("en", "zh");
    const parts = [
      missingInEn.length ? `en 缺少：${missingInEn.join("、")}` : "",
      missingInZh.length ? `zh 缺少：${missingInZh.join("、")}` : "",
    ].filter(Boolean);
    return `中英文的内容区块必须一一对应（${parts.join("；")}）`;
  }
  for (const lang of LANGS) {
    if (JSON.stringify(objs[lang]).length > MAX_CHARS) {
      return `${lang} 内容过大，超过 ${MAX_CHARS} 字符上限`;
    }
  }
  return null;
}

async function readContent(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT lang, data, version FROM content WHERE lang IN ('zh','en')",
  ).all<ContentRow>();

  const byLang = new Map(results.map((r) => [r.lang, r]));
  const out: Record<string, unknown> = {};
  for (const lang of LANGS) {
    const row = byLang.get(lang);
    if (!row) {
      // 只可能是还没跑过 scripts/content-seed.mjs。说清楚该干什么，
      // 别让管理页只显示一个空表单让人以为文案丢了。
      return jsonResponse(
        { error: `D1 里还没有 ${lang} 的文案，请先在服务器上运行 scripts/content-seed.mjs` },
        503,
      );
    }
    try {
      out[lang] = JSON.parse(row.data);
    } catch {
      return jsonResponse({ error: `D1 中 ${lang} 的文案不是合法 JSON` }, 500);
    }
  }
  out.version = Math.max(...results.map((r) => r.version));
  return jsonResponse(out);
}

async function writeContent(env: Env, request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "请求体不是合法 JSON" }, 400);
  }
  if (!isPlainObject(payload)) {
    return jsonResponse({ error: "请求体必须是一个对象" }, 400);
  }

  const invalid = validate(payload);
  if (invalid) {return jsonResponse({ error: invalid }, 400);}

  const { results } = await env.DB.prepare(
    "SELECT COALESCE(MAX(version), 0) AS version FROM content",
  ).all<{ version: number }>();
  const current = results[0]?.version ?? 0;

  // 乐观并发：管理页保存时把自己读到的 version 带回来。对不上说明这中间
  // 有人（另一个标签页、另一台设备）存过一次，直接覆盖会把那次改动无声吞掉。
  const base = payload.baseVersion;
  if (typeof base !== "number" || !Number.isInteger(base)) {
    return jsonResponse({ error: "缺少 baseVersion" }, 400);
  }
  if (base !== current) {
    return jsonResponse(
      { error: `内容已被其他人修改（你基于 v${base}，当前是 v${current}），请刷新后重试`, version: current },
      409,
    );
  }

  const next = current + 1;
  const now = new Date().toISOString();
  // batch 保证两种语言同一个 version 一起落库。分两次写的话，同步服务可能
  // 正好在中间那一刻读到「zh 是新的、en 还是旧的」并把它发布出去。
  await env.DB.batch(
    LANGS.map((lang) =>
      env.DB.prepare(
        `INSERT INTO content (lang, data, version, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(lang) DO UPDATE SET data = excluded.data, version = excluded.version, updated_at = excluded.updated_at`,
      ).bind(lang, JSON.stringify(payload[lang]), next, now),
    ),
  );

  return jsonResponse({ ok: true, version: next });
}

export async function handleContent(
  method: string,
  request: Request,
  env: Env,
): Promise<Response> {
  if (method === "GET") {return readContent(env);}
  if (method === "PUT") {return writeContent(env, request);}
  return jsonResponse({ error: "method not allowed" }, 405);
}
