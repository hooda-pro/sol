/* ============================================================
   tests/photos.test.js — اختبار لمنطق صور المدرسين (js/site.js)
   ------------------------------------------------------------
   المشكلة الأصلية: صور المدرسين (خصوصًا اللي بترفع من لوحة الأدمن)
   مكانت بتظهر، لأن الـ <img> كان متخفي بـ display:none ومستني
   onload يضيف .has-photo — وده مستحيل يحصل مع loading="lazy".
   الاختبار ده بيحمّل الملف الحقيقي في sandbox ويشغّل الدوال الحقيقية
   (مش نسخة مكررة منها) ويتأكد إن السلوك الجديد صح.

   طريقة التشغيل:  node tests/photos.test.js
============================================================ */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const SITE = process.argv[2] || path.join(__dirname, '..', 'js', 'site.js');
const code = fs.readFileSync(SITE, 'utf8');

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
    addEventListener() {}, querySelectorAll() { return []; },
    getElementById() { return null; }, createElement: makeEl,
  },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }), location: { hash: '' } },
};
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'site.js' });

let passed = 0;
function check(name, fn) { fn(); passed++; console.log('  PASS  ' + name); }

// ---- 1) مدرس بصور مرفوعة من لوحة الأدمن (data URL) ----
check('uploaded (data URL) photo renders active from the first paint', () => {
  const html = sandbox.buildTeacherRow({
    name: 'أ. محمد حنفي', subject: 'لغة إنجليزية', icon: 'م', gender: 'ذ',
    spec: 'لغة إنجليزية', grade: 'الثانوية', where: 'المدرسة', cat: 'انجليزي',
    bio: 'نبذة', photo_data: 'data:image/jpeg;base64,AAAA',
  }).innerHTML;

  assert.ok(/class="teacher-row-photo has-photo"/.test(html), 'container must carry has-photo in the markup');
  assert.ok(html.includes('src="data:image/jpeg;base64,AAAA"'), 'photo src must be rendered');
  const imgTag = html.slice(html.indexOf('<img'), html.indexOf('/>', html.indexOf('<img')) + 2);
  assert.ok(!/loading="lazy"/.test(imgTag), 'a data: URL photo must not wait on lazy loading');
  assert.ok(/onerror="photoFailed\(this\)"/.test(imgTag), 'a broken photo must fall back to the placeholder');
});

// ---- 2) مدرس بملف صورة محلي photos/N.jpg ----
check('numbered local file still falls back through the extensions', () => {
  const html = sandbox.buildTeacherRow({
    name: 'أ. أحمد', subject: 'عربي', icon: 'أ', gender: 'ذ', num: 5,
    spec: 'عربي', grade: 'الثانوية', where: 'المدرسة', bio: 'نبذة',
  }).innerHTML;
  assert.ok(/class="teacher-row-photo"/.test(html), 'no photo yet -> plain placeholder container');
  assert.ok(html.includes('src="photos/5.jpg"'), 'numbered file source');
  assert.ok(html.includes('data-num="5"'));
  assert.ok(/loading="lazy"/.test(html), 'local files stay lazy (they may not exist)');
});

// ---- 3) مدرس من غير أي صورة ----
check('teacher with no photo at all renders no <img>', () => {
  const html = sandbox.buildTeacherRow({
    name: 'أ. س', subject: 'عام', icon: 'س', gender: 'أ',
    spec: 'عام', grade: 'الثانوية', where: 'المدرسة', bio: 'نبذة',
  }).innerHTML;
  assert.ok(!html.includes('<img'), 'no image element expected');
});

// ---- 4) صورة اتكسرت: نرجّع الشكل الافتراضي ----
check('photoFailed() hides the image and restores the placeholder', () => {
  const holder = { classes: ['has-photo'], classList: {
    remove(c) { this.owner.classes = this.owner.classes.filter(x => x !== c); }, owner: null,
  } };
  holder.classList.owner = holder;
  const img = { style: {}, closest: () => holder };
  sandbox.photoFailed(img);
  assert.strictEqual(img.style.display, 'none');
  assert.deepStrictEqual(holder.classes, []);
});

// ---- 5) tryNextPhotoExt: بيدور على الامتدادات ومبيخمّنش اسم ملف لو مفيش رقم ----
check('tryNextPhotoExt walks jpg -> jpeg -> png -> webp then gives up', () => {
  const seq = [];
  const holder = { classList: { remove() { seq.push('removed'); } } };
  const img = { style: {}, dataset: { num: '7', extIdx: '0' }, closest: () => holder };
  sandbox.tryNextPhotoExt(img);
  assert.strictEqual(img.src, 'photos/7.jpeg');
  img.dataset.extIdx = '2';
  sandbox.tryNextPhotoExt(img);
  assert.strictEqual(img.src, 'photos/7.webp');
  sandbox.tryNextPhotoExt(img);
  assert.strictEqual(img.style.display, 'none', 'after the last extension the placeholder returns');
  assert.ok(seq.includes('removed'));

  const noNum = { style: {}, dataset: {}, closest: () => holder };
  sandbox.tryNextPhotoExt(noNum);
  assert.ok(!String(noNum.src || '').includes('undefined'), 'must never request photos/undefined.jpg');
});

// ---- 6) syncPhotoState: صورة خلصت التحميل قبل ما الصف يترسم ----
check('syncPhotoState() reveals an already-decoded image', () => {
  let added = null;
  const container = { classList: { add(c) { added = c; } } };
  sandbox.syncPhotoState({ complete: true, naturalWidth: 900, closest: () => container }, '.teacher-row-photo');
  assert.strictEqual(added, 'has-photo');
  added = null;
  sandbox.syncPhotoState({ complete: false, naturalWidth: 0, closest: () => container }, '.teacher-row-photo');
  assert.strictEqual(added, null, 'a not-yet-loaded image must stay in the placeholder state');
  sandbox.syncPhotoState(null, '.teacher-row-photo'); // must not throw
});

// ---- 7) openTeacherPage: الصورة المرفوعة بتظهر في صفحة معلومات المدرس فورًا ----
// دي بالظبط شكوى المستخدم: "برفع الصورة من الأدمن ومبتظهرش في صفحة المعلومات".
// بنحاكي الـ DOM بالعناصر اللي الدالة بتلمسها فعلًا ونتحقق من النتيجة.
function mockProfileDom() {
  const mkEl = () => {
    const el = { textContent: '', innerHTML: '', alt: '', src: '', style: {}, dataset: {},
      toggled: [], removed: [],
      classList: { toggle(c, on) { el.toggled.push([c, on]); } },
      setAttribute() {}, removeAttribute(k) { el.removed.push(k); } };
    return el;
  };
  const byId = {};
  ['tpLetter','tpInitial','tpName','tpSubject','tpBadge','tpBio','tpBodyPath',
   'tpChips','tpPhotoArea','tpPhotoImg'].forEach(id => { byId[id] = mkEl(); });
  return byId;
}
const TEACHER_WITH_PHOTO = {
  name: 'أ. محمد حنفي', subject: 'لغة إنجليزية', icon: 'م', gender: 'ذ',
  spec: 'لغة إنجليزية', grade: 'الثانوية', where: 'المدرسة', cat: 'انجليزي',
  bio: 'نبذة', photo_data: 'data:image/jpeg;base64,AAAA',
};

check('openTeacherPage shows the uploaded photo on the profile page immediately', () => {
  const byId = mockProfileDom();
  const origGet = sandbox.document.getElementById;
  sandbox.document.getElementById = (id) => byId[id] || null;
  try { sandbox.openTeacherPage(TEACHER_WITH_PHOTO); }
  finally { sandbox.document.getElementById = origGet; }

  const img = byId.tpPhotoImg, area = byId.tpPhotoArea;
  assert.strictEqual(img.src, 'data:image/jpeg;base64,AAAA', 'profile photo must use the uploaded data URL');
  assert.strictEqual(img.alt, 'أ. محمد حنفي');
  assert.ok(img.removed.includes('data-num'), 'no numbered-file fallback when a DB photo exists');
  assert.ok(area.toggled.some(([c, on]) => c === 'has-photo' && on === true),
    'photo area must get has-photo immediately (not after a load event)');
});

// ---- 8) openTeacherPage: قيمة صورة مشبوهة أو ناقصة بتترفض وبيظهر الشكل الافتراضي ----
check('openTeacherPage rejects anything that is not a data:image payload', () => {
  const byId = mockProfileDom();
  const origGet = sandbox.document.getElementById;
  sandbox.document.getElementById = (id) => byId[id] || null;
  try {
    sandbox.openTeacherPage(Object.assign({}, TEACHER_WITH_PHOTO, {
      photo_data: 'https://evil.example/x.png', num: undefined,
    }));
  } finally { sandbox.document.getElementById = origGet; }

  const img = byId.tpPhotoImg, area = byId.tpPhotoArea;
  assert.strictEqual(img.src, '', 'external URL must never reach the <img> src');
  assert.ok(img.removed.includes('src'), 'stale src must be cleared');
  assert.ok(area.toggled.some(([c, on]) => c === 'has-photo' && on === false),
    'placeholder artwork must stay visible');
});

console.log('\n' + passed + ' checks passed.');
