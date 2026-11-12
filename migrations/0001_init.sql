-- Portfolio content (projects, photos, uploaded media)
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  gallery_key TEXT NOT NULL,
  category TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  title_fr TEXT NOT NULL DEFAULT '', title_en TEXT NOT NULL DEFAULT '', title_de TEXT NOT NULL DEFAULT '',
  desc_fr TEXT NOT NULL DEFAULT '', desc_en TEXT NOT NULL DEFAULT '', desc_de TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  src TEXT NOT NULL,
  grp TEXT,
  caption_fr TEXT NOT NULL DEFAULT '', caption_en TEXT NOT NULL DEFAULT '', caption_de TEXT NOT NULL DEFAULT '',
  media_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX photos_by_project ON photos(project_id, position);
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
