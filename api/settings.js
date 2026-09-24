// api/settings.js
// Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¹Ø§Ù…Ø© Ù„Ù„Ù…ÙˆÙ‚Ø¹ (key/value) ÙÙŠ Ø¬Ø¯ÙˆÙ„ site_settings:
//   GET  /api/settings                 â†’ { settings:{ principal:.., stats:.. } }  (Ø¹Ø§Ù… â€” Ø¨Ø¯ÙˆÙ† ÙƒÙ„Ù…Ø© Ø³Ø±)
//   GET  /api/settings?key=principal   â†’ { key, value }                           (Ø¹Ø§Ù… â€” Ø¨Ø¯ÙˆÙ† ÙƒÙ„Ù…Ø© Ø³Ø±)
//   PUT  /api/settings?key=principal   { value:{...} }   â†’ ØªØ­Ø¯ÙŠØ« (Ù„Ù„Ø£Ø¯Ù…Ù† ÙÙ‚Ø·)
// Ø§Ù„Ù…ÙØ§ØªÙŠØ­ Ø§Ù„Ù…Ø³Ù…ÙˆØ­Ø© (whitelist) Ø¹Ø´Ø§Ù† Ù…Ø­Ø¯Ø´ ÙŠØ®Ø²Ù† Ø­Ø§Ø¬Ø§Øª Ø¹Ø´ÙˆØ§Ø¦ÙŠØ© ÙÙŠ Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©:
//   principal â†’ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø¯ÙŠØ± (Ø§Ø³Ù…/ÙˆØ¸ÙŠÙØ©/Ø´Ø§Ø±Ø©/Ù†Ø¨Ø°Ø©/ØµÙˆØ±Ø©)
//   stats     â†’ Ø´Ø±ÙŠØ· Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© (4 Ø£Ø±Ù‚Ø§Ù… ÙˆØªØ³Ù…ÙŠØ§ØªÙ‡Ø§)
// Ø³Ù„ÙˆÙƒ Ø§Ù„Ø­ÙØ¸: Ø¯Ù…Ø¬ Ù…Ø¹ Ø§Ù„Ù‚Ø¯ÙŠÙ… â€” Ø­Ù‚Ù„ Ù…Ø´ Ù…Ø¨Ø¹ÙˆØª = Ø³ÙŠØ¨Ù‡ Ø²ÙŠ Ù…Ø§ Ù‡ÙˆØŒ
// ÙˆØ­Ù‚Ù„ Ù…Ø¨Ø¹ÙˆØª Ø¨Ù€ null = Ø§Ù…Ø³Ø­Ù‡ (Ø¨ØªØ³ØªØ®Ø¯Ù…Ù‡ Ù„ÙˆØ­Ø© Ø§Ù„Ø£Ø¯Ù…Ù† Ù„Ø¥Ø²Ø§Ù„Ø© Ø§Ù„ØµÙˆØ±).
const { sql } = require('./_db.js');
const { isAuthorized } = require('./_auth.js');
const { cleanImage } = require('./_validate.js');

const ALLOWED_KEYS = new Set(['principal', 'stats']);

// Ø­Ø¯ Ø£Ù‚ØµÙ‰ Ù„Ø­Ø¬Ù… Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø®Ø²Ù†Ø© (ÙƒÙ†Øµ JSON) â€” ÙŠÙƒÙÙŠ ØµÙˆØ±Ø© base64 Ù…Ø¶ØºÙˆØ·Ø©
// (Ø§Ù„ÙØ±ÙˆÙ†Øª Ø¨ÙŠØ¶ØºØ· Ù„Ù€ WebP ØµØºÙŠØ±) + Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù†ØµÙŠØ©ØŒ ÙˆØ¨ÙŠÙ…Ù†Ø¹ ØªØ®Ø²ÙŠÙ† payload Ø¶Ø®Ù….
const MAX_VALUE_BYTES = 200 * 1024;

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

// ØªÙ†Ø¶ÙŠÙ ÙƒØ§Ø¦Ù† Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª: Ø¨Ù†Ø³Ù…Ø­ Ø¨Ù†ØµÙˆØµ Ø¨Ø³ (Ø­Ø¯ 5000 Ø­Ø±Ù Ù„Ù„Ø­Ù‚Ù„ â€” Ø§Ù„Ù†Ø¨Ø°Ø© Ù…Ø«Ù„Ù‹Ø§)ØŒ
// Ø­Ù‚ÙˆÙ„ Ø§Ù„ØµÙˆØ± (photo_data) Ø¨ØªØªÙØ­Øµ Ø¨Ù€ cleanImageØŒ ÙˆØ£ÙŠ Ù…ÙØ§ØªÙŠØ­ ØºØ±ÙŠØ¨Ø© Ø¨ØªØªØ±Ù…ÙŠ.
// Ø¨ÙŠØ±Ø¬Ø¹ { value } Ø¹Ù†Ø¯ Ø§Ù„Ù†Ø¬Ø§Ø­ Ø£Ùˆ { error } Ø¨Ø±Ø³Ø§Ù„Ø© Ø¹Ø±Ø¨ÙŠØ© Ø¹Ù†Ø¯ Ø§Ù„Ø±ÙØ¶.
function sanitizeValue(v) {
  if (!isPlainObject(v)) return { error: 'Ø§Ù„Ù‚ÙŠÙ…Ø© Ù„Ø§Ø²Ù… ØªÙƒÙˆÙ† ÙƒØ§Ø¦Ù† JSON' };
  const out = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof k !== 'string' || !k || k.length > 40) continue;
    if (val === null) { out[k] = null; continue; } // null = Ù…Ø³Ø­ Ù…ØªØ¹Ù…Ø¯ Ù„Ù„Ø­Ù‚Ù„
    if (k === 'photo_data') {
      if (typeof val === 'string' && val) {
        const img = cleanImage(val);
        if (!img) return { error: 'Ø§Ù„ØµÙˆØ±Ø© ØºÙŠØ± ØµØ§Ù„Ø­Ø© â€” Ø§Ù„Ù…Ø³Ù…ÙˆØ­ ØµÙˆØ± ÙÙ‚Ø·' };
        out[k] = img;
      }
      continue; // ØµÙˆØ±Ø© ÙØ§Ø¶ÙŠØ©/ØºÙŠØ± Ù†ØµÙŠØ© = ØªØ¬Ø§Ù‡Ù„Ù‡Ø§ ÙˆØ³ÙŠØ¨ Ø§Ù„Ù‚Ø¯ÙŠÙ…
    }
    if (typeof val === 'string') { out[k] = val.slice(0, 5000); continue; }
    if (typeof val === 'number' && Number.isFinite(val)) { out[k] = val; continue; }
  }
  return { value: out };
}
// Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ù‚Ø¨ÙˆÙ„Ø©: ÙƒØ§Ø¦Ù† (principal) Ø£Ùˆ Ù…ØµÙÙˆÙØ© ÙƒØ§Ø¦Ù†Ø§Øª (stats â€” Ø®Ù„Ø§ÙŠØ§
// {label, target, suffix}ØŒ Ø§Ù„Ù€ target ÙÙŠÙ‡Ø§ Ø±Ù‚Ù… Ù…Ø´ Ù†Øµ). Ø§Ù„Ù…ØµÙÙˆÙØ© Ù…Ø­Ø¯ÙˆØ¯Ø©
// Ø¨Ù€ 12 Ø¹Ù†ØµØ± ÙˆÙƒÙ„ Ø¹Ù†ØµØ± Ø¨ÙŠØªÙ†Ø¶Ù‘Ù Ø²ÙŠ ÙƒØ§Ø¦Ù† Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¨Ø§Ù„Ø¸Ø¨Ø·.
const _sanitizeObject = sanitizeValue;
sanitizeValue = function (v) {
  if (Array.isArray(v)) {
    if (v.length > 12) return { error: 'Ù‚ÙŠÙ…Ø© Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø£ÙƒØ¨Ø± Ù…Ù† Ø§Ù„Ù…Ø³Ù…ÙˆØ­' };
    const arr = [];
    for (const item of v) {
      const c = _sanitizeObject(item);
      if (c.error) return c;
      arr.push(c.value);
    }
    return { value: arr };
  }
  return _sanitizeObject(v);
};

// Ø§Ù„Ø¬Ø¯ÙˆÙ„ Ø¨ÙŠØªØ¹Ù…Ù„ ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§ Ø£ÙˆÙ„ Ù…Ø§ Ø§Ù„ÙØ§Ù†ÙƒØ´Ù† ØªØµØ­Ù‰ (cold start) Ù„Ùˆ Ù…Ø´ Ù…ÙˆØ¬ÙˆØ¯ â€”
// Ø¢Ù…Ù† ÙˆÙ…ØªÙƒØ±Ø± (IF NOT EXISTS)ØŒ ÙÙ„Ùˆ Ø§Ù„Ø£Ø¯Ù…Ù† Ù†Ø³ÙŠ ÙŠØ´ØºÙ‘Ù„ schema.sql ÙÙŠ Neon
// Ø§Ù„Ù€ endpoint Ù…ÙŠÙƒØ³Ø±Ø´ ÙˆØ§Ù„Ù…ÙˆÙ‚Ø¹ ÙŠÙØ¶Ù„ Ø´ØºØ§Ù„.
let ensureTablePromise = null;
function ensureTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        key         TEXT PRIMARY KEY,
        value       JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at  TIMESTAMPTZ DEFAULT now()
      )`.catch(err => {
        ensureTablePromise = null; // Ù„Ùˆ ÙØ´Ù„ Ù†Ø­Ø§ÙˆÙ„ ØªØ§Ù†ÙŠ ÙÙŠ Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ø¬Ø§ÙŠ
        throw err;
      });
  }
  return ensureTablePromise;
}

module.exports = async function handler(req, res) {
  const key = String((req.query && req.query.key) || '').trim();
  if (key && !ALLOWED_KEYS.has(key)) {
    return res.status(400).json({ error: 'Ù…ÙØªØ§Ø­ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ' });
  }

  if (req.method === 'GET') {
    try {
      await ensureTable();
      if (key) {
        const rows = await sql`SELECT value FROM site_settings WHERE key = ${key} LIMIT 1`;
        return res.status(200).json({ key, value: rows[0] ? rows[0].value : null });
      }
      // Ø¨Ø¯ÙˆÙ† key: ÙƒÙ„ Ø§Ù„Ù…ÙØ§ØªÙŠØ­ Ø§Ù„Ù…Ø¹Ø±ÙˆÙØ© Ù…Ø±Ø© ÙˆØ§Ø­Ø¯Ø© (ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø²Ø§Ø¦Ø± Ø¨ÙŠØ³ØªØ®Ø¯Ù…Ù‡Ø§)
      const rows = await sql`SELECT key, value FROM site_settings`;
      const settings = {};
      for (const r of rows) {
        if (ALLOWED_KEYS.has(r.key)) settings[r.key] = r.value;
      }
      return res.status(200).json({ settings });
    } catch (err) {
      console.error('settings GET error:', err);
      return res.status(500).json({ error: 'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù…' });
    }
  }

  if (req.method === 'PUT') {
    if (!key) return res.status(400).json({ error: 'Ø­Ø¯Ø¯ Ù…ÙØªØ§Ø­ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª ÙÙŠ ?key=' });
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'ØºÙŠØ± Ù…ØµØ±Ø­. ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø± ØºÙ„Ø· Ø£Ùˆ Ù†Ø§Ù‚ØµØ©.' });
    }

    const body = req.body || {};
    const cleaned = sanitizeValue(body.value);
    if (cleaned.error) return res.status(400).json({ error: cleaned.error });

    try {
      await ensureTable();
      // Ù†Ø¬ÙŠØ¨ Ø§Ù„Ù‚Ø¯ÙŠÙ… Ø§Ù„Ø£ÙˆÙ„ Ø¹Ø´Ø§Ù† Ù†Ø¯Ù…Ø¬: Ø­Ù‚Ù„ Ù…Ø´ Ù…Ø¨Ø¹ÙˆØª ÙŠÙØ¶Ù„ Ø²ÙŠ Ù…Ø§ Ù‡ÙˆØŒ
      // ÙˆØ­Ù‚Ù„ Ù…Ø¨Ø¹ÙˆØª Ø¨Ù€ null ÙŠØªÙ…Ø³Ø­ Ù…Ù† Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠØ©.
      const rows = await sql`SELECT value FROM site_settings WHERE key = ${key} LIMIT 1`;
      const old = isPlainObject(rows[0] && rows[0].value) ? rows[0].value : {};
      const merged = { ...old, ...cleaned.value };
      for (const [k, v] of Object.entries(merged)) {
        if (v === null) delete merged[k];
      }
      const mergedJson = JSON.stringify(merged);
      if (mergedJson.length > MAX_VALUE_BYTES) {
        return res.status(413).json({ error: 'Ø§Ù„Ù‚ÙŠÙ…Ø© Ø£ÙƒØ¨Ø± Ù…Ù† Ø§Ù„Ø­Ø¯ Ø§Ù„Ù…Ø³Ù…ÙˆØ­' });
      }
      await sql`
        INSERT INTO site_settings (key, value, updated_at)
        VALUES (${key}, ${mergedJson}::jsonb, now())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
      `;
      return res.status(200).json({ ok: true, key, value: merged });
    } catch (err) {
      console.error('settings PUT error:', err);
      return res.status(500).json({ error: 'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù…' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
