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

module.exports = {
  cleanText, cleanImage, cleanInt, cleanDate, inspectOptionalImage,
  MAX_TEXT_LEN, MAX_LONGTEXT_LEN, MAX_IMAGE_LEN,
};