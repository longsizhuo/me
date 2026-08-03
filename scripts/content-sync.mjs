// 内容同步服务：轮询 D1 的 content 表，发现有人在 /admin 里保存过就把新文案
// 写回 src/i18n/{zh,en}.json、提交、重新构建、发布。
//
// 为什么需要它：这台机器上的 dist/ 被只读 bind-mount 进了 Caddy 的挂载命名
// 空间，Caddy 直接从那里读文件。也就是说「上线」= 在这台机器上跑一次构建。
// 而管理页跑在浏览器里、写的是 Cloudflare 边缘的 D1，两者之间没有任何入站
// 连接可用（这台机器没有对外开放端口给 Cloudflare 回调），所以只能由本机
// 主动去问。轮询在这里不是偷懒，是拓扑决定的。
//
// 为什么不让前端直接从 API 读文案：那样爬虫拿到的就是空壳。站点的中文名
// SEO 和 GEO 静态文本全靠构建期从这两个 JSON 生成（见 scripts/geo.mjs），
// 文案必须在构建时就落进 HTML。
//
// 用法：
//   node scripts/content-sync.mjs            # 常驻循环
//   node scripts/content-sync.mjs --once     # 检查一次就退出（调试/手动触发用）
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { query } from "./d1.mjs";
import { LANGS, REPO_ROOT, VERSION_FILE, i18nPath } from "./content-paths.mjs";

// 环境变量只为测试而设：重试上限那段逻辑只在常驻进程里成立（--once 每次都是
// 新进程、计数器归零），要验证它就得让一个真进程在几秒内跑完好几轮。
const POLL_MS = Number.parseInt(process.env.CONTENT_SYNC_POLL_MS ?? "", 10) || 30_000;
// 同一个 version 连续失败这么多次就不再重试，等下一次内容变更。否则一份
// 构建不过去的内容会让服务每 30 秒重建一次、直到磁盘写满日志。
const MAX_RETRIES = 3;

const ONCE = process.argv.includes("--once");

const log = (...a) => console.log(new Date().toISOString(), ...a);

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { cwd: REPO_ROOT, encoding: "utf8", ...opts });
}

function localVersion() {
  try {
    return Number.parseInt(readFileSync(VERSION_FILE, "utf8").trim(), 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * 发布一份新文案。任何一步失败都抛错，且保证 dist/ 保持在上一个可用状态。
 */
function publish(rows) {
  // 1. 校验。坏 JSON 在这里就要拦住 —— 写进文件再让构建炸，恢复起来麻烦。
  const parsed = new Map();
  for (const { lang, data } of rows) {
    let obj;
    try {
      obj = JSON.parse(data);
    } catch (err) {
      throw new Error(`${lang}.json 不是合法 JSON: ${err.message}`);
    }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      throw new Error(`${lang}.json 顶层必须是对象`);
    }
    parsed.set(lang, obj);
  }
  // 两种语言的顶层区块必须一致。少一个区块不会让构建失败，但会让那一门
  // 语言的页面悄悄少一整块内容 —— 正是那种没人会发现的故障。
  const keys = LANGS.map((l) => Object.keys(parsed.get(l)).sort().join(","));
  if (new Set(keys).size !== 1) {
    throw new Error(`zh/en 顶层区块不一致，拒绝发布`);
  }

  // 2. 落盘。缩进 2 空格 + 结尾换行，和仓库里原本的格式一致，免得每次同步
  //    都产生一个满屏空白差异的提交。
  for (const { lang } of rows) {
    writeFileSync(i18nPath(lang), `${JSON.stringify(parsed.get(lang), null, 2)}\n`, "utf8");
  }

  // 3. 只提交这两个文件。用路径限定的 commit 而不是 `git add -A`：这台机器
  //    是我平时干活的工作区，同步服务不该把我改到一半的代码顺手提交上去。
  const paths = LANGS.map((l) => `src/i18n/${l}.json`);
  const dirty = sh("git", ["status", "--porcelain", "--", ...paths]).trim();
  if (dirty) {
    sh("git", [
      "-c", "user.name=content-sync",
      "-c", "user.email=content-sync@longsizhuo.com",
      "commit", "-q", "-m", "chore: 从管理页同步站点文案", "--", ...paths,
    ]);
    log("已提交", sh("git", ["rev-parse", "--short", "HEAD"]).trim());
  } else {
    log("文件内容与仓库一致，跳过提交");
  }

  // 4. 先构建到临时目录。绝不能直接 build 到 dist/：vite 会先清空 outDir，
  //    构建万一失败，线上站点就变成一个空目录了。
  const staging = mkdtempSync(join(tmpdir(), "me-build-"));
  try {
    sh("pnpm", ["exec", "vite", "build", "--outDir", staging, "--emptyOutDir"], { stdio: "pipe" });
    // 构建报成功也再确认一次产物像样，防止空产物被 rsync 同步上去。
    const index = statSync(join(staging, "index.html"));
    if (index.size < 500) throw new Error(`产物 index.html 只有 ${index.size} 字节，不像正常构建结果`);

    // 5. 用 rsync 同步内容而不是替换目录。dist/ 这个 inode 是 Caddy 挂载命名
    //    空间里那条只读 bind-mount 的锚点，一旦目录被删掉重建，Caddy 会继续
    //    指向那个已经不存在的旧 inode，全站 404 且重启 Caddy 才能恢复。
    sh("rsync", ["-a", "--delete", `${staging}/`, join(REPO_ROOT, "dist/")]);
    log("已发布，dist inode =", statSync(join(REPO_ROOT, "dist")).ino);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

let failedVersion = 0;
let failures = 0;

async function tick() {
  const remote = await query(
    "SELECT lang, data, version FROM content WHERE lang IN ('zh','en') ORDER BY lang",
  );
  if (remote.length !== LANGS.length) {
    log(`D1 里只有 ${remote.length} 条文案记录，等待 content-seed.mjs 初始化`);
    return;
  }
  const version = Math.max(...remote.map((r) => r.version));
  const local = localVersion();
  if (version <= local) return;

  if (version === failedVersion && failures >= MAX_RETRIES) return;

  log(`发现新文案 version ${local} -> ${version}，开始发布`);
  try {
    publish(remote);
    writeFileSync(VERSION_FILE, String(version), "utf8");
    failedVersion = 0;
    failures = 0;
    log(`version ${version} 发布完成`);
  } catch (err) {
    failures = version === failedVersion ? failures + 1 : 1;
    failedVersion = version;
    log(`发布失败 (${failures}/${MAX_RETRIES}):`, err.message);
    if (failures >= MAX_RETRIES) {
      log(`已放弃 version ${version}，dist 保持在上一个可用版本，等待下一次内容变更`);
    }
  }
}

if (ONCE) {
  await tick();
} else {
  log(`content-sync 启动，每 ${POLL_MS / 1000} 秒检查一次`);
  for (;;) {
    try {
      await tick();
    } catch (err) {
      // 网络抖动、D1 偶发 5xx 之类：记一笔继续轮询，不要让服务退出。
      log("检查失败:", err.message);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}
