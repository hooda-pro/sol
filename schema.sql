-- ==========================================
-- موقع مدرسة شهيد حسن حمدي الثانوية — هيكل قاعدة البيانات (Neon Postgres)
-- شغّله مرة واحدة في Neon SQL Editor *قبل* seed.sql.
-- كله IF NOT EXISTS، فتشغيله تاني مش بيمسح أي بيانات.
-- ==========================================

-- المدرسين
CREATE TABLE IF NOT EXISTS teachers (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  subject     TEXT,
  spec        TEXT,
  grade       TEXT DEFAULT 'الثانوية',
  icon        TEXT,                                   -- الحرف اللي بيظهر لو مفيش صورة
  cat         TEXT,                                   -- تصنيف الفلتر (عربي / انجليزي / ...)
  "where"     TEXT DEFAULT 'مدرسة شهيد حسن حمدي الثانوية',
  lang        TEXT DEFAULT 'ar',
  gender      TEXT DEFAULT 'ذ',                       -- ذ = ذكر، أ = أنثى
  bio         TEXT DEFAULT '',
  photo_data  TEXT,                                   -- صورة base64 (data:image/...)
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- الطلاب الأوائل
CREATE TABLE IF NOT EXISTS students (
  id          SERIAL PRIMARY KEY,
  rank        INTEGER NOT NULL DEFAULT 0,             -- الترتيب
  name        TEXT NOT NULL,
  icon        TEXT,
  grade       TEXT,
  score       TEXT,
  "from"      TEXT,                                   -- من أي بلد/قرية
  dob         DATE,
  quote       TEXT DEFAULT '',
  photo_data  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- الشكاوى (بتتقدم من الموقع وبتظهر في لوحة الأدمن بس)
CREATE TABLE IF NOT EXISTS complaints (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  details     TEXT NOT NULL,
  images      JSONB NOT NULL DEFAULT '[]'::jsonb,     -- لحد 5 صور
  status      TEXT NOT NULL DEFAULT 'جديدة',          -- جديدة / تمت المراجعة
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- معرض الذكريات
CREATE TABLE IF NOT EXISTS photos (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT '',
  image_data  TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- إعدادات الموقع (بيانات المدير + شريط الإحصائيات)
CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ DEFAULT now()
);
