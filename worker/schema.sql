-- D1 schema for the photo album (spec: docs/superpowers/specs/2026-08-02-photo-album-design.md)
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

-- 站点文案。src/i18n/{zh,en}.json 仍然是构建期的唯一数据源（scripts/geo.mjs
-- 从它生成给爬虫看的静态 HTML），这张表是它的可编辑副本：/admin 写这里，
-- 本机的 scripts/content-sync.mjs 轮询到 version 变大就写回那两个文件并重新
-- 构建。反过来说，直接改文件不会同步回 D1 —— 要么全走管理页，要么改完文件
-- 用 scripts/content-seed.mjs 重新灌一次，否则下一次管理页保存会覆盖手改。
CREATE TABLE IF NOT EXISTS content (
  lang       TEXT PRIMARY KEY,  -- 'zh' | 'en'
  data       TEXT NOT NULL,     -- 整份 i18n JSON，原样存放
  version    INTEGER NOT NULL,  -- 全局单调递增；同步服务只比较 MAX(version)
  updated_at TEXT NOT NULL
);
