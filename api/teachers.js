// api/teachers.js
// GET    /api/teachers        -> عامة، أي زائر يقدر يقرأها (بتعرض المدرسين في الموقع)
// POST   /api/teachers        -> يحتاج كلمة سر الأدمن (هيدر x-admin-password) - إضافة مدرس
// PUT    /api/teachers?id=5   -> يحتاج كلمة سر - تعديل مدرس
// DELETE /api/teachers?id=5   -> يحتاج كلمة سر - حذف مدرس
const { sql } = require('./_db');
const { requireAuth } = require('./_auth');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM teachers ORDER BY sort_order ASC, id ASC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      if (!requireAuth(req, res)) return;
      const t = req.body || {};
      const rows = await sql`
        INSERT INTO teachers (name, subject, spec, grade, icon, cat, "where", lang, gender, bio, photo_data, sort_order)
        VALUES (${t.name}, ${t.subject}, ${t.spec}, ${t.grade || 'الثانوية'}, ${t.icon || (t.name ? t.name.trim().slice(-1) : 'م')},
                ${t.cat}, ${t.where || 'مدرسة شهيد حسن حمدي الثانوية'}, ${t.lang || 'ar'}, ${t.gender || 'ذ'},
                ${t.bio || ''}, ${t.photo_data || null}, ${t.sort_order || 0})
        RETURNING *`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: 'id مطلوب' });
      const t = req.body || {};
      const rows = await sql`
        UPDATE teachers SET
          name=COALESCE(${t.name}, name), subject=COALESCE(${t.subject}, subject),
          spec=COALESCE(${t.spec}, spec), grade=COALESCE(${t.grade}, grade),
          icon=COALESCE(${t.icon}, icon), cat=COALESCE(${t.cat}, cat),
          "where"=COALESCE(${t.where}, "where"), lang=COALESCE(${t.lang}, lang),
          gender=COALESCE(${t.gender}, gender), bio=COALESCE(${t.bio}, bio),
          photo_data=COALESCE(${t.photo_data}, photo_data),
          sort_order=COALESCE(${t.sort_order}, sort_order)
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
    console.error(err);
    return res.status(500).json({ error: 'حصل خطأ في السيرفر', detail: String(err) });
  }
};
