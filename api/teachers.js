// api/teachers.js
// GET    /api/teachers        -> عامة، أي زائر يقدر يقرأها (بتعرض المدرسين في الموقع)
// POST   /api/teachers        -> يحتاج كلمة سر الأدمن (هيدر x-admin-password) - إضافة مدرس
// PUT    /api/teachers?id=5   -> يحتاج كلمة سر - تعديل مدرس
// DELETE /api/teachers?id=5   -> يحتاج كلمة سر - حذف مدرس
const { sql } = require('./_db');
const { requireAuth } = require('./_auth');
const { cleanText, cleanInt, inspectOptionalImage, MAX_LONGTEXT_LEN } = require('./_validate');

// الحرف اللي بيترسم في الـ avatar لما الأدمن مايحددش icon: أول حرف من الاسم
// بعد شيل بادئة "أ."/"ا." (الكود القديم كان بياخد آخر حرف من الاسم كله).
function autoIcon(name) {
  const n = String(name || '').replace(/^\s*(أ|ا|إ|آ)\.?\s+/, '').trim();
  return n.slice(0, 1) || 'م';
}

module.exports = async (req, res) => {
  // مهم: منع أي تخزين مؤقت (Cache) لرد الـ API — من غير ده، Vercel أو
  // المتصفح ممكن يفضل يعرض بيانات قديمة للزوار حتى بعد ما تعدّل من لوحة
  // الأدمن، وده بالظبط اللي كان بيمنع الصور الجديدة من الظهور للزوار.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM teachers ORDER BY sort_order ASC, id ASC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      if (!requireAuth(req, res)) return;
      const t = req.body || {};
      if (!cleanText(t.name)) return res.status(400).json({ error: 'اسم المدرس مطلوب' });
      // الصورة اختيارية، لكن لو اتبعتت لازم تكون data:image سليمة وبحجم معقول —
      // غير كده نرفض الطلب كله بدل ما نخزن قيمة بايظة.
      const img = inspectOptionalImage(t.photo_data);
      if (img.state === 'invalid') return res.status(400).json({ error: 'الصورة غير صالحة أو أكبر من الحد المسموح (حوالي 2 ميجا)' });
      const rows = await sql`
        INSERT INTO teachers (name, subject, spec, grade, icon, cat, "where", lang, gender, bio, photo_data, sort_order)
        VALUES (${cleanText(t.name)}, ${cleanText(t.subject)}, ${cleanText(t.spec)}, ${cleanText(t.grade) || 'الثانوية'},
                ${cleanText(t.icon, 8) || autoIcon(t.name)},
                ${cleanText(t.cat)}, ${cleanText(t.where) || 'مدرسة شهيد حسن حمدي الثانوية'},
                ${cleanText(t.lang, 4) || 'ar'}, ${cleanText(t.gender, 4) || 'ذ'},
                ${cleanText(t.bio, MAX_LONGTEXT_LEN) || ''}, ${img.value}, ${cleanInt(t.sort_order)})
        RETURNING *`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: 'id مطلوب' });
      const t = req.body || {};
      if (t.name !== undefined && !cleanText(t.name)) return res.status(400).json({ error: 'الاسم غير صالح' });
      const img = inspectOptionalImage(t.photo_data);
      if (img.state === 'invalid') return res.status(400).json({ error: 'الصورة غير صالحة أو أكبر من الحد المسموح (حوالي 2 ميجا)' });
      // ملاحظة: أي حقل مش مبعوت في الطلب بيبقى undefined. بنحوّله لـ null صريح
      // قبل ما يوصل لقاعدة البيانات، عشان COALESCE تختار القيمة القديمة
      // (بدل ما تتحول لنص غريب زي "undefined" يتخزن في العمود).
      const rows = await sql`
        UPDATE teachers SET
          name=COALESCE(${cleanText(t.name)}, name), subject=COALESCE(${cleanText(t.subject)}, subject),
          spec=COALESCE(${cleanText(t.spec)}, spec), grade=COALESCE(${cleanText(t.grade)}, grade),
          icon=COALESCE(${cleanText(t.icon, 8)}, icon), cat=COALESCE(${cleanText(t.cat)}, cat),
          "where"=COALESCE(${cleanText(t.where)}, "where"), lang=COALESCE(${cleanText(t.lang, 4)}, lang),
          gender=COALESCE(${cleanText(t.gender, 4)}, gender), bio=COALESCE(${cleanText(t.bio, MAX_LONGTEXT_LEN)}, bio),
          photo_data=COALESCE(${img.value}, photo_data),
          sort_order=COALESCE(${t.sort_order !== undefined ? cleanInt(t.sort_order) : null}, sort_order)
        WHERE id=${id}
        RETURNING *`;
      if (!rows.length) return res.status(404).json({ error: 'مش موجود' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: 'id مطلوب' });
      await sql`DELETE FROM teachers WHERE id=${id}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    // التفاصيل الداخلية بتتسجل في لوج السيرفر بس — رد العميل يفضل عام
    // عشان منسرّبش أي معلومات عن بنية قاعدة البيانات.
    console.error(err);
    return res.status(500).json({ error: 'حصل خطأ في السيرفر' });
  }
};
