/* ============================================================
   tests/layout.test.js — فحص سريع للتنسيقات (CSS)
   ------------------------------------------------------------
   - يتأكد إن أقواس css/style.css مقفولة وكل declaration سليم.
   - بيستخرج الـ CSS اللي admin.js بيحقنه فعلًا (injectAdminStyles)
     ويفحصه هو كمان — لأن تنسيقات اللوحة كلها جوه string في الجافاسكريبت،
     يعني أي غلطة فيها مش بتبان غير على الشاشة.
   - ويتأكد إن قواعد إصلاح الصور وتنظيم الموبايل موجودة.

   طريقة التشغيل:  node tests/layout.test.js
============================================================ */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = process.argv[2] || path.join(__dirname, '..');
let problems = 0;

function stripComments(css) {
  let out = '', i = 0, inStr = null, inComment = false;
  while (i < css.length) {
    const c = css[i], n = css[i + 1];
    if (inComment) { if (c === '*' && n === '/') { inComment = false; i += 2; continue; } i++; continue; }
    if (inStr) { out += c; if (c === '\\') { out += n; i += 2; continue; } if (c === inStr) inStr = null; i++; continue; }
    if (c === '/' && n === '*') { inComment = true; i += 2; continue; }
    if (c === '"' || c === "'") { inStr = c; out += c; i++; continue; }
    out += c; i++;
  }
  if (inComment) { console.log('  FAIL  unclosed comment'); problems++; }
  if (inStr) { console.log('  FAIL  unterminated string'); problems++; }
  return out;
}

function validateCss(name, raw) {
  const css = stripComments(raw);
  const open = (css.match(/\{/g) || []).length, close = (css.match(/\}/g) || []).length;
  if (open !== close) { console.log(`  FAIL  ${name}: { ${open} vs } ${close}`); problems++; }
  else console.log(`  PASS  ${name}: braces balanced (${open} blocks)`);

  const leafRe = /\{([^{}]*)\}/g;
  let m, bad = 0, decls = 0;
  while ((m = leafRe.exec(css))) {
    const body = m[1];
    if (/@(keyframes|media|supports|font-face)/.test(body)) continue;
    body.split(';').forEach(part => {
      const d = part.trim();
      if (!d) return;
      decls++;
      if (!/^(-{0,2}[a-zA-Z][\w-]*)\s*:\s*\S/.test(d)) {
        if (bad < 5) console.log(`  FAIL  ${name}: bad declaration -> "${d.slice(0, 70)}"`);
        bad++;
      }
    });
  }
  if (bad) { problems++; console.log(`  FAIL  ${name}: ${bad} bad declaration(s) of ${decls}`); }
  else console.log(`  PASS  ${name}: ${decls} declarations well formed`);
  return css;
}

const siteCss = validateCss('css/style.css', fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8'));

// ---- استخراج الـ CSS المولّد من admin.js وتشغيله فعليًا ----
const el = () => ({ style: {}, dataset: {}, className: '', textContent: '', innerHTML: '', children: [],
  appendChild(c) { this.children.push(c); }, querySelector() { return null; }, addEventListener() {} });
const sandbox = {
  console, setTimeout: () => 0, setInterval: () => 0,
  sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: { hash: '' },
  document: { head: el(), createElement: el, getElementById: () => null, querySelectorAll: () => [], addEventListener() {}, body: { style: {} } },
  window: { addEventListener() {}, location: { hash: '' } },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
};
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'admin.js'), 'utf8'), sandbox, { filename: 'admin.js' });
sandbox.injectAdminStyles();
const injected = sandbox.document.head.children.map(c => c.textContent).join('\n');
if (!injected.includes('.adm-tabs')) { console.log('  FAIL  admin CSS not captured'); problems++; }
validateCss('admin.js injected CSS', injected);

// ---- تأكيد إن قواعد الإصلاح الأساسية موجودة ----
const mustHave = [
  ['.teacher-photo-img {', 'photo rule'],
  ['.teacher-row-photo.has-photo .teacher-photo-img { opacity:1; }', 'photo shown via opacity'],
  ['.principal-portrait-area.has-photo .principal-photo-img { opacity:1; }', 'principal photo shown via opacity'],
  ['.t-modal-avatar.has-photo .t-modal-avatar-img { opacity:1; }', 'avatar photo shown via opacity'],
  ['.s-dob {', 'student dob class'],
  ['.teacher-row-photo { min-height:0; aspect-ratio:4/3; }', 'mobile poster photo'],
  ['.students-grid { grid-template-columns:1fr; gap:1rem; }', 'mobile students column'],
  ['--shc:      0,0,0;', 'shadow color variable (dark default)'],
  ['--shc:96,74,36', 'warm shadows in light mode'],
  ['html.light-mode #navbar {', 'light-mode navbar'],
  ['html.light-mode .hero-bg-gradient {', 'light-mode hero veil'],
  ['html.light-mode .home-card {', 'light-mode explore cards'],
  ['html.light-mode .bnav-svg path {', 'light-mode bottom nav'],
  ['html.light-mode .stat-label { color:var(--text-muted); }', 'light-mode stat labels stay readable'],
  ['.support-card {', 'complaint modal card'],
  ['.support-previews {', 'complaint photo previews'],
  ['.support-hp {', 'complaint honeypot hidden off-screen'],
  ['html.light-mode .support-modal {', 'light-mode complaint overlay'],
  ['html.light-mode .btn-gold,', 'light-mode dark ink on gold buttons'],
  ['html.light-mode .mmenu-item { color:var(--text-dim); }', 'light-mode mobile menu items readable'],
  ['html.light-mode .nav-links a { color:var(--text-dim); }', 'light-mode nav links readable'],
  ['html.light-mode .filter-tab { color:var(--text-dim); }', 'light-mode filter tabs readable'],
  ['html.light-mode .photo-card::after { color:#fff; }', 'photo captions stay light over dark gradient'],
  ['html.light-mode .support-err {', 'light-mode complaint error readable'],
  ['html.light-mode .mmenu-school-btn {', 'light-mode ministry button readable'],
];
mustHave.forEach(([needle, label]) => {
  if (siteCss.includes(needle)) console.log(`  PASS  css has ${label}`);
  else { console.log(`  FAIL  css missing ${label}: ${needle}`); problems++; }
});

// كل backdrop-filter لازم يكون ليه توأم ببادئة -webkit- (Samsung Internet والإصدارات الأقدم)
const bfAll = (siteCss.match(/backdrop-filter:/g) || []).length;
const bfWebkit = (siteCss.match(/-webkit-backdrop-filter:/g) || []).length;
if (bfAll === bfWebkit * 2) console.log('  PASS  every backdrop-filter has a -webkit- twin');
else { console.log(`  FAIL  backdrop-filter twins: ${bfWebkit} prefixed of ${bfAll} total`); problems++; }
if (/\.teacher-photo-img\s*\{[^}]*display\s*:\s*none/.test(siteCss)) { console.log('  FAIL  .teacher-photo-img still uses display:none'); problems++; }
else console.log('  PASS  no display:none on .teacher-photo-img');

// مودال القصة القديم (سلايدات متتابعة + زر واتساب) اتشال نهائي — أي بقايا منه تعتبر رجوع للوراء
['support-btn-whatsapp', 'support-progress-fill', 'support-slide', 'support-stage', 'no-motion'].forEach(gone => {
  if (siteCss.includes(gone)) { console.log(`  FAIL  leftover from the old story modal in css: ${gone}`); problems++; }
  else console.log(`  PASS  no ${gone} in css`);
});

[['.adm-grid { grid-template-columns:1fr;', 'admin single-column cards'],
 ['.adm-tabs { display:grid;', 'admin tabs grid'],
 ['.adm-form-actions {', 'admin sticky actions'],
 ['.adm-card-actions .adm-btn { flex:0 0 auto; width:44px;', 'admin 44px touch buttons'],
 ['.cmp-card {', 'admin complaint cards'],
 ['.cmp-viewer {', 'admin complaint image viewer'],
  ['--text:#e8e4dc;', 'admin pins dark palette (unaffected by light mode)']]
.forEach(([needle, label]) => {
  if (injected.includes(needle)) console.log(`  PASS  admin css has ${label}`);
  else { console.log(`  FAIL  admin css missing ${label}`); problems++; }
});

// ---- فحوصات SEO / PWA / التحميل الكسول للوحة الأدمن ----
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const siteJs = fs.readFileSync(path.join(ROOT, 'js', 'site.js'), 'utf8');
[
  ['rel="manifest"', 'PWA manifest linked'],
  ['property="og:image"', 'og:image (معاينة واتساب/فيسبوك)'],
  ['rel="canonical"', 'canonical URL'],
  ['name="twitter:card" content="summary_large_image"', 'twitter large card'],
].forEach(([needle, label]) => {
  if (indexHtml.includes(needle)) console.log(`  PASS  index.html has ${label}`);
  else { console.log(`  FAIL  index.html missing ${label}`); problems++; }
});
// admin.js (~44KB) ميتنزّلش مع كل زائر — بيتحمّل كسولًا من site.js عند #/admin بس
if (indexHtml.includes('src="js/admin.js"')) { console.log('  FAIL  admin.js still eagerly loaded in index.html'); problems++; }
else console.log('  PASS  admin.js not in index.html (lazy-loaded)');
if (siteJs.includes("s.src = 'js/admin.js'") && siteJs.includes("navigator.serviceWorker.register('/sw.js')")) console.log('  PASS  site.js lazy-loads admin.js and registers the service worker');
else { console.log('  FAIL  site.js missing lazy admin loader or SW registration'); problems++; }
try {
  JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  console.log('  PASS  manifest.webmanifest is valid JSON');
} catch (e) { console.log('  FAIL  manifest.webmanifest invalid JSON'); problems++; }
['robots.txt', 'sitemap.xml', 'sw.js'].forEach(f => {
  if (fs.existsSync(path.join(ROOT, f))) console.log(`  PASS  ${f} exists`);
  else { console.log(`  FAIL  ${f} missing`); problems++; }
});

console.log(problems ? `\n${problems} problem(s) found.` : '\nAll CSS/layout checks passed.');
process.exit(problems ? 1 : 0);
