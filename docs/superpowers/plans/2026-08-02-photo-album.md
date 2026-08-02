# 相册重构 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把首页一个 520px 滚动框里的 7 张照片，变成能承载上千张、按相册组织、可分享可索引、并且我自己能随时上传整理的照片集。

**Architecture:** D1 存元数据，R2 存唯一一份原图，Cloudflare Images 变换按需生成尺寸，一个 Worker 提供公开读接口和 Access 保护的写接口，前端加 `/album` 列表页和 `/album/:slug` 详情页，首页降级为 12 张预览条。

**Tech Stack:** Cloudflare D1 / Workers / R2 / Images transformations，Vite 8 + React 19 + TypeScript，wrangler 4.118.0（`npx wrangler`），Node 内置 `node --test`

设计依据：`docs/superpowers/specs/2026-08-02-photo-album-design.md`。冲突时以 spec 为准。

## Global Constraints

- Cloudflare account_id `e604afaf71a0dab4d6beb8f7ec2eca66`，zone_id（longsizhuo.com）`8f225ebfd2f8e58dbdbe9ea2f6f26237`。
- R2 bucket `me-assets`，公开域 `cdn.longsizhuo.com`，已配 CORS（origins 含 longsizhuo.com / www / localhost:4173 / localhost:5173，methods GET+HEAD）。
- API token 在 `~/.cloudflare-token`。**绝不写进任何被提交的文件，绝不 echo 它的值。**
- **Images 变换已启用并实测通过**：`https://cdn.longsizhuo.com/cdn-cgi/image/width=400,format=auto/<key>` 返回 200 + `image/avif`，1364 KB 原图变 26 KB。相对路径和完整 URL 两种源形式都可用。
- 包管理器 pnpm 11.9.0，安装用 `CI=true pnpm install --frozen-lockfile`。
- `pnpm lint` 必须退出 0（配了 `--max-warnings 0`，未使用的 import 会直接失败）。
- `pnpm tsc` **基线 60 个既有错误**，不许增加。新写的 TS 若引入错误，那就是增加。
- 测试用 Node 内置 `node --test`，`pnpm test` 跑 `test/*.test.mjs`。不引入测试框架。
- **本仓库就是生产环境。** `/home/ubuntu/me/dist` 只读 bind mount 到 Caddy 的 `/srv/longsizhuo`，`pnpm build` 即上线，没有别的部署步骤。**不要跑 `deploy.sh`**，它是过时死代码。备份在 `/home/ubuntu/dist-backup-20260802-095210.tar.gz`。
- 构建后必须确认 `stat -c '%i' /home/ubuntu/me/dist` 不变（bind mount 挂在该目录 inode 上）。
- `verify-page.py` 既有基线：**2 个控制台错误 + 3 个失败请求**（`lottie.host` 403 —— 已知生产 bug，**不要修**；两个 `www.google-analytics.com` ERR_ABORTED）。偶发 `opengraph.githubassets.com` 429，超基线先重跑一次再下结论。
- 现有照片文件名含空格和括号（`album/2025-Kwai/image (2).jpg`），所有 URL 拼接必须逐段 `encodeURIComponent` 而保留 `/`。
- 可抄的参考实现：`sylvia-photo-api`（同账户 Worker + D1 + R2）。用 `npx wrangler` 或 Cloudflare API 读它的源码。

## File Structure

**新建**
- `worker/` — Worker 项目：`wrangler.jsonc`、`src/index.ts`（路由）、`src/albums.ts`（读）、`src/admin.ts`（写）、`src/access.ts`（JWT 校验）
- `worker/schema.sql` — D1 建表
- `scripts/migrate-album-to-d1.mjs` — 把现有 R2 对象写进 D1
- `src/content/images.ts` — `imageUrl(key, opts)`，全站唯一生成变换 URL 的地方
- `src/api/album.ts` — 前端 API 客户端 + 类型
- `src/pages/AlbumList.tsx`、`src/pages/AlbumDetail.tsx`
- `src/pages/AlbumAdmin.tsx` — 极简上传整理页
- `test/image-url.test.mjs`、`test/cursor.test.mjs`

**修改**
- `src/App.tsx` — 加 `/album`、`/album/:slug`、`/album/admin` 路由
- `src/components/Album.tsx` — 改成 12 张预览条
- `public/sitemap.xml` — 加相册页
- `src/content/index.ts` — 迁移完成后移除 `album` 导出（`cdnUrl` 保留，3D 模型仍在用）

**删除（仅在迁移验证通过后）**
- `src/content/album.json`

---

### Task 1: D1 建库、建表、迁移现有照片

**Files:**
- Create: `worker/schema.sql`, `scripts/migrate-album-to-d1.mjs`

- [ ] **Step 1: 建 D1 数据库**

```bash
npx wrangler d1 create me-db
```

记下返回的 `database_id`，后面 `wrangler.jsonc` 要用。若提示已存在，用 `npx wrangler d1 list` 取现有 id。

- [ ] **Step 2: 写 schema**

`worker/schema.sql`，照抄 spec 的表结构：

```sql
CREATE TABLE IF NOT EXISTS albums (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  slug           TEXT UNIQUE NOT NULL,
  name_zh        TEXT NOT NULL,
  name_en        TEXT NOT NULL,
  description_zh TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  cover_key      TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  photo_count    INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id   INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  key        TEXT UNIQUE NOT NULL,
  w          INTEGER NOT NULL,
  h          INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_album ON photos(album_id, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_albums_sort  ON albums(sort_order, id);
```

应用：`npx wrangler d1 execute me-db --remote --file=worker/schema.sql`

**注意 `--remote`**：不加会只作用于本地模拟数据库，看起来成功但线上什么都没有。

- [ ] **Step 3: 写迁移脚本**

`scripts/migrate-album-to-d1.mjs`。三个相册的数据来源不同：

| 相册 slug | 中文名 | 英文名 | 照片来源 | 宽高来源 |
|---|---|---|---|---|
| `2025-kwai` | 2025 快手 | 2025 Kuaishou | R2 `album/2025-Kwai/` | `src/content/album.json` 已有 |
| `2025-unsw` | 2025 UNSW | 2025 UNSW | R2 `album/2025-UNSW/` | `src/content/album.json` 已有 |
| `2024-usyd-coding-fest` | 2024 悉尼大学编程节 | 2024 USYD Coding Fest | R2 `_archive/USYDCodingFest/` | **需要现算** |

第三组的宽高：R2 上有原图但本地已删。下载到临时目录，用系统已装的 ImageMagick `identify -format "%w %h"` 读出来，读完删掉临时文件。17 张共 118MB，串行下载即可。

**同时要把第三组的 R2 key 从 `_archive/USYDCodingFest/` 搬到 `album/2024-usyd-coding-fest/`**，让所有相册照片在同一前缀下。R2 没有 rename，做法是复制后删除：用 `scripts/r2.mjs` 的 `putObject` 上传到新 key，确认新 key 可访问且字节数一致后再删旧 key。**任何一步不确定就停下，不要先删**。

写入 D1 用 `npx wrangler d1 execute me-db --remote --command="..."`，或生成一个 SQL 文件再 `--file=` 执行。后者更好——可重复、可审查。字符串值记得转义单引号。

`created_at` 用 ISO 字符串。`sort_order` 按文件名排序后的序号。每个相册的 `cover_key` 设为其第一张照片。`photo_count` 写实际张数。

- [ ] **Step 4: 验证迁移**

```bash
npx wrangler d1 execute me-db --remote --command="SELECT slug, name_zh, photo_count, cover_key FROM albums ORDER BY sort_order"
npx wrangler d1 execute me-db --remote --command="SELECT album_id, COUNT(*) FROM photos GROUP BY album_id"
npx wrangler d1 execute me-db --remote --command="SELECT COUNT(*) FROM photos WHERE w<=0 OR h<=0"
```

Expected：3 个相册，`photo_count` 与实际分组计数一致（7 = 6+1？以 `album.json` 实际为准，不要照抄这个数字，自己数），零宽高为 0 的记录。

再逐条核对 D1 里每个 `key` 在 R2 上真实存在：

```bash
node -e 'import("./scripts/r2.mjs").then(async r2=>{
  const keys=(await r2.listObjects("album/"));
  console.log("R2 album/ 下对象数:", keys.length);
})'
```

R2 计数必须等于 D1 photos 总数。不等就停下查清楚，**不要继续**。

- [ ] **Step 5: 提交**

```bash
git add worker/schema.sql scripts/migrate-album-to-d1.mjs
git commit -m "feat: D1 schema and migration for the photo album

Migrates the 7 photos already in R2 plus the 17 USYD Coding Fest photos
that were archived under _archive/ and never displayed. Dimensions for
the archived set are computed with ImageMagick since the local copies
were removed; the others already carry them in album.json."
```

---

### Task 2: 图片变换 URL 助手

**Files:**
- Create: `src/content/images.ts`, `test/image-url.test.mjs`

**Interfaces:**
- Produces: `imageUrl(key: string, opts?: { width?: number; height?: number; fit?: "cover"|"contain"|"scale-down" }): string`

- [ ] **Step 1: 写失败测试**

```javascript
// test/image-url.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

// 与 src/content/images.ts 保持一致。node --test 不编译 TS，
// 这里重复一份实现 —— 同 test/lang-from-path.test.mjs 的既有做法。
// 改 imageUrl 时两处都要改。
const CDN = "https://cdn.longsizhuo.com";
function imageUrl(key, opts = {}) {
  const enc = key.split("/").map(encodeURIComponent).join("/");
  const parts = [];
  if (opts.width) parts.push(`width=${opts.width}`);
  if (opts.height) parts.push(`height=${opts.height}`);
  if (opts.fit) parts.push(`fit=${opts.fit}`);
  parts.push("format=auto");
  return `${CDN}/cdn-cgi/image/${parts.join(",")}/${enc}`;
}

test("生成带宽度的变换 URL", () => {
  assert.equal(
    imageUrl("album/2025-Kwai/a.jpg", { width: 400 }),
    "https://cdn.longsizhuo.com/cdn-cgi/image/width=400,format=auto/album/2025-Kwai/a.jpg"
  );
});

test("文件名里的空格和括号被转义，路径分隔符保留", () => {
  const u = imageUrl("album/2025-Kwai/image (2).jpg", { width: 600 });
  assert.ok(u.includes("image%20(2).jpg"), `未正确转义: ${u}`);
  assert.equal((u.match(/\//g) || []).length, 6, `路径段数不对: ${u}`);
});

test("format=auto 总是存在 —— 少了它就发不出 AVIF/WebP", () => {
  assert.ok(imageUrl("a/b.jpg").includes("format=auto"));
  assert.ok(imageUrl("a/b.jpg", { width: 100 }).includes("format=auto"));
});

test("不传选项时也是合法的变换 URL，不会退化成原图地址", () => {
  const u = imageUrl("album/x/y.jpg");
  assert.ok(u.includes("/cdn-cgi/image/"), `退化成了原图: ${u}`);
});
```

- [ ] **Step 2: 跑测试**

Run: `node --test test/image-url.test.mjs`
Expected: 4 个全绿（测试自带实现，此步锁定行为）。

- [ ] **Step 3: 写实现**

`src/content/images.ts`，与测试里的实现完全一致，加上 JSDoc 说明为什么存在（原图 1.3MB，变换后 26KB，全站唯一拼变换 URL 的地方）。

- [ ] **Step 4: 对真实 URL 验证**

拿一个真实 key 跑通：

```bash
node -e '
const CDN="https://cdn.longsizhuo.com";
const key="album/2025-Kwai/image (2).jpg";
const enc=key.split("/").map(encodeURIComponent).join("/");
const u=`${CDN}/cdn-cgi/image/width=400,format=auto/${enc}`;
console.log(u);
fetch(u,{headers:{Accept:"image/avif,image/webp,*/*"}}).then(r=>
  console.log(r.status, r.headers.get("content-type"), r.headers.get("content-length")));'
```

Expected: `200 image/avif` 且 content-length 远小于原图（参考值约 26KB vs 1364KB）。**这一步不能省** —— 它同时验证了变换服务已启用、转义正确、key 存在。

- [ ] **Step 5: lint / tsc / 提交**

Run: `pnpm lint && pnpm tsc 2>&1 | grep -c "error TS"`（须为 60）

```bash
git add src/content/images.ts test/image-url.test.mjs
git commit -m "feat: image transformation URL helper

One place builds Cloudflare Images transformation URLs. A 1364 KB
original comes back as 26 KB AVIF at width=400, so nothing in the app
should ever point at an original."
```

---

### Task 3: Worker 公开读接口

**Files:**
- Create: `worker/wrangler.jsonc`, `worker/src/index.ts`, `worker/src/albums.ts`, `test/cursor.test.mjs`

**Interfaces:**
- Produces: `GET /api/albums`、`GET /api/albums/:slug`、`GET /api/albums/:slug/photos?cursor=&limit=`、`GET /api/photos/latest?limit=`

- [ ] **Step 1: 先看参考实现**

```bash
npx wrangler deployments list --name sylvia-photo-api 2>/dev/null || true
```
或用 Cloudflare API 读 `sylvia-photo-api` 的源码。它已经有 albums/photos 表、上传、封面逻辑，结构可直接借鉴。**但不要照抄它的鉴权** —— 它把 admin secret 硬编码在源码里，本项目用 Cloudflare Access。

- [ ] **Step 2: wrangler.jsonc**

```jsonc
{
  "name": "me-api",
  "main": "src/index.ts",
  "compatibility_date": "2026-01-01",
  "account_id": "e604afaf71a0dab4d6beb8f7ec2eca66",
  "routes": [
    { "pattern": "longsizhuo.com/api/*", "zone_name": "longsizhuo.com" }
  ],
  "d1_databases": [
    { "binding": "DB", "database_name": "me-db", "database_id": "<Task 1 拿到的 id>" }
  ],
  "r2_buckets": [
    { "binding": "BUCKET", "bucket_name": "me-assets" }
  ],
  "observability": { "enabled": true }
}
```

**route 只挂 `/api/*`**，不要挂根路径 —— 站点主体由 Caddy 服务，Worker 抢了根路径会把整站接管。

- [ ] **Step 3: 游标分页 —— 先写测试**

这是本任务唯一有真实算法的部分。

```javascript
// test/cursor.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

// 游标编解码。与 worker/src/albums.ts 保持一致。
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
```

Run: `node --test test/cursor.test.mjs` —— 3 个全绿。

- [ ] **Step 4: 实现读接口**

`worker/src/albums.ts`。要点：

- 分页 SQL：`WHERE album_id = ? AND (sort_order > ? OR (sort_order = ? AND id > ?)) ORDER BY sort_order, id LIMIT ?`
- 多取一条判断是否还有下一页，返回时截掉
- `limit` 夹在 1..100，超范围钳制而不是报错
- 语言：`?lang=zh|en`，缺省看 `Accept-Language` 是否以 `zh` 开头，再缺省 `en`；返回时把 `name_zh`/`name_en` 折叠成单个 `name`
- 响应头 `Cache-Control: public, max-age=60`
- 返回 `key` 而不是完整 URL —— 前端用 `imageUrl()` 自己拼，CDN 域名换了不用改数据

`worker/src/index.ts` 只做路由分发和 CORS，具体逻辑放 `albums.ts`。

- [ ] **Step 5: 部署并实测**

```bash
cd worker && npx wrangler deploy
```

```bash
curl -s "https://longsizhuo.com/api/albums" | python3 -m json.tool | head -30
curl -s "https://longsizhuo.com/api/albums/2025-kwai/photos?limit=3" | python3 -m json.tool
curl -s "https://longsizhuo.com/api/photos/latest?limit=5" | python3 -m json.tool
# 翻页取完不重不漏
curl -s "https://longsizhuo.com/api/albums/2024-usyd-coding-fest/photos?limit=10"
```

Expected：3 个相册；分页 `next` 游标可继续；用返回的游标翻到底后累计条数等于该相册 `photo_count`，且 key 无重复。

**同时确认站点主体没被 Worker 接管**：`curl -s -o /dev/null -w "%{http_code}" https://longsizhuo.com/` 仍是 200 且返回的是 HTML 而不是 JSON。

- [ ] **Step 6: 提交**

```bash
git add worker/ test/cursor.test.mjs
git commit -m "feat: public read API for albums

Cursor pagination on (sort_order, id) rather than OFFSET: uploads while
a visitor is paging would otherwise duplicate or skip rows. Returns R2
keys, not URLs, so the CDN domain can change without touching the data."
```

---

### Task 4: Worker 写接口 + Cloudflare Access

**Files:**
- Create: `worker/src/access.ts`, `worker/src/admin.ts`

- [ ] **Step 1: 配 Cloudflare Access**

Dashboard → Zero Trust → Access → Applications → Add：
- 类型 Self-hosted，域 `longsizhuo.com`，路径 `/album/admin`
- 再加一个覆盖 `longsizhuo.com/api/admin/*`
- 策略：Allow，Emails 精确匹配 `longsizhuo@gmail.com`

记下 team domain（形如 `<team>.cloudflareaccess.com`）和 Application Audience (AUD) tag，写进 wrangler 的 vars。

**这一步需要用户在 dashboard 操作**，token 无此权限。若用户尚未配置，本任务 BLOCKED，不要用共享密钥凑合 —— 那正是 `sylvia-photo-api` 的做法，把密钥硬编码进了源码。

- [ ] **Step 2: 实现 JWT 校验**

`worker/src/access.ts`：取 `Cf-Access-Jwt-Assertion` header，拉 `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs` 的 JWK 验签，校验 `aud` 等于 AUD tag、`exp` 未过期、`iss` 是 team domain。用 WebCrypto，不引依赖。JWK 结果缓存在内存里（Worker 实例级），别每次请求都拉。

**只挡 `/api/admin/*`**。读接口保持公开无鉴权。

- [ ] **Step 3: 写接口**

`worker/src/admin.ts`：

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/admin/albums` | 建相册（slug/name_zh/name_en） |
| PATCH | `/api/admin/albums/:slug` | 改名、改 cover_key、改 sort_order |
| DELETE | `/api/admin/albums/:slug` | 删相册 —— D1 级联删 photos，**R2 对象要在 Worker 里显式批量删**，级联管不到 R2 |
| POST | `/api/admin/albums/:slug/photos` | multipart 上传，支持多文件 |
| PATCH | `/api/admin/photos/:id` | 改 sort_order / 移动相册 |
| DELETE | `/api/admin/photos/:id` | 删除，同时删 R2 对象 |

上传要点：
- key 用 `album/<slug>/<crypto.randomUUID()>.<ext>`，天然不撞名
- 宽高由**客户端**在上传时一并提交（浏览器 `createImageBitmap` 读得到）。Worker 里没有图像库，不要试图在服务端解析。
- 写 R2 成功后再写 D1；写 D1 失败要把刚传的 R2 对象删掉，别留孤儿
- 更新该相册的 `photo_count`；若相册原本没有 `cover_key`，把第一张设为封面

- [ ] **Step 4: 鉴权测试**

安全边界，不能省。

```bash
# 无 JWT
curl -s -o /dev/null -w "无 JWT: %{http_code}\n" -X POST https://longsizhuo.com/api/admin/albums
# 伪造 JWT
curl -s -o /dev/null -w "伪造 JWT: %{http_code}\n" -X POST -H "Cf-Access-Jwt-Assertion: eyJhbGciOiJIUzI1NiJ9.e30.x" https://longsizhuo.com/api/admin/albums
# 读接口仍公开
curl -s -o /dev/null -w "公开读: %{http_code}\n" https://longsizhuo.com/api/albums
```

Expected：前两个 401，第三个 200。

- [ ] **Step 5: 提交**

```bash
git add worker/src/access.ts worker/src/admin.ts
git commit -m "feat: Access-protected write API for albums

Verifies the Cf-Access-Jwt-Assertion signature against the team's JWKS
rather than trusting the header's presence — Access in front of the page
does not protect the API, and a shared secret in source (as the sibling
sylvia-photo-api does) is not an acceptable substitute."
```

---

### Task 5: `/album` 相册列表页

**Files:**
- Create: `src/api/album.ts`, `src/pages/AlbumList.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: API 客户端**

`src/api/album.ts`：类型定义 + `fetchAlbums()` / `fetchAlbum(slug)` / `fetchPhotos(slug, cursor)` / `fetchLatest(limit)`。base URL 走 `import.meta.env.VITE_API_BASE ?? "https://longsizhuo.com"`，这样本地开发也能打线上只读接口。

- [ ] **Step 2: 列表页**

封面网格。每格：封面图（`imageUrl(cover_key, {width: 600, fit: "cover"})`）、相册名、张数。点击进 `/album/:slug`。

复用站点既有视觉语言：`bg-tertiary` 卡片、`rounded-2xl`、`motion` 的 `fadeIn`。**不要发明新的视觉体系。**

加载中显示骨架而不是空白；失败由 `ErrorBoundary` 兜住。

- [ ] **Step 3: 路由**

`App.tsx` 加 `/album` 和 `/album/:slug`。两者都包 `ErrorBoundary`。

- [ ] **Step 4: 验证**

```bash
pnpm lint && pnpm tsc 2>&1 | grep -c "error TS"   # 须 60
pnpm build
nohup pnpm preview --port 4173 >/tmp/prev.log 2>&1 &
sleep 4
python3 scripts/verify-page.py http://localhost:4173/album /tmp/album-list.png
```

**看截图**，确认封面真的显示出来了。检查资源来源统计里图片来自 `cdn.longsizhuo.com`。

- [ ] **Step 5: 提交**

---

### Task 6: `/album/:slug` 详情页

**Files:**
- Create: `src/pages/AlbumDetail.tsx`

- [ ] **Step 1: 瀑布流 + 灯箱**

- 布局沿用现有 `Album.tsx` 的 CSS `columnWidth` 瀑布流
- 每张用 `aspect-ratio: w/h` 占位，**加载前就占对高度**，否则滚动时布局乱跳
- 缩略图 `imageUrl(key, {width: 600})`，灯箱 `imageUrl(key, {width: 1600})`
- 灯箱用 antd 现成的 `Image.PreviewGroup`，**点击放大 + 左右切换即可**。不加键盘面板、不加手势缩放、不加 EXIF、不加下载按钮 —— 这是展示站不是网盘
- 滚动到底自动加载下一页（IntersectionObserver 哨兵元素），沿用 `LazyVisible.tsx` 已建立的模式

- [ ] **Step 2: 验证**

对照片最多的 `2024-usyd-coding-fest`（17 张）跑：滚到底应触发第二页；累计张数等于 `photo_count`；无重复。

看截图确认照片真的渲染。

- [ ] **Step 3: 提交**

---

### Task 7: 首页预览条

**Files:**
- Modify: `src/components/Album.tsx`

- [ ] **Step 1: 改写**

删掉 520px 内部滚动框和 `album.json` 的引用。改为：调 `fetchLatest(12)`，横向排布 12 张 `imageUrl(key,{width:400,fit:"cover"})`，末尾一个「查看全部 →」卡片链到 `/album`。

**首页重量必须与照片总数无关** —— 这是本任务的验收点。

- [ ] **Step 2: 验证首屏没变重**

```bash
pnpm build
nohup pnpm preview --port 4173 >/tmp/prev.log 2>&1 &
sleep 4
python3 scripts/verify-page.py http://localhost:4173/ /tmp/home.png
```

对比 Task 7 之前的首屏字节数（当前线上基线约 2.29 MB）。**必须持平或更低**。若变高，说明预览条没走变换 URL 或拉了超过 12 张。

- [ ] **Step 3: 提交**

---

### Task 8: 极简上传整理页

**Files:**
- Create: `src/pages/AlbumAdmin.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 页面**

`/album/admin`，由 Cloudflare Access 保护（Task 4 配的）。功能只要三件：

1. 建相册（slug + 中英文名）
2. 选相册 → 拖拽/选择多张图上传。**上传前在浏览器里用 `createImageBitmap` 读出宽高**一并提交（Worker 侧没有图像库）。显示每张的上传进度和结果。
3. 列出某相册的照片，能删除、能设为封面

**不做**：拖拽排序（先用 sort_order 数字输入框）、批量编辑、图片裁剪、回收站。

- [ ] **Step 2: 端到端验证**

真的建一个测试相册、传两张图、确认：
- 出现在 `/album` 列表
- 点进去能看到
- 变换 URL 正常（图能显示）
- 删掉其中一张，D1 和 R2 都清干净
- 删掉测试相册，R2 下该前缀无残留对象

```bash
node -e 'import("./scripts/r2.mjs").then(async r=>console.log(await r.listObjects("album/test-")))'
```
Expected: 空数组。

- [ ] **Step 3: 提交**

---

### Task 9: 清理、SEO、上线

- [ ] **Step 1: 移除旧数据源**

确认没有任何地方还引用 `src/content/album.json` 后删除它，并从 `src/content/index.ts` 移除 `album` 导出。**`cdnUrl` 保留** —— 3D 模型还在用。

```bash
grep -rn "album.json\|from \"../content\"" src/ | grep -i album
```

- [ ] **Step 2: sitemap**

`public/sitemap.xml` 加 `/album` 和每个相册页。相册是动态的，这里先手写现有三个；以后相册多了再考虑让 Worker 生成 sitemap 片段。

- [ ] **Step 3: 全量门禁 + 上线**

```bash
pnpm lint && pnpm tsc 2>&1 | grep -c "error TS" && pnpm test && pnpm build
stat -c '%i' /home/ubuntu/me/dist    # 必须仍是 4721781
curl -s -o /dev/null -w "%{http_code}\n" https://longsizhuo.com/
curl -s -o /dev/null -w "%{http_code}\n" https://longsizhuo.com/album
```

- [ ] **Step 4: 线上验证**

```bash
python3 scripts/verify-page.py https://longsizhuo.com/album /tmp/live-album.png
python3 scripts/verify-page.py https://longsizhuo.com/album/2024-usyd-coding-fest /tmp/live-detail.png
python3 scripts/verify-page.py https://longsizhuo.com/ /tmp/live-home.png
```

三处都要看截图。失败请求不得超过基线 3 条。

- [ ] **Step 5: 提交**

---

## 自查

| Spec 要求 | 对应任务 |
|---|---|
| D1 表结构 | Task 1 |
| 迁移现有 7 张 + 归档 17 张 | Task 1 |
| 变换 URL，不预生成缩略图 | Task 2 |
| 公开读接口 + 游标分页 | Task 3 |
| Access 保护的写接口 | Task 4 |
| `/album` 列表页 | Task 5 |
| `/album/:slug` 详情 + 最简灯箱 | Task 6 |
| 首页 12 张预览条 | Task 7 |
| 上传整理后台 | Task 8 |
| 删除 album.json、sitemap、上线 | Task 9 |

**非目标复核**（spec 明确排除，任何任务都不得实现）：原图下载按钮、EXIF 面板、私有相册、分享 token、图片编辑。

**已知重复**：`imageUrl` 和游标编解码在测试文件里各重复一份实现，因为 `node --test` 不编译 TS。这与 `test/lang-from-path.test.mjs` 的既有处理一致，两处都加注释说明。
