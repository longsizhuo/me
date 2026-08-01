# 第一期：图片迁 R2 + 修下标坑 + 中文名 SEO

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 148MB 图片迁到 Cloudflare R2 并从 git 移除，让每条内容自带 logo URL（消除按数组下标配图标的错位隐患），同时让「龙思卓」这个中文名可被搜索引擎索引。

**Architecture:** 站点保持纯静态 Vite SPA，部署流程 (`deploy.sh`) 不变。图片改从 `cdn.longsizhuo.com`（R2 自定义域）加载。内容仍从打包的 `src/i18n/{zh,en}.json` 读取，但结构升级成第二期 KV 文档的形状——每个条目带稳定 `id` 和 `icon` URL。相册清单存 `src/content/album.json`（语言无关，第二期原样搬进 KV）。

**Tech Stack:** Vite 8 / React 19 / TypeScript / i18next / Cloudflare R2 REST API / Node 24 内置 `node:test`

## Global Constraints

- Cloudflare account_id: `e604afaf71a0dab4d6beb8f7ec2eca66`
- API token 在 `~/.cloudflare-token`（已验证有 R2 对象读写权限）。**绝不把 token 写进任何提交的文件**，一律 `process.env.CF_API_TOKEN` 或运行时读文件。
- R2 bucket 名：`me-assets`。自定义域：`cdn.longsizhuo.com`。
- 上传走 Cloudflare REST API `PUT /accounts/{account_id}/r2/buckets/{bucket}/objects/{key}`，`Content-Type: application/octet-stream` 之外用 `Content-Type` header 指定真实 MIME。**不新增任何 npm 依赖**——用 `fetch` 即可，无需 SigV4 签名。
- 图片宽高用系统已装的 ImageMagick：`identify -format "%w %h" <file>`。
- 测试用 Node 内置 `node --test`，不引入测试框架。
- 包管理器是 **pnpm 11.9.0**（`packageManager` 字段已钉）。`overrides` 只认 `pnpm-workspace.yaml`，**不要**往 `package.json` 的 `pnpm` 字段放东西——pnpm 11 会静默忽略，那里有两条安全 pin。安装用 `CI=true pnpm install --frozen-lockfile`。
- 每个任务结束跑 `pnpm lint` 必须**零错误**（配了 `--max-warnings 0`），这条从一开始就满足。
- `pnpm tsc` **基线有 69 个既有错误**（这个项目的 tsc 从未通过过；`build` 能过是因为 Vite/Rolldown 不做类型检查）。Task 1-10 的要求是**不新增**错误：改动前后各跑一次 `pnpm tsc 2>&1 | grep -c "error TS"`，数字不许变大。Task 11 专门把它清零，之后才恢复「必须零错误」。
  - 基线分布：死文件 30（`getImages` `GitHubCard` `PhotoGalleryDialog` `Contact` `convert-frame`）、`Album.tsx` 9（Task 3 重写后自动消失）、活文件 30。
- `education.items[].coursework` 是**字符串**不是数组，别改成数组。
- 保留所有当前无人 import 的死组件（`Achievements` `Anime` `Contact` `Feedbacks` `GitHubCard` `PhotoGalleryDialog` `Profile` `Tech` `getImages`）及其专属资源。因此 `src/constants/index.ts` 里的 `services` / `technologies` / `testimonials` **必须保留**，删了会挂 build。
- **本机就是生产服务器。** `longsizhuo.com` A 记录 → `161.118.194.132` = 本机公网 IP。
- **服务由 Caddy 提供，不是 nginx。** Caddy（pid 3112）监听 80/443，跑在独立 mount namespace 里，`/proc/3112/mountinfo` 显示 `/home/ubuntu/me/dist` 以只读 bind mount 挂到 `/srv/longsizhuo`，即 Caddy 配置里的 root。
- **部署 = `pnpm build`，没有别的步骤。** 构建产物落到 `dist/` 就直接生效。**不要跑 `deploy.sh`** —— 它 rsync 到 Caddy 根本不读的 `/var/www/longsizhuo.com`，然后 `systemctl reload nginx` 对一个没运行的服务必然失败。
- **SPA fallback 已经存在。** Caddy 运行配置里有 `try_files {http.request.uri.path} /index.html`，`/zh` `/en` 开箱可用，不需要任何服务端改动。
- ⚠️ **bind mount 是挂在 `dist` 目录上的。** 若某次构建把 `dist` 目录整个删掉重建（而非清空内容），bind mount 会指向失效 inode，站点立刻 404。Vite 的 `emptyOutDir` 是清空内容、保留目录，理论上安全，但**当前这个 mount 建立后似乎还没跑过完整构建**（线上仍是 4 月 26 日那版）。所以 Task 0 先验证这件事，别等到最后才发现。

## File Structure

**新建**
- `scripts/r2.mjs` — R2 REST API 小封装（`putObject` / `listObjects`），被下面两个脚本复用
- `scripts/migrate-to-r2.mjs` — 一次性迁移脚本，读本地目录批量上传并打印清单
- `src/content/album.json` — 相册清单，语言无关，第二期原样进 KV
- `src/content/index.ts` — 导出 `CDN_BASE` 和 `cdnUrl(key)`，全站唯一拼 URL 的地方
- `test/album-manifest.test.mjs` — 相册清单结构与 URL 拼接断言
- `test/content-icons.test.mjs` — 「icon 跟着条目走」的回归测试
- `test/lang-from-path.test.mjs` — URL 语言解析分支测试

**修改**
- `src/components/Album.tsx` — 删 `import.meta.glob`，改读清单
- `src/components/Honors.tsx:10-15` — 删 `honorIcons` 数组和 4 个 import
- `src/components/Education.tsx:9-15` — 删 `universityIcons` 和 2 个 import
- `src/components/Experience.tsx:12,89-90` — 删 `import { experiences }`
- `src/components/Works.tsx` — 恢复渲染静态项目卡片
- `src/components/canvas/Computers.tsx` / `Earth.tsx` — `useGLTF` 改 CDN URL
- `src/i18n/{zh,en}.json` — 条目加 `id` / `icon` / `iconBg`
- `src/i18n/index.ts` — 语言解析改为 URL 优先，默认中文
- `src/constants/index.ts` — 删 `experiences` 和 `projects`
- `src/assets/index.ts` — 删已迁移且无人引用的导出
- `App.tsx` — 加 `/zh` `/en` 路由
- `index.html` — SEO meta / JSON-LD / noscript
- `public/sitemap.xml` — 补语言 URL
- `.gitignore` — 忽略迁移产生的临时清单

**删除**
- `public/USYDCodingFest/`（17 文件 118MB）
- `public/desktop_pc/`（54 文件 16MB）
- `public/planet/`（5 文件 2.9MB）
- `src/assets/album/`（7 文件 12MB）

---

### Task 0: 验证构建不会打断 bind mount

**必须最先做。** 站点靠 `/home/ubuntu/me/dist` → `/srv/longsizhuo` 的 bind mount 提供服务。如果 `pnpm build` 会把 `dist` 目录整个删掉重建，bind mount 就会指向失效 inode，站点立刻全站 404。这个 mount 是手工 `unshare` 建的，没有 systemd unit，挂掉之后不好恢复。

线上现在还是 4 月 26 日那版构建，说明这个 mount 建立之后可能从没跑过完整构建——不能假设它安全。

**Files:** 无代码改动

- [ ] **Step 1: 记录当前状态，留好退路**

```bash
sudo grep longsizhuo /proc/$(pgrep -x caddy)/mountinfo
stat -c '%i %n' /home/ubuntu/me/dist
curl -s -o /dev/null -w "构建前站点: %{http_code}\n" http://localhost/ -H "Host: longsizhuo.com"
```

记下 `dist` 的 inode 号，构建后要比对。

- [ ] **Step 2: 跑一次构建**

Run: `cd /home/ubuntu/me && pnpm build`
Expected: 构建成功。

- [ ] **Step 3: 立刻检查站点还活着**

```bash
stat -c '%i %n' /home/ubuntu/me/dist
curl -s -o /dev/null -w "构建后站点: %{http_code}\n" http://localhost/ -H "Host: longsizhuo.com"
curl -s http://localhost/ -H "Host: longsizhuo.com" | grep -o "<title>.*</title>"
```

Expected: inode 与 Step 1 相同、状态码 200、title 正常。

**若返回 404 或 inode 变了**，立刻重建 bind mount：

```bash
sudo nsenter -t $(pgrep -x caddy) -m -- mount --bind -o ro /home/ubuntu/me/dist /srv/longsizhuo
curl -s -o /dev/null -w "%{http_code}\n" http://localhost/ -H "Host: longsizhuo.com"
```

恢复后**停下来告诉用户**——说明每次构建都会打断站点，这个部署方式本身需要先修（改成 Caddy 直接 root 到 `dist` 的绝对路径，不用 bind mount），再继续本计划。

- [ ] **Step 4: 确认结论后再往下走**

Expected: 构建安全，可以继续 Task 1。这个结论决定了后面每个任务结尾的 `pnpm build` 是否安全。

---

### Task 1: R2 bucket、自定义域与上传封装

打通「本地文件 → R2 → CDN URL 可访问」这条链路。后面所有迁移任务都依赖它。

**Files:**
- Create: `scripts/r2.mjs`
- Test: `test/r2-key.test.mjs`

**Interfaces:**
- Produces: `putObject(key: string, filePath: string, contentType: string): Promise<void>`、`listObjects(prefix: string): Promise<string[]>`、`r2Key(localPath: string, prefix: string): string`

- [ ] **Step 1: 创建 bucket**

```bash
TOKEN=$(cat ~/.cloudflare-token)
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"me-assets"}' \
  "https://api.cloudflare.com/client/v4/accounts/e604afaf71a0dab4d6beb8f7ec2eca66/r2/buckets" \
  | python3 -m json.tool
```

预期 `"success": true`。已存在会返回 `10004 bucket already exists`，也算通过。

- [ ] **Step 2: 绑定自定义域 cdn.longsizhuo.com**

在 Cloudflare Dashboard → R2 → `me-assets` → Settings → Public access → **Connect Domain**，填 `cdn.longsizhuo.com`。会自动建 DNS 记录。

走 Dashboard 而不是 API，因为这一步要同时建 DNS 记录、签证书、开公开访问，API 分三个调用且证书签发要等，手点一次更省事。

验证（证书签发可能要 1-2 分钟）：

```bash
curl -sI https://cdn.longsizhuo.com/ | head -3
```

预期返回 HTTP 状态码（404 也算成功——说明域名通了，只是根路径没对象）。若 `curl: (6) Could not resolve host` 就再等等。

- [ ] **Step 3: 写 R2 封装**

```javascript
// scripts/r2.mjs
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, relative } from "node:path";

const ACCOUNT_ID = "e604afaf71a0dab4d6beb8f7ec2eca66";
const BUCKET = "me-assets";
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}`;

let cachedToken;
async function token() {
  if (cachedToken) return cachedToken;
  cachedToken =
    process.env.CF_API_TOKEN ??
    (await readFile(join(homedir(), ".cloudflare-token"), "utf8")).trim();
  return cachedToken;
}

const MIME = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", svg: "image/svg+xml", bin: "application/octet-stream",
  gltf: "model/gltf+json", txt: "text/plain",
};

export function mimeOf(path) {
  return MIME[path.split(".").pop().toLowerCase()] ?? "application/octet-stream";
}

/**
 * 本地路径 → R2 key。空格等字符原样保留，由 encodeURIComponent 在请求时处理。
 * r2Key("public/USYDCodingFest/a b.jpg", "public/USYDCodingFest", "_archive/USYDCodingFest")
 *   === "_archive/USYDCodingFest/a b.jpg"
 */
export function r2Key(localPath, stripPrefix, keyPrefix) {
  const rel = relative(stripPrefix, localPath).split("\\").join("/");
  return `${keyPrefix}/${rel}`;
}

export async function putObject(key, filePath, contentType = mimeOf(filePath)) {
  const body = await readFile(filePath);
  // key 里的 / 要保留成路径分隔符，只转义各段内部的特殊字符
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(`${API}/objects/${encoded}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${await token()}`,
      "Content-Type": contentType,
      "Content-Length": String(body.byteLength),
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`PUT ${key} failed: ${res.status} ${await res.text()}`);
  }
}

export async function listObjects(prefix) {
  const keys = [];
  let cursor;
  do {
    const url = new URL(`${API}/objects`);
    url.searchParams.set("prefix", prefix);
    url.searchParams.set("per_page", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${await token()}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error(JSON.stringify(data.errors));
    keys.push(...data.result.map((o) => o.key));
    cursor = data.result_info?.cursor || undefined;
  } while (cursor);
  return keys;
}
```

- [ ] **Step 4: 写 r2Key 的失败测试**

`r2Key` 是唯一有真实逻辑的纯函数（路径拼接容易出错：多余斜杠、Windows 分隔符、空格文件名），值得一个测试。

```javascript
// test/r2-key.test.mjs
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
```

- [ ] **Step 5: 跑测试确认失败**

Run: `node --test test/r2-key.test.mjs`
Expected: FAIL —— `scripts/r2.mjs` 还没写就是 `ERR_MODULE_NOT_FOUND`；若已按 Step 3 写好则应直接 PASS，那就跳到 Step 7。

- [ ] **Step 6: 跑测试确认通过**

Run: `node --test test/r2-key.test.mjs`
Expected: PASS，4 个测试全绿。

- [ ] **Step 7: 端到端验证一个真实上传**

```bash
node -e '
import("./scripts/r2.mjs").then(async (r2) => {
  await r2.putObject("_smoke/hello.txt", "public/robots.txt", "text/plain");
  console.log("uploaded");
  console.log(await r2.listObjects("_smoke/"));
});'
curl -s https://cdn.longsizhuo.com/_smoke/hello.txt
```

预期：打印 `uploaded`、`[ '_smoke/hello.txt' ]`，curl 输出 robots.txt 内容。

这一步同时验证了 bucket 存在、token 权限、自定义域生效、key 编码正确——四件事一次验完。

- [ ] **Step 8: 提交**

```bash
git add scripts/r2.mjs test/r2-key.test.mjs
git commit -m "feat: R2 REST API helper for asset migration

Plain fetch against the Cloudflare REST API — no SigV4, no SDK, no new
dependency. 104 files well under the REST API rate limits."
```

---

### Task 2: 迁移相册并生成清单

**Files:**
- Create: `scripts/migrate-to-r2.mjs`, `src/content/album.json`, `src/content/index.ts`
- Test: `test/album-manifest.test.mjs`

**Interfaces:**
- Consumes: Task 1 的 `putObject` / `listObjects` / `r2Key` / `mimeOf`
- Produces: `src/content/album.json` 结构 `Array<{ id: string; folder: string; photos: Array<{ key: string; w: number; h: number }> }>`；`src/content/index.ts` 导出 `CDN_BASE: string` 和 `cdnUrl(key: string): string`

- [ ] **Step 1: 写迁移脚本**

```javascript
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
  album: async () => {
    const root = "src/assets/album";
    const folders = (await readdir(root, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();

    const manifest = [];
    for (const folder of folders) {
      const files = (await walk(join(root, folder))).sort();
      const keys = await uploadAll(files, root, "album");
      manifest.push({
        id: folder.toLowerCase(),
        folder,
        photos: files.map((f, i) => ({ key: keys[i], ...(dimensions(f) ?? { w: 0, h: 0 }) })),
      });
    }
    await mkdir("src/content", { recursive: true });
    await writeFile("src/content/album.json", JSON.stringify(manifest, null, 2) + "\n");
    console.log(`\n写入 src/content/album.json：${manifest.length} 个相册，` +
                `${manifest.reduce((n, a) => n + a.photos.length, 0)} 张照片`);
  },

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
```

- [ ] **Step 2: 跑相册迁移**

Run: `node scripts/migrate-to-r2.mjs album`
Expected: 逐行打印 7 个 key，最后报「2 个相册，7 张照片」和「R2 上 album/ 现有 7 个对象」。

- [ ] **Step 3: 核对上传数量与本地一致**

```bash
echo "本地: $(find src/assets/album -type f | wc -l)"
python3 -c "
import json; m=json.load(open('src/content/album.json'))
print('清单:', sum(len(a['photos']) for a in m))
print('缺宽高:', [p['key'] for a in m for p in a['photos'] if p['w']==0])"
curl -sI "https://cdn.longsizhuo.com/$(python3 -c "
import json,urllib.parse; m=json.load(open('src/content/album.json'))
print(urllib.parse.quote(m[0]['photos'][0]['key']))")" | head -2
```

预期：本地数 == 清单数 == 7；「缺宽高」为空列表；curl 返回 `HTTP/2 200`。

若「缺宽高」非空，说明 `identify` 对某些文件失败——不要放着不管，这些照片会在相册里塌成 0 高度。手动补进 `album.json` 或改用 `identify -format "%w %h" file[0]` 逐个排查。

- [ ] **Step 4: 写 CDN URL 封装**

```typescript
// src/content/index.ts
import albumManifest from "./album.json";

export const CDN_BASE = "https://cdn.longsizhuo.com";

export interface AlbumPhoto {
  key: string;
  w: number;
  h: number;
}

export interface AlbumGroup {
  id: string;
  folder: string;
  photos: AlbumPhoto[];
}

export const album = albumManifest as AlbumGroup[];

/**
 * R2 key → 可访问 URL。key 里的空格等字符必须转义，
 * 但 / 要保留成路径分隔符。
 */
export function cdnUrl(key: string): string {
  return `${CDN_BASE}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
```

- [ ] **Step 5: 写清单与 URL 拼接的失败测试**

```javascript
// test/album-manifest.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const album = JSON.parse(readFileSync("src/content/album.json", "utf8"));

// cdnUrl 的逻辑复制一份到测试里：src/content/index.ts 是 TS，
// node --test 不编译 TS。这几行足够简单，重复比引入编译步骤划算。
const cdnUrl = (key) =>
  `https://cdn.longsizhuo.com/${key.split("/").map(encodeURIComponent).join("/")}`;

test("每个相册都有 id、folder 和至少一张照片", () => {
  assert.ok(album.length > 0, "清单不能是空的");
  for (const g of album) {
    assert.ok(g.id, `相册缺 id: ${JSON.stringify(g)}`);
    assert.ok(g.folder, `相册缺 folder: ${g.id}`);
    assert.ok(g.photos.length > 0, `相册 ${g.id} 没有照片`);
  }
});

test("每张照片都有非零宽高——否则瀑布流会塌成 0 高度", () => {
  for (const g of album) {
    for (const p of g.photos) {
      assert.ok(p.w > 0 && p.h > 0, `${p.key} 宽高缺失: ${p.w}x${p.h}`);
    }
  }
});

test("照片 key 全局唯一", () => {
  const keys = album.flatMap((g) => g.photos.map((p) => p.key));
  assert.equal(new Set(keys).size, keys.length, "存在重复 key");
});

test("cdnUrl 转义空格但保留路径分隔符", () => {
  assert.equal(
    cdnUrl("album/2025 Kwai/a b.jpg"),
    "https://cdn.longsizhuo.com/album/2025%20Kwai/a%20b.jpg"
  );
});
```

- [ ] **Step 6: 跑测试**

Run: `node --test test/album-manifest.test.mjs`
Expected: PASS，4 个测试全绿。

若「非零宽高」那条失败，回到 Step 3 修 `album.json` 再跑，不要改测试来迁就数据。

- [ ] **Step 7: 提交**

```bash
git add scripts/migrate-to-r2.mjs src/content/ test/album-manifest.test.mjs
git commit -m "feat: migrate album photos to R2, add manifest

Manifest stores R2 keys (not full URLs) so the CDN domain can change
without rewriting it, plus width/height so the masonry can reserve space
before images load."
```

---

### Task 3: Album.tsx 改读清单

现在 `Album.tsx` 用 `import.meta.glob` 扫 `src/assets/album/**`，那个目录马上要删掉。同时补上宽高占位，消掉现在图片加载时的布局抖动。

**Files:**
- Modify: `src/components/Album.tsx`

**Interfaces:**
- Consumes: Task 2 的 `album: AlbumGroup[]` 和 `cdnUrl(key: string): string`

- [ ] **Step 1: 确认改前的行为**

Run: `pnpm dev`，浏览器开 `http://localhost:5173`，滚到「照片墙」。
Expected: 看到 `2025-Kwai` 和 `2025-UNSW` 两组照片。记下来，改完要一模一样。

- [ ] **Step 2: 替换取图逻辑**

`src/components/Album.tsx` —— 删掉 `getGroupedImages`（14-38 行）和 `useState`/`useEffect` 那套异步加载，改成直接用清单。`LazyImage` 保留 IntersectionObserver 懒加载，但 src 改成 CDN URL，并用 `aspect-ratio` 占位。

```tsx
import { Image } from "antd";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";
import { album, cdnUrl, type AlbumPhoto } from "../content";
import { fadeIn, textVariant } from "../utils/motion";

const LazyImage = ({ photo, alt, gap }: { photo: AlbumPhoto; alt: string; gap: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        breakInside: "avoid",
        marginBottom: `${gap}px`,
        borderRadius: 12,
        overflow: "hidden",
        // 加载前先按真实比例占位，消除瀑布流抖动
        aspectRatio: `${photo.w} / ${photo.h}`,
        background: "#151030",
      }}
    >
      {visible && (
        <Image
          src={cdnUrl(photo.key)}
          alt={alt}
          loading="lazy"
          width="100%"
          style={{ display: "block", borderRadius: 12, objectFit: "cover" }}
          placeholder
        />
      )}
    </div>
  );
};

const Album = () => {
  const { t } = useTranslation();
  const gap = 16;
  const columnWidth = 250;

  return (
    <div className="relative w-full">
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>{t("album.subtitle")}</p>
        <h2 className={styles.sectionHeadText}>{t("album.title")}</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]"
      >
        {t("album.description")}
      </motion.p>

      <div
        id="album-scroll"
        className="p-4 mt-10 bg-black-100/50 shadow-inner overflow-y-scroll border border-gray-700 rounded-2xl"
        style={{ maxHeight: "520px", width: "100%" }}
      >
        <Image.PreviewGroup>
          {album.map((group) => (
            <div key={group.id} style={{ marginBottom: 40 }}>
              <h2 className="text-white text-[20px] font-semibold my-4 pb-2 border-b border-gray-600">
                {group.folder}
              </h2>
              <div style={{ columnWidth: `${columnWidth}px`, columnGap: gap }}>
                {group.photos.map((photo, idx) => (
                  <LazyImage
                    key={photo.key}
                    photo={photo}
                    alt={`${group.folder}-${idx}`}
                    gap={gap}
                  />
                ))}
              </div>
            </div>
          ))}
        </Image.PreviewGroup>
      </div>
    </div>
  );
};

const AlbumWithWrapper = SectionWrapper(Album, "album");
export default AlbumWithWrapper;
```

- [ ] **Step 3: 确认 tsconfig 允许 import json**

Run: `pnpm tsc`
Expected: 零错误。若报 `Cannot find module './album.json'`，在 `tsconfig.json` 的 `compilerOptions` 加 `"resolveJsonModule": true`，再跑一次。

- [ ] **Step 4: 目视验证**

Run: `pnpm dev`，滚到「照片墙」。
Expected：
- 两组照片都在，数量和 Step 1 记录的一致。
- 打开 DevTools Network，图片请求指向 `cdn.longsizhuo.com`，全部 200。
- 滚动时**卡片位置不再跳动**（这是 aspect-ratio 占位带来的改善）。
- 点图能放大预览（`Image.PreviewGroup` 仍生效）。

- [ ] **Step 5: 跑 lint 和类型检查**

Run: `pnpm lint && pnpm tsc`
Expected: 零错误零警告。

- [ ] **Step 6: 提交**

```bash
git add src/components/Album.tsx tsconfig.json
git commit -m "refactor: Album reads the R2 manifest instead of globbing assets

Also reserves space via aspect-ratio from the manifest's width/height,
which removes the masonry reflow that happened as each image landed."
```

---

### Task 4: logo 迁 R2，内容条目自带 icon

这是**整个第一期的核心**。`honorIcons[index]` / `universityIcons[index]` / `experiences[index].icon` 三处按下标配图标，在列表中间插一条就会让后面所有 logo 错位。改成每条内容自带 `icon` URL。

**Files:**
- Modify: `src/i18n/zh.json`, `src/i18n/en.json`

**Interfaces:**
- Produces: `experience.items[]` / `education.items[]` / `honors.items[]` 每项新增 `id: string`、`icon: string`（完整 CDN URL）；`experience` 和 `education` 的项另加 `iconBg: string`

- [ ] **Step 1: 上传 logo**

Run: `node scripts/migrate-to-r2.mjs logos`
Expected: 打印各 logo 的 key，最后报 `R2 上 logos/ 现有 N 个对象`（N ≈ 28）。

- [ ] **Step 2: 列出实际 key，照着写 URL**

```bash
node -e 'import("./scripts/r2.mjs").then(async r2 =>
  (await r2.listObjects("logos/")).forEach(k => console.log(k)))'
```

把输出留在手边——下一步要照抄，**不要凭记忆写 URL**。

- [ ] **Step 3: 给 zh.json 的条目加 id 和 icon**

对照当前组件里的下标映射逐条填，映射关系是：

| 段落 | 下标 | 现在用的图 | 新 `icon` |
|---|---|---|---|
| `experience.items` | 0 快手 | `assets/kwai-vector-logo-seeklogo/kwai.png` | `https://cdn.longsizhuo.com/logos/kwai-vector-logo-seeklogo/kwai.png` |
| | 1 UNSW | `assets/company/unsw.png` | `https://cdn.longsizhuo.com/logos/company/unsw.png` |
| | 2 Spot Finder | `assets/SpotFinder/logo.svg` | `https://cdn.longsizhuo.com/logos/SpotFinder/logo.svg` |
| | 3 Gem Flower | `assets/company/bsh.png` | `https://cdn.longsizhuo.com/logos/company/bsh.png` |
| `education.items` | 0 UNSW | `assets/company/unsw.png` | `https://cdn.longsizhuo.com/logos/company/unsw.png` |
| | 1 CUIT | `assets/company/cuit.jpg` | `https://cdn.longsizhuo.com/logos/company/cuit.jpg` |
| `honors.items` | 0 蓝桥杯 | `assets/awards/lanqiao.webp` | `https://cdn.longsizhuo.com/logos/awards/lanqiao.webp` |
| | 1 USYD | `assets/awards/usyd.png` | `https://cdn.longsizhuo.com/logos/awards/usyd.png` |
| | 2 UNSW | `assets/company/unsw.png` | `https://cdn.longsizhuo.com/logos/company/unsw.png` |
| | 3 软著 | `assets/awards/copyright.png` | `https://cdn.longsizhuo.com/logos/awards/copyright.png` |

`iconBg` 沿用 `src/constants/index.ts` 的现值：快手 `#FFF`、UNSW `#FFF`、Spot Finder `#000`、Gem Flower `#E6DEDD`；两所学校都是 `#FFF`。

改完 `experience.items[0]` 长这样：

```json
{
  "id": "kwai",
  "title": "前端工程师",
  "company": "快手科技 (Kuaishou Technology)",
  "date": "2025年5月 - 至今",
  "icon": "https://cdn.longsizhuo.com/logos/kwai-vector-logo-seeklogo/kwai.png",
  "iconBg": "#FFF",
  "points": ["在北京总部为快手 Web 平台构建大规模高性能用户体验。", "..."]
}
```

`id` 用稳定短 slug：`kwai` / `unsw-ta` / `spotfinder` / `gemflower`；教育 `unsw-meng` / `cuit-beng`；荣誉 `lanqiao` / `usyd-codingfest` / `unsw-ta-award` / `copyright`。

- [ ] **Step 4: 同样改 en.json**

`id` / `icon` / `iconBg` 三个字段在 en.json 里必须**与 zh.json 完全相同**（它们不是文本，不参与翻译）。只有 `title` / `company` / `points` 等文本保持英文原样。

- [ ] **Step 5: 写「icon 跟着条目走」的回归测试**

这是本任务要防的 bug，必须有测试。

```javascript
// test/content-icons.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const zh = JSON.parse(readFileSync("src/i18n/zh.json", "utf8"));
const en = JSON.parse(readFileSync("src/i18n/en.json", "utf8"));
const SECTIONS = ["experience", "education", "honors"];

test("每个条目都自带 id 和 icon", () => {
  for (const s of SECTIONS) {
    for (const [i, item] of zh[s].items.entries()) {
      assert.ok(item.id, `zh.${s}.items[${i}] 缺 id`);
      assert.ok(item.icon, `zh.${s}.items[${i}] 缺 icon`);
      assert.ok(item.icon.startsWith("https://cdn.longsizhuo.com/"),
        `zh.${s}.items[${i}].icon 不是 CDN URL: ${item.icon}`);
    }
  }
});

test("id 在各段落内唯一——重复 id 会让 React key 撞车", () => {
  for (const s of SECTIONS) {
    const ids = zh[s].items.map((it) => it.id);
    assert.equal(new Set(ids).size, ids.length, `${s} 存在重复 id: ${ids}`);
  }
});

test("中英条目一一对应，且非文本字段完全一致", () => {
  for (const s of SECTIONS) {
    assert.equal(en[s].items.length, zh[s].items.length, `${s} 中英条目数不一致`);
    for (const [i, zhItem] of zh[s].items.entries()) {
      const enItem = en[s].items[i];
      assert.equal(enItem.id, zhItem.id, `${s}[${i}] id 中英不一致`);
      assert.equal(enItem.icon, zhItem.icon, `${s}[${i}] icon 中英不一致`);
      assert.equal(enItem.iconBg, zhItem.iconBg, `${s}[${i}] iconBg 中英不一致`);
    }
  }
});

test("在列表中间插入条目后，其余条目的 icon 不变——这是本次要修的 bug", () => {
  const before = zh.honors.items.map((it) => [it.id, it.icon]);
  const mutated = [...zh.honors.items];
  mutated.splice(1, 0, { id: "inserted", title: "新荣誉", issuer: "x", date: "2026",
                         description: "x", icon: "https://cdn.longsizhuo.com/logos/awards/usyd.png" });
  const after = mutated.filter((it) => it.id !== "inserted").map((it) => [it.id, it.icon]);
  assert.deepEqual(after, before,
    "插入条目后原有条目的 icon 发生了变化——说明 icon 仍与位置绑定");
});
```

- [ ] **Step 6: 跑测试**

Run: `node --test test/content-icons.test.mjs`
Expected: PASS，4 个测试全绿。

- [ ] **Step 7: 抽查 CDN 上的 logo 真能访问**

```bash
python3 -c "
import json;d=json.load(open('src/i18n/zh.json'))
for s in ['experience','education','honors']:
    for it in d[s]['items']: print(it['icon'])" | sort -u | while read u; do
  printf "%s %s\n" "$(curl -s -o /dev/null -w '%{http_code}' "$u")" "$u"
done
```

预期：每行都以 `200` 开头。任何 404 都要回 Step 3 对照 Step 2 的 key 列表改正。

- [ ] **Step 8: 提交**

```bash
git add src/i18n/zh.json src/i18n/en.json test/content-icons.test.mjs
git commit -m "feat:每条内容自带 icon URL，不再按数组下标配图

honorIcons[index] / universityIcons[index] / experiences[index].icon
这三处让「在列表中间插一条」会把后面所有 logo 顶错位。icon 跟着条目
走之后，增删排序都是安全的——这是管理后台能自由编辑的前提。"
```

---

### Task 5: 三个组件改读条目自带的 icon

**Files:**
- Modify: `src/components/Honors.tsx`, `src/components/Education.tsx`, `src/components/Experience.tsx`, `src/constants/index.ts`

**Interfaces:**
- Consumes: Task 4 写入的 `item.id` / `item.icon` / `item.iconBg`

- [ ] **Step 1: 改 Honors.tsx**

删掉 10-15 行（4 个 logo import 和 `honorIcons` 数组），把条目类型加上 `id` 和 `icon`，渲染时用 `item.icon`：

```tsx
const Honors = () => {
  const { t } = useTranslation();
  const items = Array.isArray(t("honors.items", { returnObjects: true }))
    ? (t("honors.items", { returnObjects: true }) as Array<{
        id: string; title: string; issuer: string; date: string;
        description: string; icon: string;
      }>)
    : [];
```

`map` 里 `key` 从 `index` 换成 `item.id`，`icon={honorIcons[index] || ""}` 换成 `icon={item.icon}`。`HonorCard` 的 props 类型不变（它本来就收 `icon: string`）。

`<img src={icon}>` 加一行错误兜底，避免 CDN 挂了显示裂图：

```tsx
<img
  src={icon}
  alt=""
  className="w-8 h-8 object-contain"
  onError={(e) => { e.currentTarget.style.display = "none"; }}
/>
```

- [ ] **Step 2: 改 Education.tsx**

删掉 9-15 行（2 个 import 和 `universityIcons`）。条目类型加 `id` / `icon` / `iconBg`。34 行的 `const iconData = universityIcons[index];` 整行删掉，下面三处 `iconData?.xxx` 换成 `edu.xxx`：

```tsx
{educations.map((edu, index) => (
  <motion.div
    key={edu.id}
    variants={fadeIn("up", "spring", index * 0.3, 0.75)}
    className="bg-black-200 p-8 rounded-3xl w-full flex flex-col sm:flex-row gap-6"
  >
    <div className="flex-shrink-0 flex items-start justify-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: edu.iconBg || "#1a237e" }}
      >
        {edu.icon ? (
          <img
            src={edu.icon}
            alt={edu.university}
            className="w-[70%] h-[70%] object-contain"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <span className="text-white font-bold text-[18px]">
            {edu.university.split("(")[1]?.replace(")", "") || edu.university.substring(0, 4)}
          </span>
        )}
      </div>
    </div>
    {/* Content 部分原样不动 */}
```

注意 `key` 从 `edu.university` 换成 `edu.id`——中英切换时 `university` 会变，`id` 不会。

- [ ] **Step 3: 改 Experience.tsx**

删掉 12 行 `import { experiences } from "../constants";`。条目类型加 `id` / `icon` / `iconBg`，89-90 行改成读条目自己的字段：

```tsx
).map((item) => (
  <ExperienceCard
    key={item.id}
    experience={{
      title: item.title,
      company_name: item.company,
      date: item.date,
      points: item.points,
      icon: item.icon,
      iconBg: item.iconBg,
    }}
  />
))}
```

- [ ] **Step 4: 从 constants 删掉已迁移的数据**

`src/constants/index.ts`：删掉 `experiences` 数组、`projects` 数组，以及它们专属的 import（`bsh` `unsw` `spotFinder` `spotFinderLogo` `drcvt` `kwai`），并从底部 `export` 语句里移除 `experiences` 和 `projects`。

**`services` / `technologies` / `testimonials` 和它们的 import 一个都不要动**——`Tech.tsx` 和 `Feedbacks.tsx` 还 import 着，删了 build 会挂。

- [ ] **Step 5: 跑 lint 和类型检查**

Run: `pnpm lint && pnpm tsc`
Expected: 零错误零警告。若报 `experiences is not exported`，说明 Step 4 漏删了某处引用，grep 一下 `experiences` 找出来。

- [ ] **Step 6: 目视验证**

Run: `pnpm dev`
Expected：工作经验时间线 4 个 logo、教育 2 个校徽、荣誉 4 个奖章图标，全部正常显示且对应正确。切中英文再看一遍，logo 不应变化。

- [ ] **Step 7: 手动验证 bug 确实修好了**

在 `src/i18n/zh.json` 的 `honors.items` **开头**临时插一条假数据（`id: "tmp"`，icon 用软著那张 `copyright.png`），`pnpm dev` 看：

Expected: 新条目显示软著图标，**原有 4 条的图标全部不变**。改之前这么做会让 4 条全部错位一格。

验证完把假数据删掉。

- [ ] **Step 8: 提交**

```bash
git add src/components/Honors.tsx src/components/Education.tsx \
        src/components/Experience.tsx src/constants/index.ts
git commit -m "refactor: 三个组件改读条目自带的 icon

删除 honorIcons / universityIcons / experiences[index] 三处下标映射。
constants 里保留 services/technologies/testimonials —— Tech.tsx 和
Feedbacks.tsx 仍在 import，虽然这两个组件本身没被任何地方渲染。"
```

---

### Task 6: 恢复静态项目卡片

`Works.tsx` 现在只渲染 GitHub pinned repos。`projects.staticItems` 里的 Spot Finder、Hello-algo、降维聚类工具三条从来没显示过。Spot Finder 是 USYD 编程节冠军项目、降维聚类工具有软著，都不在 GitHub pinned 里，值得单独展示。

**Files:**
- Modify: `src/i18n/zh.json`, `src/i18n/en.json`, `src/components/Works.tsx`

**Interfaces:**
- Consumes: Task 4 建立的「条目自带资源 URL」约定
- Produces: `projects.staticItems[]` 每项含 `id` / `name` / `description` / `image` / `tags: Array<{name, color}>` / `source_code_link`

- [ ] **Step 1: 补全 staticItems 字段**

`src/i18n/zh.json` 的 `projects.staticItems`，三条各补 `id` / `image` / `tags` / `source_code_link`。数据从 `src/constants/index.ts` 即将删掉的 `projects` 数组里搬：

```json
{
  "id": "spotfinder",
  "name": "Spot Finder",
  "description": "一个停车位分时租赁系统，解决城市停车难题，增加车位拥有者收入。USYD 编程节冠军项目。",
  "image": "https://cdn.longsizhuo.com/logos/SpotFinder/logo.svg",
  "tags": [
    { "name": "golang", "color": "blue-text-gradient" },
    { "name": "docker", "color": "green-text-gradient" },
    { "name": "mysql", "color": "pink-text-gradient" }
  ],
  "source_code_link": "https://longsizhuo.com"
}
```

另外两条：
- `hello-algo`：image `https://www.hello-algo.com/assets/images/logo.svg`（外部 URL，保持原样），tags `python` / `visualization` / `open-source`，link `https://github.com/krahets/hello-algo`
- `drcvt`：image `https://cdn.longsizhuo.com/logos/1234.webp`，tags `r` / `data-visualization` / `bioinformatics`，link `https://longsizhuo.shinyapps.io/long/`

`en.json` 同步——`id` / `image` / `tags` / `source_code_link` 与中文完全一致，只有 `name` / `description` 保持英文。

- [ ] **Step 2: 在 Works.tsx 加静态项目卡片**

在 `GitHubProjectCard` 定义后面加一个 `StaticProjectCard`，复用同样的 Tilt 卡片样式：

```tsx
interface StaticProject {
  id: string;
  name: string;
  description: string;
  image: string;
  tags: { name: string; color: string }[];
  source_code_link: string;
}

const StaticProjectCard = ({ index, project }: { index: number; project: StaticProject }) => (
  <motion.div variants={fadeIn("up", "", index * 0.5, 0.75)}>
    <Tilt
      options={{ max: 45, scale: 0.9, speed: 450 }}
      className="bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full"
    >
      <a href={project.source_code_link} target="_blank" rel="noopener noreferrer">
        <div className="relative w-full h-[230px] flex items-center justify-center bg-black-100 rounded-2xl">
          <img
            src={project.image}
            alt={project.name}
            className="max-w-[70%] max-h-[70%] object-contain"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>
        <div className="mt-5">
          <h3 className="text-white font-bold text-[24px]">{project.name}</h3>
          <p className="mt-2 text-secondary text-[14px] line-clamp-3">{project.description}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <p key={tag.name} className={`text-[14px] ${tag.color}`}>#{tag.name}</p>
          ))}
        </div>
      </a>
    </Tilt>
  </motion.div>
);
```

`rel="noopener noreferrer"` 不能省——`target="_blank"` 不带它有 tabnabbing 风险。

然后在 `Works` 组件里，GitHub 卡片那段 `{repos.length > 0 && (...)}` 之后插入：

```tsx
{/* 手工维护的项目：不在 GitHub pinned 里的作品 */}
<div className="mt-10 flex flex-wrap gap-7">
  {(Array.isArray(t("projects.staticItems", { returnObjects: true }))
    ? (t("projects.staticItems", { returnObjects: true }) as StaticProject[])
    : []
  ).map((project, index) => (
    <StaticProjectCard key={project.id} index={index} project={project} />
  ))}
</div>
```

- [ ] **Step 3: lint 和类型检查**

Run: `pnpm lint && pnpm tsc`
Expected: 零错误零警告。

- [ ] **Step 4: 目视验证**

Run: `pnpm dev`，滚到「项目展示」。
Expected：GitHub pinned 卡片下面出现三张静态卡片（Spot Finder / Hello-algo / 降维聚类工具），图标显示正常，点击跳转到对应链接，中英切换文案跟着变而图标和链接不变。

- [ ] **Step 5: 提交**

```bash
git add src/i18n/zh.json src/i18n/en.json src/components/Works.tsx
git commit -m "feat: render the static project cards again

Works only ever rendered GitHub pinned repos, so Spot Finder (USYD
Coding Fest winner) and the copyrighted DRCV tool were never visible —
neither is a pinned GitHub repo."
```

---

### Task 7: 3D 模型迁 R2

`public/desktop_pc/`（16MB）和 `public/planet/`（2.9MB）是 Hero 的电脑模型和地球，都在用。

**Files:**
- Modify: `src/components/canvas/Computers.tsx`, `src/components/canvas/Earth.tsx`
- Delete: `public/desktop_pc/`, `public/planet/`

- [ ] **Step 1: 上传模型**

Run: `node scripts/migrate-to-r2.mjs models`
Expected: 打印 59 个 key，最后报 `R2 上 models/ 现有 59 个对象`。

- [ ] **Step 2: 确认 gltf 能从 CDN 取到**

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://cdn.longsizhuo.com/models/desktop_pc/scene.gltf
curl -s -o /dev/null -w "%{http_code}\n" https://cdn.longsizhuo.com/models/planet/scene.gltf
```

预期：两行都是 `200`。第一行 content_type 应为 `model/gltf+json`。

- [ ] **Step 3: 改 useGLTF 路径**

`src/components/canvas/Computers.tsx` 里 `useGLTF("./desktop_pc/scene.gltf")` 改成 `useGLTF("https://cdn.longsizhuo.com/models/desktop_pc/scene.gltf")`；`Earth.tsx` 里 `./planet/scene.gltf` 同理改成 `https://cdn.longsizhuo.com/models/planet/scene.gltf`。

先 grep 确认实际写法，不要凭上面的猜测直接改：

```bash
grep -n "useGLTF\|scene.gltf" src/components/canvas/*.tsx
```

- [ ] **Step 4: 验证模型能加载**

Run: `pnpm dev`，看首屏。
Expected：电脑 3D 模型正常渲染并跟随鼠标；滚到「联系我」看地球模型也在转。DevTools Network 里 `scene.gltf`、`scene.bin` 和贴图都从 `cdn.longsizhuo.com` 加载，全部 200。

**若模型不显示**，先看 Console 有没有 CORS 报错。R2 自定义域默认允许跨域读取，若确实报 CORS，去 R2 → `me-assets` → Settings → CORS Policy 加 `AllowedOrigins: ["https://longsizhuo.com", "http://localhost:5173"]`、`AllowedMethods: ["GET"]`。

- [ ] **Step 5: 删除本地模型文件**

```bash
git rm -r --cached public/desktop_pc public/planet
rm -rf public/desktop_pc public/planet
```

- [ ] **Step 6: 再验一次**

Run: `pnpm dev`
Expected: 模型仍然正常——这次是真的从 CDN 加载，因为本地已经没有了。

- [ ] **Step 7: 提交**

```bash
git add -A public/ src/components/canvas/
git commit -m "refactor: serve the 3D models from R2

19MB of GLTF and textures out of the repo."
```

---

### Task 8: USYDCodingFest 归档并清出仓库

118MB、17 个文件，线上从未显示过——唯一引用它的 `src/utils/getImages.tsx` 的 glob 路径 `../public/USYDCodingFest/*` 从 `src/utils/` 解析成 `src/public/`，永远匹配不到；而且 `getImages` 本身没被任何组件 import。

先完整传进 R2 `_archive/` 再从 git 删——**归档不是丢弃**，第二期做完后能在管理后台把它转成正式相册。

**Files:**
- Delete: `public/USYDCodingFest/`

- [ ] **Step 1: 上传归档**

Run: `node scripts/migrate-to-r2.mjs archive`
Expected: 打印 17 个 key（含空格的文件名），最后报 `R2 上 _archive/ 现有 17 个对象`。

单文件最大 10.5MB，远低于单次 PUT 的 5GiB 上限，不需要分片上传。

- [ ] **Step 2: 严格核对——删之前必须确认一个不少**

```bash
LOCAL=$(find public/USYDCodingFest -type f | wc -l)
REMOTE=$(node -e 'import("./scripts/r2.mjs").then(async r2 =>
  console.log((await r2.listObjects("_archive/USYDCodingFest/")).length))')
echo "本地 $LOCAL / R2 $REMOTE"
[ "$LOCAL" = "$REMOTE" ] && echo "数量一致 ✓" || echo "不一致，不要删！"
```

再抽查一个含空格的文件真能下载：

```bash
curl -s -o /dev/null -w "%{http_code} %{size_download} bytes\n" \
  "https://cdn.longsizhuo.com/_archive/USYDCodingFest/Coding%20Fest%202024%20AWARDS_-516.jpg"
```

预期 `200 10353265 bytes`，字节数与本地一致（`stat -c%s "public/USYDCodingFest/Coding Fest 2024 AWARDS_-516.jpg"`）。

**数量不一致或抽查失败就停在这里，不要执行 Step 3。**

- [ ] **Step 3: 从仓库删除**

```bash
git rm -r --cached public/USYDCodingFest
rm -rf public/USYDCodingFest
```

- [ ] **Step 4: 删掉 src/assets/album 本地副本**

Task 2 已经把相册传上去、Task 3 已经改成读 CDN，本地副本可以删了。

```bash
git rm -r --cached src/assets/album
rm -rf src/assets/album
```

- [ ] **Step 5: 确认 build 不依赖已删除的文件**

Run: `pnpm build`
Expected: 构建成功。若报找不到 `src/assets/album/...`，说明还有地方 glob 它，grep `assets/album` 找出来。

- [ ] **Step 6: 看看仓库瘦了多少**

```bash
echo "工作区: $(du -sh --exclude=.git --exclude=node_modules --exclude=dist . | cut -f1)"
```

预期从约 148MB 降到 10MB 以内。

注意：`.git` 目录里的历史对象还在，`du -sh .git` 仍然很大。**本计划不做 git 历史重写**——`filter-repo` 会改写所有 commit hash，对一个已推送的仓库风险大于收益。新 clone 仍要拉历史里的大文件，但工作区和构建都清爽了。要彻底清理历史是独立决策，另说。

- [ ] **Step 7: 提交**

```bash
git add -A public/ src/assets/
git commit -m "chore: 118MB of never-rendered photos out of the repo

public/USYDCodingFest was only referenced by src/utils/getImages.tsx,
whose glob '../public/USYDCodingFest/*' resolves to src/public/ from
src/utils/ and therefore never matched anything — and getImages itself
is imported nowhere. Archived to R2 _archive/ first; phase 2's admin can
turn it into a real album.

Note: git history still carries these objects. Rewriting history on an
already-pushed repo is a separate decision, deliberately not done here."
```

---

### Task 9: SEO —— 静态 meta、JSON-LD、noscript

中文名目前只在 `<meta keywords>`（Google 2009 年起完全忽略）和 JSON-LD 的 `alternateName` 里。`<title>`、`<meta description>`、noscript 正文这些真正有权重的地方一个中文字都没有。

**Files:**
- Modify: `index.html`

- [ ] **Step 1: title 和 description 改中文优先**

`index.html:32` 的 `<title>` 和 `:6` 的 description：

```html
<title>龙思卓 (Sizhuo Long) | 快手前端工程师 · 个人主页</title>
<meta name="description" content="龙思卓（Sizhuo Long），快手科技前端工程师，坐标北京。新南威尔士大学 UNSW 信息技术硕士（优等）。第15届蓝桥杯国际赛 Python 算法研究生组第一名。专注交互设计、动画基础设施与渲染性能优化。">
<meta name="author" content="龙思卓 Sizhuo Long">
```

`keywords` 那行保留不动——它没什么用但也没害处，删它不产生收益。

- [ ] **Step 2: OG 和 Twitter 同步**

`:18-19` 和 `:25-26` 四处 title/description 都改成中文优先：

```html
<meta property="og:title" content="龙思卓 (Sizhuo Long) | 快手前端工程师">
<meta property="og:description" content="快手科技前端工程师，坐标北京。UNSW 信息技术硕士（优等）。蓝桥杯国际赛 Python 算法第一名。专注交互设计、动画基础设施与渲染性能优化。">
<meta property="og:locale" content="zh_CN">
<meta property="og:locale:alternate" content="en_US">
```

Twitter 的 title/description 用同样两句。

- [ ] **Step 3: JSON-LD 主名改中文**

`:52-53`：

```json
"name": "龙思卓",
"alternateName": ["Sizhuo Long", "Siz Long", "Long Sizhuo", "Loong Loong"],
```

`worksFor` 和 `alumniOf` 补中文名：

```json
"worksFor": {
  "@type": "Organization",
  "name": "快手科技",
  "alternateName": ["Kuaishou Technology", "Kwai"]
},
"alumniOf": [
  {
    "@type": "EducationalOrganization",
    "name": "新南威尔士大学",
    "alternateName": "University of New South Wales"
  },
  {
    "@type": "EducationalOrganization",
    "name": "成都信息工程大学",
    "alternateName": "Chengdu University of Information Technology"
  }
]
```

搜索目标是中文名，主名就该是中文名。

- [ ] **Step 4: noscript 改成真正的中文简介**

`:82-90` 现在写的是「Please enable JavaScript」——对爬虫等于空页面。**这是百度唯一能读到的正文**，改成有实质内容的：

```html
<noscript>
  <div style="max-width:720px;margin:0 auto;padding:3rem 2rem;background:#050816;color:#f7f8f8;font-family:Inter,sans-serif;min-height:100vh">
    <h1>龙思卓 (Sizhuo Long)</h1>
    <p style="color:#915EFF;font-size:1.1rem">快手科技 前端工程师 · 北京</p>
    <h2>关于</h2>
    <p style="color:#aaa6c3;line-height:1.8">
      龙思卓，前端工程师，现就职于快手科技，专注于构建大规模高性能用户体验，
      主攻动画基础设施与渲染性能优化。新南威尔士大学（UNSW）信息技术硕士，
      成绩优等（Distinction）；成都信息工程大学数字媒体技术学士。
    </p>
    <h2>荣誉</h2>
    <ul style="color:#aaa6c3;line-height:1.8">
      <li>第15届蓝桥杯国际赛 Python 算法研究生 A 类 第一名</li>
      <li>悉尼大学编程节（USYD Coding Fest）冠军 —— Spot Finder 项目</li>
      <li>单细胞 RNA-seq 降维聚类可视化工具 软件著作权</li>
      <li>新南威尔士大学 COMP9021 / COMP3900 助教</li>
    </ul>
    <h2>联系</h2>
    <p style="color:#aaa6c3;line-height:1.8">
      邮箱：longsizhuo@gmail.com<br>
      GitHub：<a href="https://github.com/longsizhuo" style="color:#915EFF">github.com/longsizhuo</a><br>
      小红书：<a href="https://www.xiaohongshu.com/user/profile/5c0b8cc2000000000601e809" style="color:#915EFF">龙思卓</a>
    </p>
    <p style="color:#666;margin-top:2rem;font-size:0.9rem">本站完整内容需要 JavaScript，请启用后刷新。</p>
  </div>
</noscript>
```

- [ ] **Step 5: 验证 HTML 合法且 JSON-LD 能解析**

```bash
python3 - <<'PY'
import re, json
html = open("index.html", encoding="utf-8").read()
block = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S).group(1)
data = json.loads(block)
print("JSON-LD 解析成功, name =", data["name"])
assert data["name"] == "龙思卓", "主名不是中文名"
title = re.search(r"<title>(.*?)</title>", html, re.S).group(1)
desc  = re.search(r'<meta name="description" content="(.*?)">', html, re.S).group(1)
assert "龙思卓" in title, "title 里没有中文名"
assert "龙思卓" in desc,  "description 里没有中文名"
assert "龙思卓" in re.search(r"<noscript>(.*?)</noscript>", html, re.S).group(1), "noscript 里没有中文名"
print("title:", title)
print("中文名出现在 title / description / noscript / JSON-LD 四处 ✓")
PY
```

Expected: 全部断言通过并打印 ✓。

- [ ] **Step 6: 确认构建产物保留了这些内容**

```bash
pnpm build
grep -c "龙思卓" dist/index.html
```

Expected: 输出 ≥ 4。Vite 不会动 `<noscript>` 和 meta，但验证一下比假设强。

- [ ] **Step 7: 提交**

```bash
git add index.html
git commit -m "seo: 中文名进入 title、description、noscript 和 JSON-LD 主名

此前「龙思卓」只出现在 <meta keywords>（Google 2009 年起忽略）和
JSON-LD 的 alternateName 里，四个有权重的位置一个中文字都没有。

noscript 从「请启用 JavaScript」改成完整中文简介 —— 百度基本不执行
JS，这是它唯一能抓到的正文。"
```

---

### Task 10: SEO —— `/zh` `/en` 路由、hreflang、默认中文

中文版现在没有独立 URL（语言存在 localStorage），爬虫无从索引中文页面。加可索引的语言 URL。

**Files:**
- Modify: `src/i18n/index.ts`, `src/App.tsx`, `index.html`, `public/sitemap.xml`
- Test: `test/lang-from-path.test.mjs`

**Interfaces:**
- Produces: `langFromPath(pathname: string): "zh" | "en" | null`（从 `src/i18n/index.ts` 导出，供 App.tsx 使用）

- [ ] **Step 1: 写语言解析的失败测试**

这是本任务唯一有分支的逻辑，值得测试。

```javascript
// test/lang-from-path.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

// 与 src/i18n/index.ts 的实现保持一致。这里重复一份是因为 node --test
// 不编译 TS；函数只有三行，重复比引入编译步骤划算。
// 改这个函数时两处都要改，content-icons 那类跨文件一致性测试不适用于此。
function langFromPath(pathname) {
  const seg = pathname.split("/")[1];
  return seg === "zh" || seg === "en" ? seg : null;
}

test("/zh 和 /en 解析出语言", () => {
  assert.equal(langFromPath("/zh"), "zh");
  assert.equal(langFromPath("/en"), "en");
});

test("带尾部路径也能解析", () => {
  assert.equal(langFromPath("/zh/"), "zh");
  assert.equal(langFromPath("/en/tools"), "en");
});

test("根路径和其他路径返回 null，交给后续优先级决定", () => {
  assert.equal(langFromPath("/"), null);
  assert.equal(langFromPath("/tools"), null);
  assert.equal(langFromPath(""), null);
});

test("不把 zh/en 之外的段当语言", () => {
  assert.equal(langFromPath("/zhihu"), null);
  assert.equal(langFromPath("/english"), null);
  assert.equal(langFromPath("/ZH"), null);
});
```

- [ ] **Step 2: 跑测试确认通过**

Run: `node --test test/lang-from-path.test.mjs`
Expected: PASS，4 个测试全绿（测试里自带实现，所以直接通过；它的作用是锁住 Step 3 要写的实现行为）。

- [ ] **Step 3: 改语言解析优先级，默认中文**

`src/i18n/index.ts`：

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import zh from "./zh.json";

export type Lang = "zh" | "en";

/** URL 首段是 /zh 或 /en 时返回对应语言，否则 null */
export function langFromPath(pathname: string): Lang | null {
  const seg = pathname.split("/")[1];
  return seg === "zh" || seg === "en" ? seg : null;
}

/** 优先级：URL > localStorage > 浏览器语言 > 中文 */
function resolveLang(): Lang {
  if (typeof window === "undefined") {
    return "zh";
  }
  const fromPath = langFromPath(window.location.pathname);
  if (fromPath) {
    return fromPath;
  }
  const saved = localStorage.getItem("lang");
  if (saved === "zh" || saved === "en") {
    return saved;
  }
  return navigator.language?.startsWith("zh") ? "zh" : "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: resolveLang(),
  fallbackLng: "zh",
  interpolation: { escapeValue: false },
  returnObjects: true,
});

export default i18n;
```

注意两处改动的理由：
- `fallbackLng` 从 `"en"` 改成 `"zh"`——中文是内容源语言，某个 key 只有中文时该显示中文而不是显示 key 名。
- 无任何信号时按 `navigator.language` 判断，而不是硬编码中文。硬编码会让英文访客首屏看到中文；靠浏览器语言判断对两边都合理，中文名 SEO 由 `/zh` 这个独立 URL 承担，不需要牺牲英文访客体验。

- [ ] **Step 4: 加 /zh 和 /en 路由**

`src/App.tsx`，在现有 `/` 路由旁边加两条。新增一个组件在挂载时同步 i18n 语言：

```tsx
import i18n, { langFromPath, type Lang } from "./i18n";

function LangRoute({ lang }: { lang: Lang }) {
  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
      localStorage.setItem("lang", lang);
    }
  }, [lang]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <HomePage />
    </motion.div>
  );
}
```

路由表里加：

```tsx
<Route path="/zh" element={<LangRoute lang="zh" />} />
<Route path="/en" element={<LangRoute lang="en" />} />
```

**注意**：`langFromPath` 在这个文件里没直接用到，别为了「用上」而强行 import——ESLint 配了 `--max-warnings 0`，未使用的 import 会直接让 lint 失败。

- [ ] **Step 5: 加 hreflang**

`index.html` 的 canonical 那行（`:30`）后面加：

```html
<link rel="alternate" hreflang="zh-CN" href="https://longsizhuo.com/zh">
<link rel="alternate" hreflang="en" href="https://longsizhuo.com/en">
<link rel="alternate" hreflang="x-default" href="https://longsizhuo.com/">
```

- [ ] **Step 6: 更新 sitemap**

`public/sitemap.xml` 加两条语言 URL，并给每条加交叉引用：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://longsizhuo.com/</loc>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="https://longsizhuo.com/zh"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://longsizhuo.com/en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://longsizhuo.com/"/>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://longsizhuo.com/zh</loc>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="https://longsizhuo.com/zh"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://longsizhuo.com/en"/>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://longsizhuo.com/en</loc>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="https://longsizhuo.com/zh"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://longsizhuo.com/en"/>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://longsizhuo.com/tools</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
```

- [ ] **Step 7: 本地验证路由**

Run: `pnpm dev`，依次访问：
- `http://localhost:5173/zh` → 页面中文，`<html lang>` 是 `zh-CN`
- `http://localhost:5173/en` → 页面英文，`<html lang>` 是 `en`
- `http://localhost:5173/` → 按浏览器语言，不报错

Expected: 三个都正常渲染，不出现 404 页面。

`<html lang>` 由现有的 `HtmlLangSync` 组件负责（`App.tsx` 里已有），无需改动。

- [ ] **Step 8: lint、类型检查、测试全跑一遍**

Run: `pnpm lint && pnpm tsc && node --test test/`
Expected: 全部零错误，所有测试通过。

- [ ] **Step 9: 提交**

```bash
git add src/i18n/index.ts src/App.tsx index.html public/sitemap.xml test/lang-from-path.test.mjs
git commit -m "seo: indexable /zh and /en routes with hreflang

The language lived in localStorage only, so there was no distinct URL
for crawlers to index Chinese content against. Language resolution is
now URL > localStorage > navigator.language > zh, and fallbackLng moves
to zh since Chinese is the source language."
```

---

### Task 11: 把 `pnpm tsc` 清零

放在 Task 1-10 之后做，是因为 `Album.tsx` 的 9 个错误会被 Task 3 的重写自动消掉，先修就是白干。

**Files:**
- Delete: `src/utils/getImages.tsx`, `src/components/GitHubCard.tsx`, `src/components/PhotoGalleryDialog.tsx`, `src/components/Contact.tsx`, `src/constants/convert-frame.ts`
- Modify: 剩余报错的活文件

- [ ] **Step 1: 确认这五个文件确实没人引用**

```bash
for f in getImages GitHubCard PhotoGalleryDialog Contact convert-frame; do
  n=$(grep -rln "$f" src index.html --include='*.ts' --include='*.tsx' --include='*.html' 2>/dev/null \
       | grep -v "/$f\.tsx\$\|/$f\.ts\$" | tr '\n' ' ')
  echo "$f -> ${n:-无人引用}"
done
```

Expected: 五个都是「无人引用」。`Contact` 可能因为 `ContactAdvanced` 含有 `Contact` 子串而误报——单独核对 `grep -rn "from \"./Contact\"\|from '\./Contact'" src`，确认没有精确匹配再删。

`src/components/index.ts` 若导出了它们，一并删掉导出行。

- [ ] **Step 2: 删除并确认错误数下降**

```bash
git rm src/utils/getImages.tsx src/components/GitHubCard.tsx \
       src/components/PhotoGalleryDialog.tsx src/components/Contact.tsx \
       src/constants/convert-frame.ts
pnpm tsc 2>&1 | grep -c "error TS"
```

Expected: 从约 30 降到 0 附近再看——此时 Album 已被 Task 3 重写，剩下的应该只有活文件的约 30 个。

- [ ] **Step 3: 逐个修活文件**

按文件逐个处理，每修完一个跑一次 `pnpm tsc 2>&1 | grep -c "error TS"` 确认数字在降。常见修法：

- `Property 'gtag' does not exist on type 'Window'`（`App.tsx`）→ 在 `src/vite-env.d.ts` 加全局声明：
  ```typescript
  declare global {
    interface Window {
      gtag?: (...args: unknown[]) => void;
    }
  }
  export {};
  ```
- `Parameter 'x' implicitly has an 'any' type` → 补上真实类型，**不要**用 `any` 糊过去。
- `'ref.current' is of type 'unknown'`（`Stars.tsx`）→ `useRef<Points>(null)` 之类给出泛型参数。
- `Could not find a declaration file for module 'react-vertical-timeline-component'`（`Experience.tsx`）→ 该包无官方类型。在 `src/vite-env.d.ts` 加 `declare module "react-vertical-timeline-component";`，或装 `@types/react-vertical-timeline-component`（若存在）。
- `Argument of type 'HTMLElement | null'`（`main.tsx`）→ `document.getElementById("root")!` 或显式判空后再 `createRoot`。

**不要**为了消错误而放宽 `tsconfig.json` 的 `noImplicitAny` / `strictNullChecks`——那是把问题藏起来，不是修好。

- [ ] **Step 4: 确认归零**

```bash
pnpm lint && pnpm tsc && echo "lint + tsc 双绿"
pnpm build && echo "build 通过"
```

Expected: 三项全过，`pnpm tsc` 零输出。

- [ ] **Step 5: 目视回归**

Run: `pnpm dev`
Expected: 首页所有区块正常——尤其 `GlobalLottieBackground`（背景动画）、`Stars`（星空）、`ContactAdvanced`（联系表单）、`About`（GitHub 数据），这四个是本任务改动最多的活文件。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "fix: pnpm tsc passes clean for the first time

Deletes five files nothing imports and fixes the remaining type errors
in live code. Does not relax noImplicitAny or strictNullChecks — the
point is that tsc can now be a gate, which phase 2 needs when it rewires
eight components onto a runtime content layer."
```

---

### Task 12: Tailwind 3.4 → 4.x

**排在最后。** 配置格式大改版，全站样式都要回归验证。放最后是为了：万一出问题，前面的 R2 迁移和 SEO 成果已经稳了，可以单独回滚这一个 commit。

**Files:**
- Modify: `package.json`, `postcss.config.ts`, `src/index.css`, `tailwind.config.ts`（大概率删除）

- [ ] **Step 1: 先记录改造前的样子**

```bash
pnpm build && pnpm dev
```

浏览器逐屏截图或记录：Hero、About、相册、工作经验时间线、教育、荣誉、项目卡片、联系表单、页脚。改完要逐一比对。**这一步不能省**——Tailwind 4 的样式回归很难靠读代码发现。

- [ ] **Step 2: 读官方迁移指南，别凭记忆改**

```bash
pnpm dlx @tailwindcss/upgrade@latest
```

官方升级工具会自动改 PostCSS 配置、`@tailwind` 指令、以及大部分改名了的工具类。先让它跑，再人工核对 diff。

- [ ] **Step 3: 迁移自定义主题**

`tailwind.config.ts` 里的自定义值要搬进 CSS 的 `@theme`。当前有这些自定义项，一个都不能漏：

- 颜色：`primary` `secondary` `tertiary` `black-100` `black-200` `white-100`
- 背景图：`hero-pattern-dark` `hero-pattern-light`（注意：`App.tsx` 用的是 `bg-hero-pattern`，这个类名**不存在**，是既有 bug，迁移时顺手确认要不要修）
- 自定义断点 `xs`

改完 `grep -rn "bg-primary\|text-secondary\|bg-tertiary\|bg-black-100\|bg-black-200\|text-white-100\|xs:" src/` 逐个确认仍然生效。

- [ ] **Step 4: 构建并逐屏比对**

```bash
pnpm lint && pnpm tsc && pnpm build
pnpm dev
```

Expected: 三项全绿，且 Step 1 记录的九个区块**视觉上无差异**。有差异就逐个查，不要"看起来差不多"就放过。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "build: upgrade Tailwind to 4.x

Config moves from tailwind.config.ts into CSS @theme. All nine sections
visually diffed against the pre-upgrade build."
```

---

### Task 13: 部署与线上验证

**本机就是生产服务器**（`longsizhuo.com` A 记录 → `161.118.194.132` = 本机公网 IP）。服务由 Caddy 提供，root 是 `/home/ubuntu/me/dist` 经 bind mount 挂到 `/srv/longsizhuo`。

**部署就是 `pnpm build`，没有别的步骤。不要跑 `deploy.sh`。**

**Files:** 无代码改动

- [ ] **Step 1: 全量检查后构建上线**

```bash
cd /home/ubuntu/me
pnpm lint && pnpm tsc && node --test test/ && pnpm build
```

四项全绿即上线——构建产物落到 `dist/`，Caddy 通过 bind mount 立刻读到。

**不要执行 `./deploy.sh`**：它 rsync 到 `/var/www/longsizhuo.com`（Caddy 不读这个目录），然后 `systemctl reload nginx`（nginx 没运行，必然失败）。Task 0 已经确认过构建不会打断 bind mount。

- [ ] **Step 2: SPA fallback 无需任何操作**

Caddy 运行配置里已有 `try_files {http.request.uri.path} /index.html`，`/zh` `/en` 开箱可用。确认一下即可：

```bash
sudo curl -s localhost:2019/config/ | grep -c try_files    # 预期 ≥ 1
```

- [ ] **Step 3: 推送到 GitHub**

```bash
git push origin master
```

这一步只是备份和触发 i18n 自动翻译的 CI，**与上线无关**——上线在 Step 1 就完成了。

注意：推送 `zh.json` 会触发 `.github/workflows/translate.yml` 自动翻译并回推 `en.json`。本计划里 `en.json` 是手工同步的（Task 4 Step 4、Task 6 Step 1），CI 只会补它认为缺失的 key，不会覆盖已有值。推完拉一下看 CI 有没有改动：

```bash
sleep 60 && git pull --rebase && git log --oneline -3
```

若 CI 改了 `en.json`，重跑 `node --test test/content-icons.test.mjs` 确认 icon 字段没被翻译污染，然后重新 `pnpm build`。

- [ ] **Step 4: 线上验证**

```bash
# 中文名进了静态 HTML（这决定百度能不能抓到）
curl -s https://longsizhuo.com/ | grep -o "龙思卓" | wc -l          # 预期 ≥ 4

# 语言路由不是 404
curl -s -o /dev/null -w "%{http_code}\n" https://longsizhuo.com/zh   # 预期 200
curl -s -o /dev/null -w "%{http_code}\n" https://longsizhuo.com/en   # 预期 200

# hreflang 在
curl -s https://longsizhuo.com/ | grep -c hreflang                   # 预期 3

# sitemap 更新了
curl -s https://longsizhuo.com/sitemap.xml | grep -c "<loc>"         # 预期 4

# 图片走 CDN
curl -s -o /dev/null -w "%{http_code}\n" https://cdn.longsizhuo.com/models/desktop_pc/scene.gltf  # 预期 200
```

浏览器再目视一遍：3D 模型、相册、工作经验/教育/荣誉的 logo、项目卡片，全部正常。

- [ ] **Step 5: 清理 smoke test 遗留对象**

```bash
TOKEN=$(cat ~/.cloudflare-token)
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/e604afaf71a0dab4d6beb8f7ec2eca66/r2/buckets/me-assets/objects/_smoke%2Fhello.txt" \
  | python3 -m json.tool
```

- [ ] **Step 6: 交给用户手动做的三件事**

这三件我做不了，列给用户：

1. **百度站长平台**（ziyuan.baidu.com）提交站点和 `https://longsizhuo.com/sitemap.xml`。不提交百度基本不会主动收录个人站。
2. **检查 Cloudflare Bot Fight Mode 是否挡了 Baiduspider。** Dashboard → Security → Bots。开着的话百度蜘蛛会被拦，Task 9、10 全部白做。挡了就给 Baiduspider 加放行 WAF 规则。
3. **Google Search Console** 提交 sitemap，用「网址检查」看 `/zh` 的渲染结果里有没有中文正文。

收录需要几天到几周，别当天就判断有没有效果。

---

## 自查

**Spec 覆盖检查**

| Spec 要求 | 对应任务 |
|---|---|
| R2 bucket + cdn 自定义域 | Task 1 |
| 相册迁 R2 + 清单含 w/h | Task 2, 3 |
| logo 迁 R2 + 条目自带 icon | Task 4, 5 |
| 修 honorIcons/universityIcons/experiences 下标坑 | Task 5（Step 7 专门验证） |
| 恢复静态项目卡片 | Task 6 |
| 3D 模型迁 R2 | Task 7 |
| USYDCodingFest 归档并删除 | Task 8 |
| 保留死组件及 services/technologies/testimonials | Global Constraints + Task 5 Step 4 |
| SEO 静态 meta / JSON-LD / noscript | Task 9 |
| SEO /zh /en + hreflang + sitemap + 默认语言 | Task 10 |
| SPA fallback | Caddy 已有，Task 13 Step 2 仅确认 |
| 构建不打断 bind mount | Task 0 ✅ 已实测通过（dist inode 未变，站点 200） |
| 百度站长 / Bot Fight Mode 手动项 | Task 13 Step 6 |
| pnpm 11 迁移 + 安全 overrides 复位 | 已完成，commit 6c4a76d |
| tsc 清零 | Task 11 |
| Tailwind 4 升级 | Task 12 |

**部署链路的实测结论**（写进计划以免后续误判）：

- `longsizhuo.com` → `161.118.194.132` → **本机**。本机就是生产服务器。
- 80/443 由 **Caddy**（pid 3112）监听，**不是 nginx**（nginx 已安装但 inactive）。
- Caddy 跑在独立 mount namespace（`mnt:[4026532993]`）。`/proc/3112/mountinfo`：`/home/ubuntu/me/dist` 以 `ro` bind mount 挂到 `/srv/longsizhuo`，即 Caddy 的 root。从宿主 namespace 看 `/srv/longsizhuo` 不存在。
- 该 mount 没有 systemd unit，是手工 `unshare` 建的，**未被任何文件记录**。这是本次发现的最大运维隐患，Task 0 专门验证它。
- `deploy.sh` 的后半段（rsync 到 `/var/www/longsizhuo.com`、`nginx -t`、`systemctl reload nginx`）全部无效。本计划不修它——修部署脚本是独立决策，但**执行时绝不能调用它**。

**不在本计划内**（第二期）：Worker、KV、Cloudflare Access、admin SPA、DeepSeek 翻译接入、i18n 运行时覆盖层。第一期把 `zh.json` 落成了第二期 KV 文档的形状，第二期直接搬即可。

**类型一致性检查**

- `AlbumPhoto { key, w, h }` / `AlbumGroup { id, folder, photos }` —— Task 2 定义，Task 3 消费，字段名一致。
- `cdnUrl(key)` —— Task 2 定义，Task 3 消费。测试里重复了一份实现并已注明原因。
- `langFromPath(pathname)` —— Task 10 Step 1 测试先锁行为，Step 3 实现，签名一致。
- `StaticProject` 的 `tags: { name, color }[]` 与 zh.json 里写的结构一致（Task 6 Step 1 / Step 2）。
- `item.icon` / `item.iconBg` / `item.id` —— Task 4 写入，Task 5 读取，字段名一致。

**已知的重复**：`cdnUrl` 和 `langFromPath` 在测试文件里各重复了一份实现，因为 `node --test` 不编译 TS。两处都加了注释说明。要消除重复就得引入 TS 编译步骤或测试框架，为四行函数不值得。
