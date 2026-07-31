# 个人主页管理系统 + 图片迁移 R2

日期：2026-07-31
仓库：`longsizhuo/me`（Vite + React 19 SPA，构建后 rsync 到自有 nginx `/var/www/longsizhuo.com`）

## 问题

内容散在三处，加一条经历或一张照片要同时改三个地方：

| 内容 | 现状 | 痛点 |
|---|---|---|
| 文字 | `src/i18n/zh.json` 数组，CI 自动翻 `en.json` | 尚可 |
| 图标 / Logo | `src/assets/**` + 组件里**按数组下标**硬编码 | `Honors.tsx:15` `honorIcons[index]`、`Education.tsx:97` `universityIcons[index]`、`Experience.tsx:89` `experiences[index].icon` —— 中间插一条，后面所有 logo 错位 |
| 照片 | `src/assets/album/**` 12MB + `public/USYDCodingFest/` 118MB | 全在 git，加一张照片 = 提交二进制 + 全量重建 + rsync |

git 仓库约 140MB，其中 118MB 从未在线上显示过（见「已确认的死代码」）。

## 目标

1. 手机 / 任意设备访问 `longsizhuo.com/admin`，改完即时生效，不用重建部署。
2. 图片全部脱离 git，进 Cloudflare R2。
3. 内容可自由增删和排序，logo 跟着条目走而不是跟着下标走。

## 架构

```
浏览器 → longsizhuo.com          (你的 nginx 静态站，deploy.sh 流程不变)
   │
   │ 启动时 fetch /api/content
   ▼
Worker: me-admin-api             (Cloudflare 边缘拦截，打不到 nginx)
   ├ GET    /api/content         公开，边缘缓存，KV 读
   ├ PUT    /api/content         Access JWT → DeepSeek 翻译 → KV 写
   ├ POST   /api/upload          Access JWT → R2 put → 返回 CDN URL
   ├ DELETE /api/upload/:key     Access JWT → R2 delete
   └ GET    /admin*              管理后台 SPA（Worker assets binding）
              ↑ Cloudflare Access 策略：只放行 longsizhuo@gmail.com
   ├ KV  SITE_CONTENT  → key "content"（另存 "content:backup" 一份上一版）
   └ R2  me-assets     → 自定义域 cdn.longsizhuo.com
```

域名已在 Cloudflare 橙云代理下，Worker route 挂 `longsizhuo.com/api/*` 和 `longsizhuo.com/admin*` 即可，无需改 nginx。

## 核心设计：KV 内容是覆盖层，不是唯一来源

打包进 bundle 的 `zh.json` / `en.json` 保留为兜底基线。启动时拉 KV，逐节覆盖：

```ts
// src/i18n/index.ts
// VITE_CONTENT_API 默认 https://longsizhuo.com/api/content，
// 本地开发指向线上同一个 Worker（GET 公开，无需鉴权）
fetch(import.meta.env.VITE_CONTENT_API ?? "https://longsizhuo.com/api/content")
  .then((r) => r.json())
  .then(({ zh, en }) => {
    for (const [lng, doc] of [["zh", zh], ["en", en]] as const) {
      for (const [section, value] of Object.entries(doc ?? {})) {
        // 整节替换：数组按整体覆盖，避免 i18next 深合并对数组做逐下标合并
        i18n.addResourceBundle(lng, "translation", { [section]: value }, true, true);
      }
    }
  })
  .catch(() => {}); // ponytail: 静默失败，回退打包内容
```

由此得到的性质：

- **不需要骨架屏。** 首屏用打包内容立刻渲染，KV 到了无缝替换。
- Worker 挂了 / KV 空了 / 断网 → 站点照常显示上次构建的内容。
- 未纳入管理的段落（Writing、Contact、Tools 文案）零改动。

代价：改完内容后打包的 fallback 会逐渐过时。admin 提供「导出 zh.json」按钮，偶尔手动同步回 git。不同步也能正常跑。

## 内容文档结构

KV `content` 单个 JSON 文档，一次读写，无 schema 迁移：

```jsonc
{
  "version": 1,
  "updatedAt": "2026-07-31T10:50:00.000Z",
  "zh": {
    "hero":   { "greeting": "…", "name": "…", "bio": "…" },
    "about":  { "subtitle": "…", "title": "…", "description": "…", "followers": "…", "publicRepos": "…", "contributions": "…" },
    "experience": {
      "subtitle": "…", "title": "…",
      "items": [{
        "id": "kwai",                                       // 稳定 ID，排序/删除不影响其他条目
        "title": "前端工程师", "company": "快手科技",
        "date": "2025年5月 - 至今", "points": ["…"],
        "icon": "https://cdn.longsizhuo.com/logos/kwai.png", // 跟着条目走，不再按下标
        "iconBg": "#FFF"
      }]
    },
    "education": { "subtitle": "…", "title": "…", "items": [{ "id", "degree", "university", "duration", "coursework": [], "icon", "iconBg" }] },
    "honors":    { "subtitle": "…", "title": "…", "items": [{ "id", "title", "issuer", "date", "description", "icon" }] },
    "projects":  {
      "subtitle": "…", "title": "…", "description": "…", "openSource": "…", "githubPinned": "…",
      "staticItems": [{ "id", "name", "description", "image", "tags": [{ "name", "color" }], "source_code_link", "live_url" }]
    },
    "footer": { "copyright": "…" }
  },
  "en": { /* 同构 */ },
  "album": [                                                 // 语言无关，放在 zh/en 之外
    { "id": "2025-kwai", "folder": "2025-Kwai",
      "photos": [{ "key": "album/2025-Kwai/abc.webp", "w": 1600, "h": 1200 }] }
  ]
}
```

`album` 里存 R2 key 而非完整 URL，CDN 域名换掉时不用重写整个文档。前端拼 `https://cdn.longsizhuo.com/${key}`。存 `w`/`h` 让瀑布流能在图片加载前占位，消除现在的布局抖动。

## 中英同步

Worker 在 `PUT /api/content` 时：

1. 对比传入的 zh 与 KV 里的旧 zh，找出新增/变更的**文本字段**。
2. 只翻译文本白名单：`title` `company` `date` `points` `degree` `university` `duration` `coursework` `issuer` `description` `name` `subtitle` `greeting` `bio` `copyright`。
3. `id` `icon` `iconBg` `image` `source_code_link` `live_url` `tags[].color` 原样复制到 en。
4. 复用 `scripts/translate.mjs` 的 DeepSeek prompt 和 flatten/setNested 逻辑。DeepSeek key 存 Worker secret。

**翻译失败不阻塞保存**：先写 KV，en 缺失字段由 i18next `fallbackLng` 回退，admin 返回 `{ ok: true, translateError: "…" }` 并提示手动补。admin 每个字段旁提供英文输入框可覆盖机翻结果。

## 鉴权

Cloudflare Access（Zero Trust 免费版）保护 `longsizhuo.com/admin*` 和写接口。策略：仅 `longsizhuo@gmail.com`，邮箱 OTP / Google 登录。

Worker 侧验证 `Cf-Access-Jwt-Assertion` header：拉 `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs` 的 JWK 验签，校验 `aud` 和 `exp`。**必须验**——只靠 Access 挡 `/admin` 页面而不验 API JWT，等于 API 裸奔。

`GET /api/content` 公开不鉴权。

## Admin 前端

`admin/` 独立 Vite 应用，antd（主站已装），产物经 Worker assets binding 挂在 `/admin`。

页签：

- **相册** —— 建分组、拖拽批量上传、缩略图网格、拖拽排序、删除、设封面。上传时浏览器端 `createImageBitmap` 读出宽高一并存入文档。
- **经历 / 教育 / 荣誉 / 项目** —— 结构化表单列表，拖拽排序，每条带 logo 上传。
- **散文本** —— Hero bio、About 描述、页脚版权。

不做：富文本编辑器、草稿、版本管理、多用户、图片裁剪。

## 图片迁移

一次性脚本 `scripts/migrate-to-r2.mjs`（S3 兼容 API，用 R2 token；本机无 wrangler，走 `@aws-sdk/client-s3` 或直接 fetch 签名请求）。

| 来源 | 大小 | 去向 |
|---|---|---|
| `public/USYDCodingFest/` | 118MB | R2 `_archive/USYDCodingFest/`，然后从 git 删除 |
| `src/assets/album/2025-Kwai`, `2025-UNSW` | 12MB | R2 `album/<folder>/` |
| `public/desktop_pc/`, `public/planet/` | 19MB | R2 `models/`，`useGLTF` 改 CDN URL |
| 在用的 logo：`awards/` `company/` `education/` `kwai-*/` `SpotFinder/` `IMG_2862.webp` `1234.webp` | ~1MB | R2 `logos/`，写进内容文档 |

USYDCodingFest 归档在 R2 而非直接丢弃，admin 里随时能把 `_archive/` 转成正式相册。

**不动**的：`public/avatar.png`（favicon / og:image / manifest 引用，必须同源稳定 URL）、以及只被死组件引用的 `tech/*` `carrent.png` `jobit.png` `tripguide.webp` 等约 2MB。

迁移后 git 仓库 ~140MB → ~5MB。

## 已确认的死代码

调查中发现，写进 spec 以免后续误判：

- `src/utils/getImages.tsx` —— glob 写 `../public/USYDCodingFest/*`，从 `src/utils/` 解析成 `src/public/`，从未匹配到文件；且该模块无任何 import。这 118MB 线上一张没显示过。
- `Works.tsx` 只渲染 GitHub pinned repos。`projects.staticItems` 和 `constants/index.ts` 的 `projects` 数组均未渲染 —— Spot Finder、Hello-algo、降维聚类工具三张卡片线上不存在。
- `constants/index.ts` 的 `services` `technologies` `testimonials` 只被无人 import 的 `Tech.tsx` / `Feedbacks.tsx` 使用。实际存活的只有 `navLinks`（Navbar）和 `experiences`（Experience.tsx 取 icon）。
- `tailwind.config.ts:32-33` 定义 `hero-pattern-dark` / `hero-pattern-light`，但 `App.tsx` 用的是 `bg-hero-pattern` —— 类名不存在，`herobg.png`（930KB）从未生效；`herobg-light.png` 文件本身不存在。
- 无 import 的组件共 9 个：`Achievements` `Anime` `Contact` `Feedbacks` `GitHubCard` `PhotoGalleryDialog` `Profile` `Tech` `getImages`。

**本次决定：死组件全部保留不动**，其专属资源留在 git，不迁移。只有 `Works.tsx` 的静态项目卡片要恢复渲染（见下）。

## 组件改动

| 文件 | 改动 |
|---|---|
| `src/i18n/index.ts` | +6 行 fetch + `addResourceBundle` |
| `Album.tsx` | 删 `import.meta.glob`，改读内容文档的 `album`；用 `w`/`h` 占位消除布局抖动 |
| `Honors.tsx` | 删 `honorIcons` 数组和 4 个 import，改读条目自带 `icon` |
| `Education.tsx` | 删 `universityIcons` map 和 2 个 import，同上 |
| `Experience.tsx` | 删 `import { experiences }`，改读条目自带 `icon` / `iconBg` |
| `Works.tsx` | GitHub pinned 卡片下方**恢复渲染**静态项目卡片，数据来自内容文档 `projects.staticItems` |
| `canvas/Computers.tsx`, `canvas/Earth.tsx` | `useGLTF` 路径改 CDN URL |
| `constants/index.ts` | 移除 `experiences` / `projects`（进内容文档）。**`services` / `technologies` / `testimonials` 必须保留** —— 它们被保留下来的死组件 `Tech.tsx` / `Feedbacks.tsx` import，删了会挂 typecheck 和 build |
| `assets/index.ts` | 只移除迁到 R2 且无人再引用的导出，保留死组件仍需的部分 |

## 中文名 SEO

目标：搜「龙思卓」能搜到 longsizhuo.com。

### 现状诊断

已有：canonical、OG、Twitter card、sitemap、robots、JSON-LD Person。基础不差。

问题在于**中文名只出现在两个没权重的地方**：

- `<meta name="keywords">` —— Google 2009 年起完全忽略，百度权重极低。
- JSON-LD `alternateName` 数组 —— 辅助信号，不是主信号。

真正有权重的 `<title>`、`<meta name="description">`、页面 `<h1>`、noscript 正文，一个中文字都没有。

更根本的两层：

1. **默认语言是 en**（`src/i18n/index.ts` 的 `lng: savedLang || "en"`）。Googlebot 渲染 JS 后看到的是英文页面，中文内容根本没进索引。
2. **中文版没有独立 URL。** 语言存在 localStorage 里，`longsizhuo.com/` 对爬虫只有一个英文版本。没有可索引的中文 URL，就没有可排名的中文页面。
3. **百度基本不执行 JS。** 对百度来说，这个站的全部可抓取内容就是 `index.html` 的静态部分。

### 改动

**1. 静态 meta 加中文名**（`index.html`，改动最小、收益最大）

```html
<title>龙思卓 (Sizhuo Long) | 快手前端工程师 · 个人主页</title>
<meta name="description" content="龙思卓（Sizhuo Long），快手科技前端工程师，坐标北京。新南威尔士大学 UNSW 信息技术硕士（优等）。蓝桥杯国际赛 Python 算法第一名。专注交互设计、动画基础设施与渲染性能优化。">
```

OG / Twitter 的 title 和 description 同步改成中文优先。

**2. JSON-LD 主名改中文**

`name` 从 `"Sizhuo Long"` 改成 `"龙思卓"`，`alternateName` 收纳 `["Sizhuo Long", "Siz Long", "Long Sizhuo", "Loong Loong"]`。目标是中文名排名，主名就该是中文名。`worksFor` 补 `"快手科技"`、`alumniOf` 补中文校名，都放进 `alternateName`。

**3. noscript 块改成真正的中文简介**

现在写的是「Please enable JavaScript」——对爬虫等于空页面。改成带 `<h1>龙思卓</h1>` 的完整中文简介：姓名、职位、公司、学历、获奖、邮箱、GitHub。**这是百度唯一能读到的正文。**

**4. 可索引的中文 URL：`/zh` 与 `/en` 路由**

- `src/i18n/index.ts` 语言优先级改为：URL 路径 > localStorage > 浏览器语言 > `zh`。
- `App.tsx` 加 `/zh` `/en` 路由，均渲染 `HomePage`，进入时 `i18n.changeLanguage`。
- 语言切换时 `history.replaceState` 同步 URL。
- `index.html` 加 hreflang 互指：

```html
<link rel="alternate" hreflang="zh-CN" href="https://longsizhuo.com/zh">
<link rel="alternate" hreflang="en"    href="https://longsizhuo.com/en">
<link rel="alternate" hreflang="x-default" href="https://longsizhuo.com/">
```

- `sitemap.xml` 补 `/zh` `/en`，各带 `xhtml:link` 交叉引用。

**注意**：nginx 需要对 `/zh` `/en` 做 SPA fallback 回 `index.html`。若现有配置只对已知路径 fallback，得补一条 `try_files $uri $uri/ /index.html`。

**5. 默认语言从 en 改 zh**

无 URL 无 localStorage 时默认中文。中文名 SEO 是目标，首屏就该是中文；英文受众走 `/en` 或手动切换。

### 需要你手动做的（我做不了）

- **百度站长平台**（ziyuan.baidu.com）提交站点和 sitemap。不提交百度基本不会主动收录个人站。
- **检查 Cloudflare Bot Fight Mode 是否挡了 Baiduspider。** 开着的话百度蜘蛛会被拦，前面所有工作白费。在 Security → Bots 里确认，或给 Baiduspider 加放行规则。
- 域名无 ICP 备案会显著影响百度收录质量，这是政策问题，无技术解法。

### 已知天花板

- **本质仍是客户端渲染。** Google 能渲染 JS 所以问题不大，百度只能吃到 `index.html` 的静态内容 —— 也就是上面第 1、3 条覆盖的范围。要让百度看到完整正文，得上预渲染（`vite-plugin-prerender` / react-snap，把 `/`、`/zh`、`/en`、`/tools` 预渲染成静态 HTML）。**本次不做**，等验证过收录效果不够再说。
- **第二期 KV 覆盖层的内容进不了静态 HTML。** admin 改完的文本对百度不可见，静态 meta 仍是构建时那份。可接受：meta 是介绍性文案，本来就很少变。

## 分两期做

两期各自可独立上线和验证，第一期不碰任何 Cloudflare 基建。

**第一期：图片迁 R2 + 修下标坑 + 中文名 SEO。** 站点仍是纯静态，内容仍从打包的 `zh.json` 读。做完就能验证：git 从 140MB 掉到 5MB、logo 不再按下标错位、相册照片从 CDN 加载、3D 模型正常、`/zh` 可访问且静态 HTML 里有中文名。这一期把内容文档结构落成 `src/i18n/zh.json` 里的新形状（每条自带 `icon`），Worker 上线后直接搬进 KV 即可，不用二次改结构。

SEO 放第一期是因为它跟第二期无耦合，且见效需要时间——越早上线越早被收录。

**第二期：Worker + KV + admin。** 加 6 行 fetch 覆盖层、部署 Worker、配 Access、做 admin SPA。第一期的 `zh.json` 天然成为兜底基线。

## 错误处理

| 场景 | 行为 |
|---|---|
| `/api/content` 失败或超时 | 静默 catch，用打包的 zh/en。站点功能不降级 |
| KV 里文档结构损坏 | Worker 读出后 `JSON.parse` 失败则返回 404，前端走 fallback |
| 图片 URL 404 | `<img onError>` 隐藏该元素，不显示裂图 |
| DeepSeek 翻译失败 | 不阻塞保存，返回 `translateError`，en 回退中文 |
| 保存并发冲突 | 单用户系统，不做乐观锁。写前把旧值存 `content:backup` |
| Access JWT 无效/过期 | 401，admin 前端跳转重新登录 |

## 测试

按 ponytail 原则，只给非平凡逻辑留可运行检查，不铺框架：

1. `worker/test/translate.test.mjs` —— 白名单字段翻译 + 非文本字段原样复制的断言。这是唯一有真实分支逻辑的地方。
2. `worker/test/auth.test.mjs` —— 伪造 / 过期 / 无 JWT 必须 401。安全边界，不能省。
3. 内容文档 round-trip：`zh.json` → 文档结构 → `addResourceBundle` 后 `t()` 取值与原值一致。防迁移丢内容。

迁移脚本本身跑一次就废，不写测试；靠迁移后比对文件数和总字节数校验。

## 已知天花板

标注在代码的 `ponytail:` 注释里：

- **KV 全球传播最多 60 秒。** 保存后自己看到是即时的，其他访客可能延迟一分钟。个人主页够用；要强一致就换 D1（他已在 `sylvia-photo-api` 用过 D1，迁移路径现成）。
- **版本历史只有一层。** `content:backup` 只存上一版，误删能回滚一次。要多版本就改成 `content:<timestamp>` 加列举。
- **无图片压缩/裁剪。** 上传什么存什么。要优化就在 Worker 前挂 Cloudflare Images 或 R2 + Image Resizing。
- **单用户。** 无并发控制，两个设备同时编辑后写的覆盖先写的。

## 非目标

- 不做站点重构、不改视觉设计。
- 不做 SSR / 预渲染（SEO 章节已列为天花板）。
- 不做 Writing / Contact / Tools 段落的管理（继续走 i18n JSON + 现有 CI 翻译）。
- 不清理死组件（本次明确保留）。
- 不改 `deploy.sh` 部署流程。
