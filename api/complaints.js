// api/complaints.js
// GET    /api/complaints       -> يحتاج كلمة سر الأدمن - عرض كل الشكاوى في اللوحة
// POST   /api/complaints       -> عامة، أي زائر يقدّم شكوى من نموذج الموقع
// PUT    /api/complaints?id=5  -> يحتاج كلمة سر - تغيير الحالة (جديدة / تمت المراجعة)
// DELETE /api/complaints?id=5  -> يحتاج كلمة سر - حذف شكوى
const { sql } = require('./_db');
const { requireAuth } = require('./_auth');
const { validateComplaint } = require('./_validate');

// الحالات المسموحة — الأدمن بيبدّل بينهم بس، فالقيمة لازم تكون واحدة منهم.
const STATUSES = ['جديدة', 'تمت المراجعة'];

module.exports = async (req, res) => {
  // مفيش كاش أبدًا: الأدمن لازم يشوف أحدث شكوى فورًا.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  try {
    if (req.method === 'GET') {
      // الشكاوى فيها أسماء وأرقام ناس — مش متاحة للعامة خالص.
      if (!requireAuth(req, res)) return;
      const rows = await sql`SELECT id, type, name, phone, details, images, status, created_at FROM complaints ORDER BY id DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      // الفحص كله في validateComplaint: نوع من القائمة الثابتة، اسم، موبايل
      // مصري، تفاصيل، لحد 5 صور سليمة بحجم آمن، وفخ بوتات. أي حاجة بايظة
      // بترجع 400 برسالة عربية يقدر الزائر يفهمها ويظبطها.
      const result = validateComplaint(req.body);
      if (!result.ok) return res.status(400).json({ error: result.error });
      const d = result.data;
      const rows = await sql`
        INSERT INTO complaints (type, name, phone, details, images)
        VALUES (${d.type}, ${d.name}, ${d.phone}, ${d.details}, ${JSON.stringify(d.images)}::jsonb)
        RETURNING id`;
      // بنرجع رقم الشكوى بس — مفيش داعي نرجّع بيانات الزائر تاني في الرد.
      return res.status(201).json({ ok: true, id: rows[0].id });
    }

    if (req.method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: 'id مطلوب' });
      const status = (req.body && typeof req.body.status === 'string') ? req.body.status : '';
      if (!STATUSES.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });
      const rows = await sql`UPDATE complaints SET status=${status} WHERE id=${id} RETURNING id`;
      if (!rows.length) return res.status(404).json({ error: 'مش موجود' });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: 'id مطلوب' });
      await sql`DELETE FROM complaints WHERE id=${id}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    // التفاصيل في لوج السيرفر بس — العميل ياخد رد عام عشان منسرّبش بنية القاعدة.
    console.error(err);
    return res.status(500).json({ error: 'حصل خطأ في السيرفر' });
  }
};
