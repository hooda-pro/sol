// api/login.js
// POST { password } -> بيتحقق من كلمة السر ويرجع ok:true لو صح.
// الفرونت بيخزن كلمة السر في الجلسة (sessionStorage) بعد كده وبيبعتها في كل
// طلب لاحق كهيدر x-admin-password، وكل endpoint بيتحقق منها بنفسه من جديد.
const { isAuthorized } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { password } = req.body || {};
  const real = process.env.ADMIN_PASSWORD;
  if (!real) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD مش متظبط على السيرفر.' });
  }
  if (password && password === real) {
    return res.status(200).json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: 'كلمة السر غلط' });
};
