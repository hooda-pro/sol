// api/students.js — نفس منطق api/teachers.js بالظبط لكن لجدول الطلاب الأوائل
const { sql } = require('./_db');
const { requireAuth } = require('./_auth');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM students ORDER BY rank ASC, id ASC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      if (!requireAuth(req, res)) return;
      const s = req.body || {};
      const rows = await sql`
        INSERT INTO students (rank, name, icon, grade, score, "from", dob, quote, photo_data)
        VALUES (${s.rank || 0}, ${s.name}, ${s.icon || (s.name ? s.name.trim().slice(0,1) : 'ط')},
                ${s.grade}, ${s.score}, ${s.from}, ${s.dob || null}, ${s.quote || ''}, ${s.photo_data || null})
        RETURNING *`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: 'id مطلوب' });
      const s = req.body || {};
      const rows = await sql`
        UPDATE students SET
          rank=${s.rank}, name=${s.name}, icon=${s.icon}, grade=${s.grade},
          score=${s.score}, "from"=${s.from}, dob=${s.dob || null}, quote=${s.quote},
          photo_data=COALESCE(${s.photo_data}, photo_data)
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
    console.error(err);
    return res.status(500).json({ error: 'حصل خطأ في السيرفر', detail: String(err) });
  }
};
