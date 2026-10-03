// api/settings.js
// إعدادات عامة للموقع (key/value) في جدول site_settings:
//   GET  /api/settings                 → { settings:{ principal:.., stats:.. } }  (عام — بدون كلمة سر)
//   GET  /api/settings?key=principal   → { key, value }                           (عام — بدون كلمة سر)
//   PUT  /api/settings?key=principal   { value:{...} }   → تحديث (للأدمن فقط)
// المفاتيح المسموحة (whitelist) عشان محدش يخزن حاجات عشوائية في القاعدة:
//   principal → بيانات المدير (اسم/وظيفة/شارة/نبذة/صورة)
//   stats     → شريط إحصائيات الرئيسية (4 أرقام وتسمياتها)
//   developers → صور المطورين في صفحة "عن الموقع" (mahmoud_photo / rimas_photo)
// سلوك الحفظ: دمج مع القديم — حقل مش مبعوت = سيبه زي ما هو،
// وحقل مبعوت بـ null = امسحه (بتستخدمه لوحة الأدمن لإزالة الصور).
const { sql } = require('./_db.js');
const { isAuthorized } = require('./_auth.js');
const { cleanImage } = require('./_validate.js');

const ALLOWED_KEYS = new Set(['principal', 'stats', 'developers']);

// مفاتيح قيمتها مصفوفة مش كائن. دي بتتخزن كما هي (استبدال كامل) — الدمج
// الجزئي مالوش معنى مع المصفوفات، وكمان بيبوّظ شكلها (بصت لكائن أرقام).
const ARRAY_KEYS = new Set(['stats']);

// حد أقصى لحجم القيمة المخزنة (كنص JSON) — يكفي صورة base64 مضغوطة
// (الفرونت بيضغط لـ WebP صغير) + الحقول النصية، وبيمنع تخزين payload ضخم.
const MAX_VALUE_BYTES = 200 * 1024;
// مفتاح المطورين فيه صورتين مع بعض (محمود + ريماس) فليه حد أكبر.
const MAX_VALUE_BYTES_BY_KEY = { developers: 450 * 1024 };

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

// إصلاح بيانات قديمة اتخزنت غلط: مفتاح زي stats لازم يكون مصفوفة، لكن نسخة
// قديمة من كود الحفظ كانت بتعمل { ...old, ...array } فالمصفوفة كانت بتتحول
// لكائن بمفاتيح رقمية { "0": {...}, "1": {...} }. الفرونت بيتأكد من
// Array.isArray قبل ما يستخدمها، فكانت بتتجاهل تمامًا والزائر يفضل شايف
// الأرقام الافتراضية من الـ HTML. هنا بنرجّعها مصفوفة عند القراءة.
function normalizeValue(key, value) {
  if (!ARRAY_KEYS.has(key)) return value;
  if (Array.isArray(value)) return value;
  if (!isPlainObject(value)) return value;
  const keys = Object.keys(value);
  if (!keys.length || !keys.every(k => /^\d+$/.test(k))) return value;
  return keys
    .sort((a, b) => Number(a) - Number(b))
    .map(k => value[k]);
}

// تنضيف كائن الإعدادات: بنسمح بنصوص بس (حد 5000 حرف للحقل — النبذة مثلًا)،
// حقول الصور (photo_data) بتتفحص بـ cleanImage، وأي مفاتيح غريبة بتترمي.
// بيرجع { value } عند النجاح أو { error } برسالة عربية عند الرفض.
function sanitizeValue(v) {
  if (!isPlainObject(v)) return { error: 'القيمة لازم تكون كائن JSON' };
  const out = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof k !== 'string' || !k || k.length > 40) continue;
    if (val === null) { out[k] = null; continue; } // null = مسح متعمد للحقل
    // photo_data (المدير) أو أي مفتاح ينتهي بـ _photo (مثلًا mahmoud_photo)
    if (k === 'photo_data' || k.endsWith('_photo')) {
      if (typeof val === 'string' && val) {
        const img = cleanImage(val);
        if (!img) return { error: 'الصورة غير صالحة — المسموح صور فقط' };
        out[k] = img;
      }
      continue; // صورة فاضية/غير نصية = تجاهلها وسيب القديم
    }
    if (typeof val === 'string') { out[k] = val.slice(0, 5000); continue; }
    if (typeof val === 'number' && Number.isFinite(val)) { out[k] = val; continue; }
  }
  return { value: out };
}
// القيمة المقبولة: كائن (principal) أو مصفوفة كائنات (stats — خلايا
// {label, target, suffix}، الـ target فيها رقم مش نص). المصفوفة محدودة
// بـ 12 عنصر وكل عنصر بيتنضّف زي كائن الإعدادات بالظبط.
const _sanitizeObject = sanitizeValue;
sanitizeValue = function (v) {
  if (Array.isArray(v)) {
    if (v.length > 12) return { error: 'قيمة الإعدادات أكبر من المسموح' };
    const arr = [];
    for (const item of v) {
      const c = _sanitizeObject(item);
      if (c.error) return c;
      arr.push(c.value);
    }
    return { value: arr };
  }
  return _sanitizeObject(v);
};

// الجدول بيتعمل تلقائيًا أول ما الفانكشن تصحى (cold start) لو مش موجود —
// آمن ومتكرر (IF NOT EXISTS)، فلو الأدمن نسي يشغّل schema.sql في Neon
// الـ endpoint ميكسرش والموقع يفضل شغال.
let ensureTablePromise = null;
function ensureTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        key         TEXT PRIMARY KEY,
        value       JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at  TIMESTAMPTZ DEFAULT now()
      )`.catch(err => {
        ensureTablePromise = null; // لو فشل نحاول تاني في الطلب الجاي
        throw err;
      });
  }
  return ensureTablePromise;
}

module.exports = async function handler(req, res) {
  const key = String((req.query && req.query.key) || '').trim();
  if (key && !ALLOWED_KEYS.has(key)) {
    return res.status(400).json({ error: 'مفتاح إعدادات غير معروف' });
  }

  if (req.method === 'GET') {
    try {
      await ensureTable();
      if (key) {
        const rows = await sql`SELECT value FROM site_settings WHERE key = ${key} LIMIT 1`;
        return res.status(200).json({ key, value: rows[0] ? normalizeValue(key, rows[0].value) : null });
      }
      // بدون key: كل المفاتيح المعروفة مرة واحدة (تحميل بيانات الزائر بيستخدمها)
      const rows = await sql`SELECT key, value FROM site_settings`;
      const settings = {};
      for (const r of rows) {
        if (ALLOWED_KEYS.has(r.key)) settings[r.key] = normalizeValue(r.key, r.value);
      }
      return res.status(200).json({ settings });
    } catch (err) {
      console.error('settings GET error:', err);
      return res.status(500).json({ error: 'خطأ في الخادم' });
    }
  }

  if (req.method === 'PUT') {
    if (!key) return res.status(400).json({ error: 'حدد مفتاح الإعدادات في ?key=' });
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'غير مصرح. كلمة السر غلط أو ناقصة.' });
    }

    const body = req.body || {};
    const cleaned = sanitizeValue(body.value);
    if (cleaned.error) return res.status(400).json({ error: cleaned.error });

    try {
      await ensureTable();
      // نجيب القديم الأول عشان ندمج: حقل مش مبعوت يفضل زي ما هو،
      // وحقل مبعوت بـ null يتمسح من القيمة النهائية.
      let merged;
      if (Array.isArray(cleaned.value)) {
        // مصفوفة (stats): استبدال كامل من غير دمج. الدمج بالـ spread كان
        // بيحوّلها لكائن بمفاتيح رقمية، وساعتها Array.isArray في الفرونت
        // بترجع false فالأرقام المحفوظة كانت بتتجاهل والزائر يفضل شايف
        // القيم الافتراضية المكتوبة في index.html.
        merged = cleaned.value.map(item => {
          const cell = { ...item };
          for (const [k, v] of Object.entries(cell)) {
            if (v === null) delete cell[k];
          }
          return cell;
        });
      } else {
        // كائن (principal): دمج مع القديم — حقل مش مبعوت يفضل زي ما هو،
        // وحقل مبعوت بـ null يتمسح.
        const rows = await sql`SELECT value FROM site_settings WHERE key = ${key} LIMIT 1`;
        const old = isPlainObject(rows[0] && rows[0].value) ? rows[0].value : {};
        merged = { ...old, ...cleaned.value };
        for (const [k, v] of Object.entries(merged)) {
          if (v === null) delete merged[k];
        }
      }
      const mergedJson = JSON.stringify(merged);
      if (mergedJson.length > (MAX_VALUE_BYTES_BY_KEY[key] || MAX_VALUE_BYTES)) {
        return res.status(413).json({ error: 'القيمة أكبر من الحد المسموح' });
      }
      await sql`
        INSERT INTO site_settings (key, value, updated_at)
        VALUES (${key}, ${mergedJson}::jsonb, now())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
      `;
      return res.status(200).json({ ok: true, key, value: merged });
    } catch (err) {
      console.error('settings PUT error:', err);
      return res.status(500).json({ error: 'خطأ في الخادم' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
