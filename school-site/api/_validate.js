// api/_validate.js
// فحص وتنضيف المدخلات على السيرفر قبل ما توصل قاعدة البيانات.
// الفرونت بيتحقق برضه، بس أي حد يقدر يكلم الـ API مباشرة من غير الفرونت
// أصلًا — فالتحقق الحقيقي لازم يعيش هنا. ده كمان اللي بيمنع تخزين "صور"
// مش صور، أو payloads ضخمة تعدّي حد Vercel للـ request body (4.5MB).

// حد أقصى ~2.5 مليون حرف base64 ≈ 1.9MB فعلي — تحت حد Vercel بهامش أمان.
const MAX_IMAGE_LEN = 2_500_000;
const MAX_TEXT_LEN = 1000;      // اسم، مادة، تخصص...
const MAX_LONGTEXT_LEN = 5000;  // نبذة، مقولة...

// الصور المقبولة: data: URL لصورة بصيغة معروفة، محتوى base64 بس.
// أي حاجة تانية (رابط خارجي، data:text/html، نص فيه markup...) مرفوضة.
const IMG_RE = /^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i;

// نص مهيأ ومقصوص للحد المسموح، أو null لو القيمة مش نص أصلًا.
function cleanText(v, max = MAX_TEXT_LEN) {
  if (typeof v !== 'string') return null;
  return v.slice(0, max);
}

// بيرجع الصورة لو سليمة، أو null لو غير سليمة/أكبر من الحد.
// الـ endpoints بترفض الطلب كله بـ 400 لو الصورة مرفوضة — أفضل من إننا
// نخزن قيمة بايظة أو نرمي صورة الأدمن بصمت من غير ما يعرف.
function cleanImage(v) {
  if (typeof v !== 'string') return null;
  if (v.length > MAX_IMAGE_LEN) return null;
  return IMG_RE.test(v) ? v : null;
}

// رقم صحيح آمن أو قيمة احتياطية (بيحمي من NaN وأي مدخل مش رقم).
function cleanInt(v, fallback = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

// تاريخ بصيغة YYYY-MM-DD بس (عمود DATE) أو null — بيمنع القيم البايظة
// اللي Postgres كان هيرفضها بخطأ 500 غامض.
function cleanDate(v) {
  if (typeof v !== 'string') return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : null;
}

// نتيجة فحص حقل صورة اختياري: 'absent' (مش مبعوت — سيب القديم)،
// 'ok' (صورة سليمة)، أو 'invalid' (مبعوتة بس بايظة — ارفض الطلب).
function inspectOptionalImage(v) {
  if (v === undefined || v === null || v === '') return { state: 'absent', value: null };
  const cleaned = cleanImage(v);
  return cleaned ? { state: 'ok', value: cleaned } : { state: 'invalid', value: null };
}

/* ============================================================
   الشكاوى — نموذج عام أي زائر يقدر يبعته، فده أهم فحص في المشروع.
============================================================ */

// أنواع الشكاوى المعروضة في النموذج — أي قيمة تانية مرفوضة حتى لو حد
// ظبط الفرونت على إيده، عشان ميدخلش في قاعدة البيانات غير قيم مفهومة.
const COMPLAINT_TYPES = [
  'مشكلة تقنية في الموقع',
  'اقتراح لتطوير الموقع',
  'طلب إزالة صورة',
  'مشاركة صورة أو ذكرى',
  'أخرى',
];

const MAX_COMPLAINT_IMAGES = 5;
// صورة الشكوى الواحدة ~675KB كحد أقصى، ومجموع الصور ~3MB. أصرم من الحد
// العام للصور لأن 5 صور × 2.5M حرف كانوا هيعدّوا حد Vercel للـ body (4.5MB).
const MAX_COMPLAINT_IMAGE_LEN = 900_000;
const MAX_COMPLAINT_IMAGES_TOTAL = 4_000_000;

// صيغة الموبايل المصري: 11 رقم يبدأ بـ 010/011/012/015.
const PHONE_RE = /^01[0125][0-9]{8}$/;

// بيشيل المسافات والشرط وأي رموز (الناس بتكتب الرقم بأشكال كتير) وبعدين
// بيفحص الصيغة. بيرجع الرقم نضيف أو null.
function cleanPhone(v) {
  if (typeof v !== 'string') return null;
  const digits = v.replace(/\D/g, '');
  return PHONE_RE.test(digits) ? digits : null;
}

// فحص شكوى كاملة قبل التخزين. بيرجع { ok, error } عند الرفض برسالة عربية
// واضحة للزائر، أو { ok:true, data:{...} } بنسخة منضّفة جاهزة للإدخال.
function validateComplaint(body) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'طلب غير صالح' };
  // فخ بوتات (honeypot): حقل مخفي في النموذج البشر مبيشوفوهش فبيسيبوه فاضي،
  // البوتات بتملاه — أي قيمة فيه تعني إن ده مش بني آدم.
  if (body.website) return { ok: false, error: 'طلب غير صالح' };

  const type = cleanText(body.type, 60);
  if (!type || !COMPLAINT_TYPES.includes(type.trim())) return { ok: false, error: 'اختار نوع الشكوى' };

  const name = cleanText(body.name, 100);
  if (!name || name.trim().length < 5) return { ok: false, error: 'اكتب اسمك بالكامل' };

  const phone = cleanPhone(body.phone);
  if (!phone) return { ok: false, error: 'اكتب رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)' };

  const details = cleanText(body.details, 2000);
  if (!details || details.trim().length < 10) return { ok: false, error: 'اكتب تفاصيل أكتر عن الشكوى (10 حروف على الأقل)' };

  // الصور اختيارية. لو اتبعتت: array لحد 5، كل واحدة data:image سليمة ومتحجمة.
  let images = body.images;
  if (images === undefined || images === null) images = [];
  if (!Array.isArray(images)) return { ok: false, error: 'الصور غير صالحة' };
  if (images.length > MAX_COMPLAINT_IMAGES) return { ok: false, error: `مسموح ${MAX_COMPLAINT_IMAGES} صور كحد أقصى` };
  let total = 0;
  const cleaned = [];
  for (const im of images) {
    if (typeof im === 'string' && im.length > MAX_COMPLAINT_IMAGE_LEN) {
      return { ok: false, error: 'فيه صورة أكبر من الحد المسموح' };
    }
    const ok = cleanImage(im);
    if (!ok) return { ok: false, error: 'فيه صورة غير صالحة — المسموح صور فقط' };
    total += ok.length;
    cleaned.push(ok);
  }
  if (total > MAX_COMPLAINT_IMAGES_TOTAL) return { ok: false, error: 'حجم الصور كله أكبر من المسموح — جرب صور أقل' };

  return { ok: true, data: { type: type.trim(), name: name.trim(), phone, details: details.trim(), images: cleaned } };
}

module.exports = {
  cleanText, cleanImage, cleanInt, cleanDate, inspectOptionalImage,
  cleanPhone, validateComplaint,
  COMPLAINT_TYPES, MAX_COMPLAINT_IMAGES, MAX_COMPLAINT_IMAGE_LEN,
  MAX_TEXT_LEN, MAX_LONGTEXT_LEN, MAX_IMAGE_LEN,
};