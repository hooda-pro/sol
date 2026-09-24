// api/students.js — نفس منطق api/teachers.js بالظبط لكن لجدول الطلاب الأوائل
const { sql } = require('./_db');
const { requireAuth } = require('./_auth');
const { cleanText, cleanInt, cleanDate, inspectOptionalImage, MAX_LONGTEXT_LEN } = require('./_validate');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM students ORDER BY rank ASC, id ASC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      if (!requireAuth(req, res)) return;
      const s = req.body || {};
      if (!cleanText(s.name)) return res.status(400).json({ error: 'اسم الطالب مطلوب' });
      const img = inspectOptionalImage(s.photo_data);
      if (img.state === 'invalid') return res.status(400).json({ error: 'الصورة غير صالحة أو أكبر من الحد المسموح (حوالي 2 ميجا)' });
      const dob = cleanDate(s.dob); // فاضي/undefined/بايظ يبقى NULL (عمود DATE مش بيقبل نص فاضي)
      const rows = await sql`
        INSERT INTO students (rank, name, icon, grade, score, "from", dob, quote, photo_data)
        VALUES (${cleanInt(s.rank)}, ${cleanText(s.name)},
                ${cleanText(s.icon, 8) || (s.name ? String(s.name).trim().slice(0,1) : 'ط')},
                ${cleanText(s.grade)}, ${cleanText(s.score)}, ${cleanText(s.from)},
                ${dob}, ${cleanText(s.quote, MAX_LONGTEXT_LEN) || ''}, ${img.value})
        RETURNING *`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: 'id مطلوب' });
      const s = req.body || {};
      if (s.name !== undefined && !cleanText(s.name)) return res.status(400).json({ error: 'الاسم غير صالح' });
      const img = inspectOptionalImage(s.photo_data);
      if (img.state === 'invalid') return res.status(400).json({ error: 'الصورة غير صالحة أو أكبر من الحد المسموح (حوالي 2 ميجا)' });
      // undefined -> null صريح: أي حقل مش مبعوت يفضل زي ما هو في قاعدة البيانات
      // بدل ما يتحول لقيمة غريبة (نفس الملاحظة اللي في api/teachers.js).
      const dob = cleanDate(s.dob);
      const rows = await sql`
        UPDATE students SET
          rank=COALESCE(${s.rank !== undefined ? cleanInt(s.rank) : null}, rank),
          name=COALESCE(${cleanText(s.name)}, name),
          icon=COALESCE(${cleanText(s.icon, 8)}, icon), grade=COALESCE(${cleanText(s.grade)}, grade),
          score=COALESCE(${cleanText(s.score)}, score), "from"=COALESCE(${cleanText(s.from)}, "from"),
          dob=COALESCE(${dob}, dob), quote=COALESCE(${cleanText(s.quote, MAX_LONGTEXT_LEN)}, quote),
          photo_data=COALESCE(${img.value}, photo_data)
        WHERE id=${id}
        RETURNING *`;
      if (!rows.length) return res.status(404).json({ error: 'مش موجود' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: 'id مطلوب' });
      await sql`DELETE FROM students WHERE id=${id}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    // التفاصيل الداخلية بتتسجل في لوج السيرفر بس — رد العميل يفضل عام
    console.error(err);
    return res.status(500).json({ error: 'حصل خطأ في السيرفر' });
  }
};
