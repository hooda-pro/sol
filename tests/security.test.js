/* ============================================================
   tests/security.test.js — حماية XSS + التحقق من المدخلات + المصادقة
   ------------------------------------------------------------
   - بيشغّل js/site.js الحقيقي في sandbox ويجرّب حقن كود خبيث عن طريق
     بيانات مدرس ملوثة، ويتأكد إن المخرجات معقّمة.
   - بيختبر api/_validate.js (فحص النصوص والصور والأرقام على السيرفر).
   - وبيختبر api/_auth.js (المقارنة timing-safe + الرفض لما كلمة السر
     مش متظبطة على السيرفر أصلًا).

   طريقة التشغيل:  node tests/security.test.js
============================================================ */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const ROOT = process.argv[2] || path.join(__dirname, '..');
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('  PASS  ' + name); }

/* ---- جزء 1: الفرونت — تعقيم المخرجات في js/site.js ---- */
function makeEl() {
  return {
    style: {}, dataset: {}, children: [],
    className: '', innerHTML: '', lang: '', alt: '', src: '', onclick: null,
    setAttribute() {}, removeAttribute() {}, getAttribute() { return null; },
    appendChild(c) { this.children.push(c); },
    querySelector() { return null; },
  };
}
const sandbox = {
  console,
  setTimeout: () => 0,
  setInterval: () => 0,
  document: {
    addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    getElementById() { return null; }, createElement: makeEl,
  },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }), location: { hash: '' } },
};
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'site.js'), 'utf8'), sandbox, { filename: 'site.js' });

check('escapeHtml neutralizes every HTML-special character', () => {
  assert.strictEqual(
    sandbox.escapeHtml('<img src=x onerror="a">\'&'),
    '&lt;img src=x onerror=&quot;a&quot;&gt;&#39;&amp;'
  );
  assert.strictEqual(sandbox.escapeHtml(null), '');
  assert.strictEqual(sandbox.escapeHtml(undefined), '');
  assert.strictEqual(sandbox.escapeHtml(42), '42');
});

check('safePhotoSrc accepts only data:image/*;base64 payloads', () => {
  assert.ok(sandbox.safePhotoSrc('data:image/jpeg;base64,AAAA'));
  assert.ok(sandbox.safePhotoSrc(' data:image/png;base64,iVBORw0KGgo= ')); // مسافات على الأطراف متشالة
  assert.strictEqual(sandbox.safePhotoSrc('javascript:alert(1)'), '');
  assert.strictEqual(sandbox.safePhotoSrc('https://evil.example/x.jpg'), '');
  assert.strictEqual(sandbox.safePhotoSrc('data:text/html;base64,PHNjcmlwdD4='), ''); // مش كل data: مسموح
  assert.strictEqual(sandbox.safePhotoSrc('x" onerror="alert(1)'), '');
  assert.strictEqual(sandbox.safePhotoSrc(null), '');
  assert.strictEqual(sandbox.safePhotoSrc(undefined), '');
});

check('a malicious teacher name/icon cannot break out of the markup', () => {
  const html = sandbox.buildTeacherRow({
    name: '"><img src=x onerror=alert(1)>', subject: 'عام', icon: '<svg onload=alert(2)>',
    gender: 'ذ', spec: 'عام', grade: 'عام', where: 'مكان', cat: 'عام', bio: 'نبذة',
  }).innerHTML;
  assert.ok(!html.includes('"><img'), 'attribute breakout via name must be escaped');
  assert.ok(!html.includes('<svg onload'), 'injected svg tag via icon must be escaped');
  assert.ok(html.includes('&lt;img'), 'the payload must survive only as inert text');
});

check('a poisoned photo_data is dropped entirely (no has-photo, no img)', () => {
  const html = sandbox.buildTeacherRow({
    name: 'أ. س', subject: 'عام', icon: 'س', gender: 'أ',
    spec: 'عام', grade: 'عام', where: 'مكان', cat: 'عام', bio: 'نبذة',
    photo_data: 'x" onerror="alert(1)',
  }).innerHTML;
  assert.ok(!html.includes('onerror="alert(1)"'), 'poisoned photo must never reach the markup');
  assert.ok(!/teacher-row-photo has-photo/.test(html), 'invalid photo must not activate has-photo');
});

check('admin.js escapes DB values before printing them (source check)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'admin.js'), 'utf8');
  assert.ok(src.includes('function admEsc('), 'admEsc helper must exist in admin.js');
  assert.ok(/admEsc\(schema\.itemTitle/.test(src), 'admin list titles must be escaped');
  assert.ok(/admEsc\(admSearchQuery\)/.test(src), 'search query echo must be escaped');
});

check('the old WhatsApp story modal is fully gone and the form posts to the API (source check)', () => {
  const site = fs.readFileSync(path.join(ROOT, 'js', 'site.js'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(!site.includes('runSupportSequence'), 'story sequencer must be removed from site.js');
  assert.ok(!site.includes('wa.me'), 'no WhatsApp links in public site JS');
  assert.ok(!html.includes('wa.me'), 'no WhatsApp links in index.html');
  assert.ok(!html.includes('support-slide'), 'story slides must be removed from index.html');
  assert.ok(html.includes('id="cmpForm"'), 'complaint form must exist in index.html');
  assert.ok(site.includes("fetch('/api/complaints'"), 'site must POST complaints to the API');
});

check('admin panel has a complaints tab with escaped rendering (source check)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'admin.js'), 'utf8');
  assert.ok(src.includes("'/api/complaints'"), 'complaints schema must point to /api/complaints');
  assert.ok(src.includes('renderComplaintList'), 'complaint list renderer must exist');
  assert.ok(/admEsc\(c\.details\)/.test(src), 'complaint details must be escaped');
  assert.ok(/admEsc\(c\.name\)/.test(src), 'complaint names must be escaped');
});

/* ---- جزء 2: السيرفر — api/_validate.js ---- */
const { cleanText, cleanImage, cleanInt, cleanDate, inspectOptionalImage, cleanPhone, validateComplaint, COMPLAINT_TYPES, MAX_IMAGE_LEN } =
  require(path.join(ROOT, 'api', '_validate.js'));

check('cleanText caps length and rejects non-strings', () => {
  assert.strictEqual(cleanText('abc'), 'abc');
  assert.strictEqual(cleanText('x'.repeat(5000)).length, 1000);
  assert.strictEqual(cleanText(123), null);
  assert.strictEqual(cleanText(undefined), null);
});

check('cleanImage rejects anything that is not a safe data:image payload', () => {
  const good = 'data:image/jpeg;base64,' + Buffer.from('hello image').toString('base64');
  assert.strictEqual(cleanImage(good), good);
  assert.strictEqual(cleanImage('javascript:alert(1)'), null);
  assert.strictEqual(cleanImage('data:text/html;base64,AAAA'), null);
  assert.strictEqual(cleanImage('data:image/jpeg;base64,AAA<script>'), null);
  assert.strictEqual(cleanImage('data:image/png;base64,' + 'A'.repeat(MAX_IMAGE_LEN)), null, 'oversized image must be rejected');
  assert.strictEqual(cleanImage(12345), null);
});

check('inspectOptionalImage tells absent / ok / invalid apart', () => {
  assert.deepStrictEqual(inspectOptionalImage(undefined), { state: 'absent', value: null });
  assert.deepStrictEqual(inspectOptionalImage(''), { state: 'absent', value: null });
  const good = 'data:image/webp;base64,UklGRg==';
  assert.deepStrictEqual(inspectOptionalImage(good), { state: 'ok', value: good });
  assert.strictEqual(inspectOptionalImage('not-an-image').state, 'invalid');
});

check('cleanInt and cleanDate keep DB columns safe', () => {
  assert.strictEqual(cleanInt('5'), 5);
  assert.strictEqual(cleanInt('abc', 7), 7);
  assert.strictEqual(cleanInt(undefined), 0);
  assert.strictEqual(cleanDate('2008-03-15'), '2008-03-15');
  assert.strictEqual(cleanDate('15/03/2008'), null);
  assert.strictEqual(cleanDate(''), null);
});

/* ---- جزء 2ب: السيرفر — فحص نموذج الشكاوى ---- */

check('cleanPhone normalizes Egyptian mobiles and rejects junk', () => {
  assert.strictEqual(cleanPhone('01012345678'), '01012345678');
  assert.strictEqual(cleanPhone('010 1234 5678'), '01012345678'); // مسافات بتتشال
  assert.strictEqual(cleanPhone('010-1234-5678'), '01012345678'); // شرط بتتشال
  assert.strictEqual(cleanPhone('01312345678'), null);  // 013 مش شبكة مصرية
  assert.strictEqual(cleanPhone('0101234567'), null);   // 10 أرقام بس
  assert.strictEqual(cleanPhone('010123456789'), null); // 12 رقم
  assert.strictEqual(cleanPhone('hello'), null);
  assert.strictEqual(cleanPhone(1012345678), null);     // لازم نص مش رقم
});

check('validateComplaint accepts a complete complaint and returns cleaned data', () => {
  const img = 'data:image/jpeg;base64,' + Buffer.from('tiny').toString('base64');
  const r = validateComplaint({
    type: COMPLAINT_TYPES[0], name: '  أحمد محمد علي  ',
    phone: '010 1234 5678', details: 'التفاصيل الكاملة للمشكلة اللي واجهتني',
    images: [img],
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.data.name, 'أحمد محمد علي', 'name must be trimmed');
  assert.strictEqual(r.data.phone, '01012345678', 'phone must be normalized');
  assert.strictEqual(r.data.images.length, 1);
  assert.strictEqual(validateComplaint({ type: COMPLAINT_TYPES[0], name: 'أحمد محمد علي', phone: '01012345678', details: 'تفاصيل كافية بدون صور' }).ok, true, 'images are optional');
});

check('validateComplaint rejects every invalid piece of input', () => {
  const base = { type: COMPLAINT_TYPES[1], name: 'أحمد محمد علي', phone: '01012345678', details: 'تفاصيل كافية جدًا للشكوى', images: [] };
  assert.strictEqual(validateComplaint(null).ok, false);
  assert.strictEqual(validateComplaint('string').ok, false);
  assert.strictEqual(validateComplaint({ ...base, type: 'نوع مش موجود في القائمة' }).ok, false, 'unknown type must fail');
  assert.strictEqual(validateComplaint({ ...base, name: 'اح' }).ok, false, 'too-short name must fail');
  assert.strictEqual(validateComplaint({ ...base, phone: '01312345678' }).ok, false, 'bad phone must fail');
  assert.strictEqual(validateComplaint({ ...base, details: 'قصير' }).ok, false, 'too-short details must fail');
  const img = 'data:image/jpeg;base64,' + Buffer.from('tiny').toString('base64');
  assert.strictEqual(validateComplaint({ ...base, images: Array(6).fill(img) }).ok, false, '6 images must fail (max 5)');
  assert.strictEqual(validateComplaint({ ...base, images: ['not-an-image'] }).ok, false, 'invalid image must fail');
  assert.strictEqual(validateComplaint({ ...base, images: 'not-an-array' }).ok, false, 'non-array images must fail');
  assert.strictEqual(validateComplaint({ ...base, website: 'http://spam.example' }).ok, false, 'filled honeypot must fail (bot)');
});

/* ---- جزء 3: السيرفر — api/_auth.js ---- */
const auth = require(path.join(ROOT, 'api', '_auth.js'));

check('isAuthorized fails closed when ADMIN_PASSWORD is not configured', () => {
  const saved = process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_PASSWORD;
  try {
    assert.strictEqual(auth.isAuthorized({ headers: { 'x-admin-password': 'anything' } }), false);
  } finally {
    process.env.ADMIN_PASSWORD = saved;
  }
});

check('isAuthorized accepts the right password, rejects wrong/short/missing ones', () => {
  const saved = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = 'test-secret-123';
  try {
    assert.strictEqual(auth.isAuthorized({ headers: { 'x-admin-password': 'test-secret-123' } }), true);
    assert.strictEqual(auth.isAuthorized({ headers: { 'x-admin-password': 'test-secret-124' } }), false);
    assert.strictEqual(auth.isAuthorized({ headers: { 'x-admin-password': 'test' } }), false, 'different length must fail');
    assert.strictEqual(auth.isAuthorized({ headers: {} }), false, 'missing header must fail');
  } finally {
    process.env.ADMIN_PASSWORD = saved;
  }
});

console.log('\n' + passed + ' checks passed.');
