// api/team.js
// GET -> { mahmoud: 16 }  (سن محمود محسوب على السيرفر)
// تاريخ الميلاد مخزّن في متغير بيئة MAHMOUD_BIRTHDATE (صيغة YYYY-MM-DD) على Vercel،
// يعني مش مكتوب في أي ملف في المشروع، ومش بيتبعت للمتصفح — الرقم بس هو اللي بيتبعت.
function ageFrom(iso, now = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  // بنحسب بتوقيت القاهرة عشان السن يزيد في يوم الميلاد نفسه عندنا
  const cairo = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
  let age = cairo.getFullYear() - y;
  if (cairo.getMonth() + 1 < mo || (cairo.getMonth() + 1 === mo && cairo.getDate() < d)) age--;
  return age > 0 && age < 100 ? age : null;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const out = {};
  const mahmoud = ageFrom(process.env.MAHMOUD_BIRTHDATE);
  if (mahmoud !== null) out.mahmoud = mahmoud;
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json(out);
};
module.exports.ageFrom = ageFrom;
