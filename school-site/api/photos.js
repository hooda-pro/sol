// api/photos.js — صور الذكريات (معرض الصور). الصورة نفسها متخزنة كـ base64
// جوه قاعدة البيانات عشان مفيش خدمة تخزين ملفات منفصلة. ده مناسب لعدد صور
// معقول (عشرات)، لو العدد كبر جدًا الأفضل ننقل التخزين لـ Vercel Blob.
const { sql } = require('./_db');
const { requireAuth } = require('./_auth');
const { cleanText, cleanInt, cleanImage, inspectOptionalImage } = require('./_validate');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM photos ORDER BY sort_order ASC, id DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      if (!requireAuth(req, res)) return;
      const p = req.body || {};
      // هنا الصورة إجبارية — ولازم تكون data:image سليمة وبحجم معقول.
      const image = cleanImage(p.image_data);
      if (!image) return res.status(400).json({ error: 'الصورة مطلوبة — ولازم تكون صورة صالحة وأصغر من حوالي 2 ميجا' });
      const rows = await sql`
        INSERT INTO photos (title, image_data, sort_order)
        VALUES (${cleanText(p.title) || ''}, ${image}, ${cleanInt(p.sort_order)})
        RETURNING id, title, sort_order, created_at`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: 'id مطلوب' });
      const p = req.body || {};
      // undefined -> null صريح على كل عمود (نفس الملاحظة اللي في api/teachers.js)
      const img = inspectOptionalImage(p.image_data);
      if (img.state === 'invalid') return res.status(400).json({ error: 'الصورة غير صالحة أو أكبر من الحد المسموح (حوالي 2 ميجا)' });
      const rows = await sql`
        UPDATE photos SET
          title=${cleanText(p.title) ?? ''},
          image_data=COALESCE(${img.value}, image_data),
          sort_order=${cleanInt(p.sort_order)}
        WHERE id=${id}
        RETURNING id, title, sort_order, created_at`;
      if (!rows.length) return res.status(404).json({ error: 'مش موجودة' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: 'id مطلوب' });
      await sql`DELETE FROM photos WHERE id=${id}`;
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
