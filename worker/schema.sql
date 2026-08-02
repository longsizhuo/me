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
