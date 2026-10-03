// tests/settings-roundtrip.test.js
// محاكاة كاملة لدورة "حفظ الإحصائيات من لوحة الأدمن → قراءتها في الموقع"
// بدون قاعدة بيانات حقيقية: بنحقن _db.js وهمي في ذاكرة (Map) بيقلد سلوك
// JSONB بتاع Postgres (بيرجع القيمة ككائن/مصفوفة بعد التخزين).
const path = require('path');

const apiDir = path.resolve(__dirname, '..', 'api');
const store = new Map(); // key -> parsed JSON (زي JSONB)

function sql(strings, ...vals) {
  const text = strings.join('?');
  if (/CREATE TABLE/i.test(text)) return Promise.resolve([]);
  if (/SELECT value FROM site_settings WHERE key/i.test(text)) {
    const key = vals[0];
    return Promise.resolve(store.has(key) ? [{ value: store.get(key) }] : []);
  }
  if (/SELECT key, value FROM site_settings/i.test(text)) {
    return Promise.resolve([...store.entries()].map(([key, value]) => ({ key, value })));
  }
  if (/INSERT INTO site_settings/i.test(text)) {
    // ::jsonb cast — Postgres بيخزن JSON ويرجعه ككائن جافاسكربت عند القراءة
    store.set(vals[0], JSON.parse(vals[1]));
    return Promise.resolve([]);
  }
  return Promise.reject(new Error('SQL غير متوقع: ' + text));
}

// حقن الموديولات الوهمية في الكاش قبل تحميل settings.js
const dbPath = path.join(apiDir, '_db.js');
const authPath = path.join(apiDir, '_auth.js');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { sql } };
require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: { isAuthorized: () => true, requireAuth: () => true, safeEqual: () => true } };
const handler = require(path.join(apiDir, 'settings.js'));

function mockReq(method, query, body) {
  return { method, query: query || {}, body, headers: { 'x-admin-password': 'x' } };
}
function mockRes() {
  return {
    statusCode: 0, payload: null,
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.payload = obj; return this; }
  };
}

let failures = 0;
function check(name, cond) {
  if (cond) { console.log('  PASS ', name); }
  else { failures++; console.error('  FAIL ', name); }
}

(async () => {
  // ١) الأدمن بيحفظ أرقام جديدة (زي ما الفورم في admin.js بيعمل بالظبط)
  const adminValue = [0, 1, 2, 3].map(i => ({ label: 'تسمية ' + i, target: 100 + i, suffix: i === 3 ? '%' : '' }));
  let res = mockRes();
  await handler(mockReq('PUT', { key: 'stats' }, { value: adminValue }), res);
  check('PUT /api/settings?key=stats يرجع 200', res.statusCode === 200);
  check('القيمة المحفوظة بتترجع مصفوفة في الرد', Array.isArray(res.payload && res.payload.value));
  check('القيمة المخزنة في "قاعدة البيانات" مصفوفة مش كائن مفاتيح رقمية', Array.isArray(store.get('stats')));
  check('الرقم المحفوظ صح (target=102 للخانة الثالثة)', store.get('stats')[2].target === 102);

  // ٢) لوحة الأدمن بترجع تفتح تبويب "معلومات الموقع" — لازم تلاقي الأرقام الجديدة
  res = mockRes();
  await handler(mockReq('GET', { key: 'stats' }), res);
  check('GET ?key=stats يرجع 200', res.statusCode === 200);
  check('الأدمن بيلاقي مصفوفة (Array.isArray → الفورم يتملى بالقيم المحفوظة)', Array.isArray(res.payload && res.payload.value));
  check('القيم هي اللي اتحفظت مش الافتراضية', res.payload.value[0].target === 100 && res.payload.value[3].suffix === '%');

  // ٣) الزائر بيفتح الموقع — /api/settings من غير key
  res = mockRes();
  await handler(mockReq('GET', {}), res);
  check('GET /api/settings يرجع settings.stats مصفوفة', Array.isArray(res.payload && res.payload.settings && res.payload.settings.stats));
  check('الزائر بيشوف نفس الأرقام المحفوظة', res.payload.settings.stats[1].target === 101);

  // ٤) بيانات قديمة اتخزنت غلط من نسخة الكود القديمة (كائن بمفاتيح رقمية)
  //    — لازم القراءة تصلّحها تلقائيًا وترجعها مصفوفة.
  store.set('stats', { 0: { label: 'مدرس', target: 29 }, 1: { label: 'طالب', target: 450 } });
  res = mockRes();
  await handler(mockReq('GET', { key: 'stats' }), res);
  check('البيانات القديمة المعطوبة بتتصلّح عند القراءة (مصفوفة)', Array.isArray(res.payload && res.payload.value));
  check('ترتيب البيانات القديمة بعد الإصلاح صح', res.payload.value[0].target === 29 && res.payload.value[1].target === 450);

  // ٥) مفتاح principal: دمج مع القديم — حقل مش مبعوت يفضل موجود
  store.set('principal', { name: 'الأستاذ أحمد', role: 'مدير المدرسة' });
  res = mockRes();
  await handler(mockReq('PUT', { key: 'principal' }, { value: { bio: 'نبذة جديدة' } }), res);
  check('دمج principal بيحتفظ بالحقول القديمة', res.payload.value.name === 'الأستاذ أحمد' && res.payload.value.bio === 'نبذة جديدة');

  // ٦) حماية: مفتاح غريب ميتخزنش
  res = mockRes();
  await handler(mockReq('PUT', { key: 'hacked' }, { value: { a: 1 } }), res);
  check('مفتاح غير معروف بيترفض 400', res.statusCode === 400);

  if (failures) { console.error(failures + ' check(s) failed.'); process.exit(1); }
  console.log('\nكل اختبارات دورة حفظ/قراءة الإعدادات نجحت — الكود المحلي سليم.');
})().catch(e => { console.error(e); process.exit(1); });
