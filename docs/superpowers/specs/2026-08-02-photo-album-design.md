# 相册重构：从首页一个滚动框到可浏览的照片集

日期：2026-08-02
仓库：`longsizhuo/me`

## 问题

现在的相册是首页中间一个 520px 高的内部滚动框，数据来自打包进 bundle 的 `src/content/album.json`（2 个分组 / 7 张），图片是 R2 上的**原图**——4032×3024、每张 1.3–1.5 MB，显示在 250px 宽的瀑布流列里，像素数超出实际需要约 16 倍。

目标规模是**几百到上千张**。按现有做法：

- `album.json` 会膨胀到几 MB，且必须在首屏下完才能渲染任何一张
- 1000 张原图 × 1.4 MB = 无法直接服务
- 所有照片挤在一个滚动框里，无法按相册组织、无法单独分享、无法被索引

## 目标与非目标

**目标**：对外展示为主。访客浏览我挑选过的照片，按相册组织，每个相册有独立可分享、可索引的 URL。

**非目标**（明确排除，避免范围膨胀）：

- 不是网盘/备份。不提供原图下载按钮——这是作品展示，不是文件分享服务。
- 不做 EXIF 展示面板。把相机型号和焦段摆给访客看是摄影论坛的做法，与本站定位不符。
- 不做私有相册、分享 token、访客账号。全部公开。
- 不做上传端的图片编辑（裁剪、滤镜、水印）。

## 架构

```
首页          最新 8–12 张横向预览条  →  点进 /album
/album        相册列表页（封面网格）
/album/:slug  单个相册（瀑布流 + 灯箱，滚动分页）

数据   D1                      albums / photos 两张表
存储   R2 me-assets            album/<slug>/<uuid>.<ext>，只存原图，永不修改
缩放   Cloudflare Images 变换   /cdn-cgi/image/<opts>/<原图URL>
读     Worker GET /api/albums*  公开，边缘缓存
写     Worker POST/DELETE       Cloudflare Access 保护，并入第二期 admin
```

## 四个核心决定

### 1. 不预生成缩略图，用 URL 变换

上传只存原图。展示时按需变换：

| 场景 | 参数 |
|---|---|
| 首页预览条 / 相册封面 | `width=400,format=auto,fit=cover` |
| 相册瀑布流 | `width=600,format=auto` |
| 灯箱 | `width=1600,format=auto` |

`format=auto` 让 Cloudflare 按浏览器能力发 AVIF / WebP / 原格式。

**成本核算**：Cloudflare Images 免费版对存在 R2 的图提供变换，每月 5000 次**独立**变换免费。1000 张 × 3 档 = 3000 次/月，在额度内。超出后不收费，只是新变换返回 `9422`，已缓存的继续正常服务——可以用 `onerror=redirect` 回退到原图。

**为什么不预生成三份存 R2**：原图只存一份（1000 张约 4GB，R2 存储 $0.06/月）；以后要加尺寸或改画质不用重新上传；响应式 `srcset` 变成拼字符串。

**前置条件（用户手动，一次性）**：Cloudflare Dashboard → longsizhuo.com → Images → Transformations → Enable。**未开启前所有变换 URL 返回 404**，这是实施第一步就要验证的事，不能假设。

### 2. D1 而不是 JSON 清单

`src/content/album.json` 在上千张时会变成几 MB 的首屏阻塞资源。D1 支持分页、按相册筛选、按时间排序，而且 `sylvia-photo-api`（同账户下另一个站）已经在用几乎一样的表结构，可以直接照搬。

```sql
CREATE TABLE albums (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT UNIQUE NOT NULL,      -- URL 用，如 2025-kwai
  name_zh     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  description_zh TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  cover_key   TEXT,                       -- R2 key，不是完整 URL
  sort_order  INTEGER DEFAULT 0,
  photo_count INTEGER DEFAULT 0,          -- 冗余计数，列表页避免 N+1
  created_at  TEXT NOT NULL
);

CREATE TABLE photos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id    INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  key         TEXT UNIQUE NOT NULL,       -- album/<slug>/<uuid>.jpg
  w           INTEGER NOT NULL,           -- 原图宽高，供瀑布流占位
  h           INTEGER NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL
);

CREATE INDEX idx_photos_album ON photos(album_id, sort_order, id);
```

`w`/`h` 是必需的，不是可选优化：瀑布流要在图片加载前用 `aspect-ratio` 占位，否则布局抖动。现有 `Album.tsx` 已经这么做了，保留该行为。

**中英文**：`name_zh`/`name_en` 双列而不是走 i18n JSON——相册是用户数据不是界面文案，不该进翻译流程。API 按 `Accept-Language` 或查询参数返回对应语言。

### 3. 首页与照片总数解耦

现在首页加载全部照片。改成 `GET /api/photos/latest?limit=12`，只拉最新 12 张做横向预览条，点击进 `/album`。首页重量从此与照片总数无关。

### 4. 原图不出现在页面里

页面中所有 `<img src>` 一律是变换 URL。原图 key 只存在于 D1 和 API 响应中。没有下载按钮，没有指向原图的链接。爬站的人扒不到 4000px 原片。

## API

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/albums` | 公开 | 相册列表含封面和照片数 |
| GET | `/api/albums/:slug` | 公开 | 单相册元信息 + 首页照片 |
| GET | `/api/albums/:slug/photos?cursor=&limit=` | 公开 | 游标分页 |
| GET | `/api/photos/latest?limit=` | 公开 | 首页预览条 |
| POST | `/api/albums` | Access | 建相册 |
| POST | `/api/albums/:slug/photos` | Access | 上传（multipart，支持多文件） |
| PATCH | `/api/photos/:id` | Access | 改 sort_order / 移动相册 |
| DELETE | `/api/photos/:id` | Access | 删除，同时删 R2 对象 |

读接口全部 `Cache-Control: public, max-age=60` + 边缘缓存；写操作后 purge 对应路径。

**分页用游标不用 offset**：`WHERE (sort_order, id) > (?, ?)`，避免深翻页时的性能塌陷，也避免上传新照片导致翻页错位。

## 前端

**新增页面**
- `/album` — 相册封面网格，每格显示名称和张数
- `/album/:slug` — 瀑布流 + 灯箱，滚动到底加载下一页

**灯箱**：沿用现有 antd `Image.PreviewGroup`，点击放大 + 左右切换。**不加**键盘快捷键面板、手势缩放、EXIF 信息、下载按钮——最简即可。

**首页 `Album.tsx`**：改为横向预览条，只渲染 `/api/photos/latest` 返回的 12 张，末尾一个「查看全部 →」卡片链到 `/album`。移除现有的 520px 内部滚动框。

**加载失败**：沿用已有的 `ErrorBoundary` 和 `onError` 隐藏约定。相册页整体包一层 `ErrorBoundary`，API 挂了显示「相册暂时无法加载」而不是白屏。

## 迁移

现有 7 张（`src/content/album.json`）和归档的 17 张编程节照片（`_archive/USYDCodingFest/`）都已在 R2 上，**不需要重新上传**，只需写入 D1：

- `album/2025-Kwai/*` → 相册 `2025-kwai`
- `album/2025-UNSW/*` → 相册 `2025-unsw`
- `_archive/USYDCodingFest/*` → 相册 `2024-usyd-coding-fest`，并把 R2 key 从 `_archive/` 前缀移到 `album/2024-usyd-coding-fest/`

宽高：前两组已在 `album.json` 里有；归档那 17 张需要用系统已装的 ImageMagick `identify` 补齐。

迁移完成并验证后，删除 `src/content/album.json` 和 `src/content/index.ts` 里的 `album` 导出（`cdnUrl` 保留，模型仍在用）。

## 错误处理

| 场景 | 行为 |
|---|---|
| Images 变换未启用或超额（9422） | `<img>` 的 `onerror` 回退到原图 URL；同时这是实施第一步就要验证的前置条件 |
| API 不可达 | 相册页 ErrorBoundary 显示降级文案；首页预览条渲染 null（装饰性区块，静默降级） |
| 某张图 404 | `onError` 隐藏该格，不显示裂图 |
| 上传时同名 | key 用 uuid，天然不冲突 |
| 删除相册 | `ON DELETE CASCADE` 清 D1；R2 对象需在 Worker 里显式批量删除，D1 的级联管不到 R2 |

## 测试

按已建立的原则，只给有真实分支的逻辑留可运行检查：

1. **游标分页** —— 插入 25 条，分三页取完，断言无重复无遗漏、边界正确。这是唯一有真实算法的地方。
2. **变换 URL 拼接** —— 断言 `imageUrl(key, {width:400})` 产出的 URL 格式正确且 key 中的空格被正确转义（现有照片文件名含空格和括号，`album/2025-Kwai/image (2).jpg`）。
3. **写接口鉴权** —— 无 / 伪造 / 过期 Access JWT 必须 401。安全边界，不能省。
4. **迁移正确性** —— 迁移脚本跑完后断言 D1 里的照片数 == R2 里对应前缀的对象数。

不为 CRUD 的每个端点写测试。

## 已知天花板

- **变换免费额度 5000/月。** 超出后新尺寸组合返回 9422，已缓存的继续服务。到 1500 张以上或频繁改尺寸时需要升级付费版（$0.50/1000 次）。
- **无全文搜索。** D1 有 FTS5 但本次不启用；照片没有标题和标签，搜什么还不清楚。真需要时再加。
- **无相册嵌套。** 平铺结构，一层相册。
- **灯箱是 antd 的实现**，样式定制空间有限。要更强的交互体验得换掉或自己写。

## 与第二期 admin 的关系

写接口和上传后台**并入第二期的 admin 系统**——那份 spec（`2026-07-31-admin-cms-design.md`）里已经规划了相册管理（建分组、拖拽批量上传、排序、设封面）。本 spec 取代其中的相册部分：数据从 KV 文档改为 D1，因为规模从「7 张」变成了「上千张」。

其余内容（经历/教育/荣誉/项目/散文本）仍按原 spec 存 KV——那些是几十条的结构化文案，用不上数据库。
