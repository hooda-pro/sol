// api/_auth.js
// تحقق بسيط من كلمة سر الأدمن. بيتبعت من الفرونت في الهيدر x-admin-password
// وبيتقارن بمتغير بيئة ADMIN_PASSWORD على السيرفر (مش مخزن في الكود ولا في المتصفح).
function isAuthorized(req) {
  const provided = req.headers['x-admin-password'];
  const real = process.env.ADMIN_PASSWORD;
  if (!real) {
    // لو الأدمن مانساش يحط كلمة السر في متغيرات البيئة، امنع أي حاجة احتياطًا.
    return false;
  }
  return provided && provided === real;
}

function requireAuth(req, res) {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'غير مصرح. كلمة السر غلط أو ناقصة.' });
    return false;
  }
  return true;
}

module.exports = { isAuthorized, requireAuth };
