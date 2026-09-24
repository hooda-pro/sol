// api/_auth.js
// تحقق بسيط من كلمة سر الأدمن. بيتبعت من الفرونت في الهيدر x-admin-password
// وبيتقارن بمتغير بيئة ADMIN_PASSWORD على السيرفر (مش مخزن في الكود ولا في المتصفح).
const crypto = require('crypto');

// مقارنة بوقت ثابت (timing-safe): المقارنة العادية بـ === بتوقف عند أول حرف
// مختلف، ففرق زمن الرد النانوسكندي كان ممكن يسرّب للمهاجم "لحد أي حرف خمنته
// صح". timingSafeEqual بيقارن للآخر دايمًا فالزمن مبيفصحش عن حاجة.
function safeEqual(a, b) {
  const ba = Buffer.from(String(a ?? ''));
  const bb = Buffer.from(String(b ?? ''));
  if (ba.length !== bb.length) {
    // الطول مختلف — نعمل مقارنة وهمية بنفس التكلفة عشان الزمن ميفضحش الطول
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

function isAuthorized(req) {
  const provided = req.headers['x-admin-password'];
  const real = process.env.ADMIN_PASSWORD;
  if (!real) {
    // لو الأدمن مانساش يحط كلمة السر في متغيرات البيئة، امنع أي حاجة احتياطًا.
    return false;
  }
  return provided ? safeEqual(provided, real) : false;
}

function requireAuth(req, res) {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'غير مصرح. كلمة السر غلط أو ناقصة.' });
    return false;
  }
  return true;
}

module.exports = { isAuthorized, requireAuth, safeEqual };
