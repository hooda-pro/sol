-- schema.sql
-- شغّل الكود ده مرة واحدة في Neon (SQL editor بتاع neon.tech) قبل أول ديبلوي.

CREATE TABLE IF NOT EXISTS teachers (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  subject     TEXT,
  spec        TEXT,
  grade       TEXT DEFAULT 'الثانوية',
  icon        TEXT,
  cat         TEXT,
  "where"     TEXT DEFAULT 'مدرسة شهيد حسن حمدي الثانوية',
  lang        TEXT DEFAULT 'ar',
  gender      TEXT DEFAULT 'ذ',
  bio         TEXT,
  photo_data  TEXT,            -- صورة base64 (اختياري)
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id          SERIAL PRIMARY KEY,
  rank        INT DEFAULT 0,
  name        TEXT NOT NULL,
  icon        TEXT,
  grade       TEXT,
  score       TEXT,
  "from"      TEXT,
  dob         DATE,
  quote       TEXT,
  photo_data  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (
  id          SERIAL PRIMARY KEY,
  title       TEXT,
  image_data  TEXT NOT NULL,   -- صورة base64
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- بيانات ابتدائية اختيارية: تقدر تنسخ المدرسين والطلاب الموجودين في الكود
-- القديم (index.html) وتحطهم هنا كـ INSERT، أو تضيفهم يدويًا من لوحة الأدمن
-- بعد ما الموقع يشتغل (أسهل بكتير).

-- ============================================================
-- الشكاوى والاقتراحات (بتتبعت من نموذج "تواصل معانا" في الموقع
-- وبتظهر في تبويب "الشكاوى" في لوحة الأدمن).
-- لو الجداول اللي فوق موجودة عندك خلاص، شغّل الجزء ده لوحده في Neon.
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL,          -- نوع الشكوى (من قائمة ثابتة في _validate.js)
  name        TEXT NOT NULL,          -- اسم مقدم الشكوى بالكامل
  phone       TEXT NOT NULL,          -- موبايل مصري عليه واتساب (01xxxxxxxxx)
  details     TEXT NOT NULL,          -- تفاصيل الشكوى
  images      JSONB DEFAULT '[]'::jsonb,  -- لحد 5 صور base64 (اختياري)
  status      TEXT DEFAULT 'جديدة',   -- جديدة / تمت المراجعة
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- إعدادات الموقع العامة (key/value): بيانات المدير وشريط إحصائيات
-- الرئيسية بتتخزن هنا وبتتعدل من لوحة الأدمن (تبويب "المدير" وتبويب
-- "معلومات الموقع") بدون أي تعديل في الكود — والزائر بيشوفها لحظيًا.
-- لو الجداول اللي فوق موجودة عندك خلاص، شغّل الجزء ده لوحده في Neon.
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,           -- principal / stats
  value       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

