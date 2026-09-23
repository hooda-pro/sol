// api/photos.js — صور الذكريات (معرض الصور). الصورة نفسها متخزنة كـ base64
// جوه قاعدة البيانات عشان مفيش خدمة تخزين ملفات منفصلة. ده مناسب لعدد صور
// معقول (عشرات)، لو العدد كبر جدًا الأفضل ننقل التخزين لـ Vercel Blob.
const { sql } = require('./_db');
const { requireAuth } = require('./_auth');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM photos ORDER BY sort_order ASC, id DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      if (!requireAuth(req, res)) return;
      const p = req.body || {};
      if (!p.image_data) return res.status(400).json({ error: 'الصورة مطلوبة' });
      const rows = await sql`
        INSERT INTO photos (title, image_data, sort_order)
        VALUES (${p.title || ''}, ${p.image_data}, ${p.sort_order || 0})
        RETURNING id, title, sort_order, created_at`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: 'id مطلوب' });
      const p = req.body || {};
      const rows = await sql`
        UPDATE photos SET
          title=${p.title},
          image_data=COALESCE(${p.image_data}, image_data),
          sort_order=${p.sort_order || 0}
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
    console.error(err);
    return res.status(500).json({ error: 'حصل خطأ في السيرفر', detail: String(err) });
  }
};
