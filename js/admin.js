/* ============================================================
   ADMIN PANEL — لوحة تحكم مخفية، بتتفعّل بس لو الرابط فيه #/admin
   مفيش أي زرار أو لينك للوحة دي في الموقع العادي.
============================================================ */

// قراءة sessionStorage جوه try/catch: بعض المتصفحات (وضع التصفح الخاص، بعض
// إعدادات الخصوصية) بترفض الوصول للتخزين وترمي Error فورًا. لو حصل كده من
// غير الحماية دي، سكربت الأدمن كله كان هيقف من أول سطر ومكانش هيشتغل خالص.
let storedAdminPass = null;
try { storedAdminPass = sessionStorage.getItem('adminPass'); } catch (e) { /* التخزين مش متاح، هنطلب كلمة السر كل مرة */ }
const ADMIN = { pass: storedAdminPass || null };
window.addEventListener('hashchange', checkAdminRoute);

function checkAdminRoute() {
  const root = document.getElementById('adminRoot');
  const path = location.hash.replace(/^#\/?/, '');
  if (path === 'admin' || path.startsWith('admin/')) {
    root.style.display = 'block';
    document.body.style.overflow = 'hidden';
    renderAdmin();
  } else {
    root.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function adminFetch(url, opts = {}) {
  opts.headers = Object.assign(
    { 'Content-Type': 'application/json', 'x-admin-password': ADMIN.pass || '' },
    opts.headers || {}
  );
  return fetch(url, opts);
}

/* ============================================================
   ICONS — SVG بسيطة بأسلوب الموقع (stroke, currentColor)
============================================================ */
const ADM_ICON = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  school: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5"/></svg>`,
};

/* ============================================================
   OUTPUT ENCODING — نفس قاعدة الموقع العام (site.js):
   أي قيمة من قاعدة البيانات بتتطبع في HTML لازم تتعقّم الأول.
   اللوحة بتعرض بيانات المدرسين/الطلاب/الصور خام — من غير ده
   أي نص فيه < أو " كان هيكسر اللوحة نفسها.
============================================================ */
function admEsc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
function admImgSrc(u) {
  if (typeof u !== 'string') return '';
  const s = u.trim();
  return /^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(s) ? s : '';
}

// لو السيرفر رد 401 يبقى كلمة السر المحفوظة مبقتش شغالة (اتغيرت من
// إعدادات Vercel مثلًا) — نرجع لشاشة الدخول فورًا بدل ما اللوحة تعرض
// "مفيش عناصر" وتدوّخ اللي قاعد.
function forceAdminLogout() {
  try { sessionStorage.removeItem('adminPass'); } catch (e) {}
  ADMIN.pass = null;
  renderAdminLogin();
}

/* ============================================================
   STYLE — تنسيقات لوحة الأدمن، محطوطة مرة واحدة جوه <head>
============================================================ */
function injectAdminStyles() {
  if (document.getElementById('adminStyles')) return;
  const s = document.createElement('style');
  s.id = 'adminStyles';
  s.textContent = `
  #adminRoot * { box-sizing: border-box; }
  #adminRoot {
    font-family:'Cairo',sans-serif;
    -webkit-overflow-scrolling:touch;   /* smooth kinetic scrolling on iOS */
    overscroll-behavior:contain;        /* the page behind must not scroll along */
  }
  .adm-shell { max-width:1080px; margin:0 auto; padding:calc(1.6rem + env(safe-area-inset-top)) 1.2rem 6rem; }
  .adm-topbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1.6rem; flex-wrap:wrap; padding-bottom:1.2rem; border-bottom:1px solid var(--border2); }
  .adm-brand { display:flex; align-items:center; gap:0.7rem; }
  .adm-brand-icon { width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg,var(--gold),var(--gold2)); display:flex; align-items:center; justify-content:center; color:#07090f; flex-shrink:0; }
  .adm-brand-icon svg { width:22px; height:22px; }
  .adm-title { font-family:'Tajawal',sans-serif; font-weight:900; color:var(--gold2); font-size:1.25rem; margin:0; line-height:1.2; }
  .adm-subtitle { font-size:0.78rem; color:var(--text-muted,#9a9488); margin:0.15rem 0 0; }
  .adm-btn { display:inline-flex; align-items:center; gap:0.4rem; border:none; cursor:pointer; font-family:'Cairo',sans-serif; font-weight:700; border-radius:9px; padding:0.6rem 1.1rem; font-size:0.88rem; transition:transform .15s,opacity .15s; }
  .adm-btn:active { transform:scale(0.97); }
  .adm-btn svg { width:16px; height:16px; flex-shrink:0; }  .adm-btn-gold { background:linear-gradient(135deg,var(--gold),var(--gold2)); color:#07090f; }
  .adm-btn-gold:hover { opacity:0.92; }
  .adm-btn-ghost { background:var(--surface2); color:var(--text); border:1px solid var(--border2); }
  .adm-btn-ghost:hover { background:var(--surface); }
  .adm-btn-danger { background:rgba(139,26,26,0.55); color:#fff; }
  .adm-btn-danger:hover { background:rgba(176,42,42,0.7); }
  .adm-btn-icon { padding:0.5rem; }

  .adm-tabs { display:flex; gap:0.4rem; background:var(--surface); border:1px solid var(--border2); border-radius:11px; padding:0.3rem; margin-bottom:1.2rem; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .adm-tabs::-webkit-scrollbar { display:none; }
  .adm-tab { flex:0 0 auto; text-align:center; padding:0.6rem 1rem; border-radius:8px; border:none; cursor:pointer; font-family:'Cairo',sans-serif; font-weight:700; font-size:0.86rem; background:transparent; color:var(--text-muted,#9a9488); transition:all .15s; min-height:40px; white-space:nowrap; }
  .adm-tab.active { background:var(--gold); color:#07090f; }
  .adm-tab:not(.active):hover { color:var(--text); background:var(--surface2); }

  .adm-toolbar { display:flex; gap:0.7rem; margin-bottom:1.3rem; flex-wrap:wrap; align-items:center; }
  .adm-search { position:relative; flex:1; min-width:200px; }
  .adm-search svg { position:absolute; top:50%; right:0.85rem; transform:translateY(-50%); width:17px; height:17px; color:var(--text-muted,#9a9488); pointer-events:none; }
  .adm-search input { width:100%; padding:0.65rem 2.5rem 0.65rem 1rem; border-radius:9px; border:1px solid var(--border2); background:var(--bg2); color:var(--text); font-family:'Cairo',sans-serif; font-size:0.9rem; }
  .adm-search input:focus { outline:none; border-color:var(--gold); }
  .adm-count { font-size:0.78rem; color:var(--text-muted,#9a9488); white-space:nowrap; }

  .adm-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:0.9rem; }
  .adm-card { background:var(--surface); border:1px solid var(--border2); border-radius:13px; padding:0.9rem; display:flex; flex-direction:column; gap:0.7rem; transition:border-color .15s,transform .15s; }
  .adm-card:hover { border-color:var(--border); transform:translateY(-2px); }
  .adm-card-top { display:flex; align-items:center; gap:0.7rem; }
  .adm-thumb { width:52px; height:52px; border-radius:10px; background:var(--bg2); flex-shrink:0; overflow:hidden; display:flex; align-items:center; justify-content:center; color:var(--gold); font-weight:900; font-size:1.1rem; border:1px solid var(--border2); }
  .adm-thumb img { width:100%; height:100%; object-fit:cover; }
  .adm-card-text { flex:1; min-width:0; }
  .adm-card-name { font-weight:800; font-size:0.95rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .adm-card-sub { font-size:0.78rem; color:var(--text-muted,#9a9488); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:0.1rem; }
  .adm-card-actions { display:flex; gap:0.5rem; }
  .adm-card-actions .adm-btn { flex:1; justify-content:center; font-size:0.8rem; padding:0.5rem; }

  .adm-empty { text-align:center; padding:3rem 1rem; color:var(--text-muted,#9a9488); }
  .adm-empty svg { width:40px; height:40px; margin-bottom:0.8rem; opacity:0.5; }

  .adm-login-wrap { max-width:380px; margin:3.5rem auto 0; }
  .adm-login-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:2rem 1.7rem; text-align:center; }
  .adm-login-icon { width:52px; height:52px; border-radius:50%; background:var(--gold-dim); display:flex; align-items:center; justify-content:center; color:var(--gold); margin:0 auto 1rem; }
  .adm-login-icon svg { width:24px; height:24px; }
  .adm-field { margin-bottom:0.9rem; text-align:right; }
  .adm-field label { display:block; margin-bottom:0.35rem; font-size:0.82rem; color:var(--text-muted,#9a9488); font-weight:600; }
  .adm-field input, .adm-field select, .adm-field textarea {
    width:100%; padding:0.65rem 0.85rem; border-radius:9px; border:1px solid var(--border2);
    background:var(--bg2); color:var(--text); font-family:'Cairo',sans-serif; font-size:0.9rem;
  }
  .adm-field input:focus, .adm-field select:focus, .adm-field textarea:focus { outline:none; border-color:var(--gold); }
  .adm-err { color:#e88; font-size:0.83rem; margin-top:0.8rem; background:rgba(139,26,26,0.15); border:1px solid rgba(139,26,26,0.4); padding:0.55rem 0.8rem; border-radius:8px; display:none; }

  .adm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:5; display:flex; align-items:flex-start; justify-content:center; padding:2.2rem 1rem; overflow:auto; backdrop-filter:blur(2px); }
  .adm-modal { background:var(--bg2); border:1px solid var(--border); border-radius:16px; padding:1.6rem; max-width:480px; width:100%; }
  .adm-modal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.2rem; }
  .adm-modal-head h3 { margin:0; color:var(--gold2); font-family:'Tajawal',sans-serif; font-weight:800; font-size:1.05rem; }
  .adm-modal-close { background:var(--surface2); border:none; color:var(--text); width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .adm-modal-close svg { width:14px; height:14px; }

  .adm-img-drop { border:1.5px dashed var(--border2); border-radius:10px; padding:0.9rem; display:flex; align-items:center; gap:0.7rem; transition:border-color .15s,background .15s; }
  .adm-img-pickbtn { display:flex; align-items:center; gap:0.5rem; background:var(--surface2); border:1px solid var(--border2); color:var(--text); border-radius:9px; padding:0.65rem 1rem; font-family:'Cairo',sans-serif; font-weight:700; font-size:0.85rem; cursor:pointer; min-height:44px; white-space:nowrap; }
  .adm-img-pickbtn:active { transform:scale(0.97); }
  .adm-img-pickbtn svg { width:18px; height:18px; color:var(--gold); flex-shrink:0; }
  .adm-img-drop input[type=file] { display:none; }
  .adm-img-preview { display:flex; align-items:center; gap:0.7rem; margin-top:0.6rem; }
  .adm-img-preview img { width:56px; height:56px; object-fit:cover; border-radius:8px; border:1px solid var(--border2); }

  .adm-form-actions { display:flex; gap:0.6rem; margin-top:0.4rem; }
  .adm-form-actions .adm-btn { flex:1; justify-content:center; padding:0.75rem; }

  .adm-toast { position:fixed; bottom:calc(1.4rem + env(safe-area-inset-bottom)); left:50%; transform:translateX(-50%) translateY(0); background:var(--surface2); border:1px solid var(--border); color:var(--text); padding:0.7rem 1.3rem; border-radius:10px; font-size:0.85rem; z-index:10; display:flex; align-items:center; gap:0.5rem; box-shadow:0 8px 24px rgba(0,0,0,0.4); max-width:calc(100% - 2rem); }
  .adm-toast.success { border-color:rgba(76,175,80,0.5); }
  .adm-toast.success svg { color:#7ed08a; width:16px; height:16px; }
  .adm-toast.error { border-color:rgba(200,60,60,0.6); }
  .adm-toast.error svg { color:#e88; width:16px; height:16px; }

  /* ===== شاشات واسعة: التابات بتملأ الصف بالتساوي ===== */
  @media (min-width:641px) {
    .adm-tab { flex:1 1 0; min-width:110px; }
  }

  /* ===== موبايل: شيت كامل الشاشة من تحت، أزرار وحقول أكبر للمس ===== */
  @media (max-width:640px) {
    .adm-shell { padding:calc(1rem + env(safe-area-inset-top)) 0.85rem 5.5rem; }
    .adm-topbar { margin-bottom:1.1rem; padding-bottom:0.9rem; }
    .adm-title { font-size:1.05rem; }
    .adm-subtitle { font-size:0.72rem; }
    .adm-brand-icon { width:36px; height:36px; }

    /* التابات: 3 أعمدة متساوية بتملأ الصف — من غير سكرول أفقي */
    .adm-tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:0.3rem; }
    .adm-tab { padding:0.6rem 0.2rem; font-size:0.74rem; min-height:42px; white-space:normal; line-height:1.35; }

    .adm-toolbar { gap:0.55rem; }
    .adm-search { min-width:100%; order:1; }
    .adm-count { order:2; margin-inline-start:auto; }
    #admAddBtn { order:3; flex:0 0 auto; }

    /* الكروت على الموبايل: صف واحد لكل عنصر — اسم مقروء + أزرار أيقونية كبيرة
       ينفع تتلمس، بدل عمودين مزنوقين والنص بيتقطع فيهم */
    .adm-grid { grid-template-columns:1fr; gap:0.6rem; }
    .adm-card { flex-direction:row; align-items:center; gap:0.65rem; padding:0.65rem 0.7rem; border-radius:12px; }
    .adm-card:hover { transform:none; }
    .adm-card-top { flex:1; min-width:0; gap:0.65rem; }
    .adm-thumb { width:46px; height:46px; border-radius:9px; }
    .adm-card-name { font-size:0.88rem; }
    .adm-card-sub { font-size:0.72rem; }
    .adm-card-actions { flex:0 0 auto; gap:0.4rem; }
    .adm-card-actions .adm-btn { flex:0 0 auto; width:44px; height:44px; padding:0; justify-content:center; }
    .adm-card-actions .adm-btn span { display:none; }
    .adm-empty { padding:2.2rem 1rem; }

    /* الفورم بيبقى شيت ثابت من تحت الشاشة، مش نافذة عايمة في النص */
    .adm-overlay { align-items:flex-end; padding:0; }
    .adm-modal {
      position:relative;
      max-width:100%; width:100%; border-radius:18px 18px 0 0;
      max-height:92vh; max-height:92dvh;
      display:flex; flex-direction:column; padding:0;
      animation:admSheetUp .22s ease-out;
    }
    @keyframes admSheetUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
    .adm-modal-head { padding:1.1rem 1.2rem 0.8rem; margin-bottom:0; border-bottom:1px solid var(--border2); flex-shrink:0; }
    .adm-modal-head::before {
      content:''; position:absolute; top:0.5rem; left:50%; transform:translateX(-50%);
      width:40px; height:4px; border-radius:3px; background:var(--border2);
    }
    /* الحقول هي اللي بتسكرول داخل الشيت، وأزرار الحفظ/الإلغاء بتفضل ملزوقة
       تحت الشاشة دايمًا مهما كان طول الفورم */
    #admForm { flex:1; overflow-y:auto; padding:1.1rem 1.2rem 0; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; }
    .adm-form-actions {
      position:sticky; bottom:0; margin:1.1rem -1.2rem 0;
      padding:0.9rem 1.2rem calc(0.9rem + env(safe-area-inset-bottom));
      background:var(--bg2); border-top:1px solid var(--border2);
    }
    #admFormErr { margin:0.8rem -1.2rem 0; }

    .adm-search input { font-size:1rem; }
    .adm-field input, .adm-field select, .adm-field textarea { font-size:1rem; padding:0.75rem 0.9rem; }
    .adm-btn { min-height:44px; }
    .adm-img-pickbtn { min-height:48px; flex:1; justify-content:center; }
    .adm-img-preview img { width:64px; height:64px; }

    .adm-login-wrap { margin:1.5rem auto 0; }
    .adm-login-card { padding:1.6rem 1.2rem; border-radius:14px; }
  }
  `;
  document.head.appendChild(s);
}

function admToast(msg, ok = true) {
  const old = document.querySelector('.adm-toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'adm-toast ' + (ok ? 'success' : 'error');
  t.innerHTML = `${ok ? ADM_ICON.check : ADM_ICON.close}<span>${admEsc(msg)}</span>`;
  document.getElementById('adminRoot').appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function adminShell(inner) {
  return `
  <div class="adm-shell">
    <div class="adm-topbar">
      <div class="adm-brand">
        <div class="adm-brand-icon">${ADM_ICON.school}</div>
        <div>
          <h1 class="adm-title">لوحة تحكم المدرسة</h1>
          <p class="adm-subtitle">مدرسة شهيد حسن حمدي الثانوية</p>
        </div>
      </div>
      ${ADMIN.pass ? `<button id="admLogout" class="adm-btn adm-btn-ghost">${ADM_ICON.logout}<span>خروج</span></button>` : ''}
    </div>
    ${inner}
  </div>`;
}

function renderAdmin() {
  injectAdminStyles();
  if (!ADMIN.pass) renderAdminLogin();
  else renderAdminDashboard('teachers');
}

function renderAdminLogin() {
  const root = document.getElementById('adminRoot');
  root.innerHTML = adminShell(`
    <div class="adm-login-wrap">
      <div class="adm-login-card">
        <div class="adm-login-icon">${ADM_ICON.lock}</div>
        <h2 style="margin:0 0 0.3rem;font-family:'Tajawal',sans-serif;color:var(--text);font-weight:800;">تسجيل الدخول</h2>
        <p style="margin:0 0 1.3rem;color:var(--text-muted,#9a9488);font-size:0.85rem;">أدخل كلمة سر الأدمن للمتابعة</p>
        <div class="adm-field" style="text-align:center;">
          <input id="admPassInput" type="password" placeholder="كلمة السر" autofocus>
        </div>
        <button id="admLoginBtn" class="adm-btn adm-btn-gold" style="width:100%;justify-content:center;padding:0.75rem;">دخول</button>
        <p id="admLoginErr" class="adm-err"></p>
      </div>
    </div>
  `);
  const doLogin = async () => {
    const pass = document.getElementById('admPassInput').value;
    const errEl = document.getElementById('admLoginErr');
    errEl.style.display = 'none';
    const btn = document.getElementById('admLoginBtn');
    btn.textContent = '...جاري التحقق'; btn.disabled = true;
    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
      });
      const data = await r.json();
      if (r.ok && data.ok) {
        ADMIN.pass = pass;
        try { sessionStorage.setItem('adminPass', pass); } catch (e) {}
        renderAdminDashboard('teachers');
      } else {
        errEl.textContent = data.error || 'كلمة السر غلط';
        errEl.style.display = 'block';
        btn.textContent = 'دخول'; btn.disabled = false;
      }
    } catch (e) {
      errEl.textContent = 'تعذر الاتصال بالسيرفر. تأكد إن API متظبط.';
      errEl.style.display = 'block';
      btn.textContent = 'دخول'; btn.disabled = false;
    }
  };
  document.getElementById('admLoginBtn').onclick = doLogin;
  document.getElementById('admPassInput').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
}

const ADMIN_SCHEMAS = {
  teachers: {
    label: 'المدرسين', api: '/api/teachers', idField: 'id',
    fields: [
      { key: 'name', label: 'الاسم', type: 'text', required: true },
      { key: 'subject', label: 'المادة', type: 'text' },
      { key: 'spec', label: 'التخصص', type: 'text' },
      { key: 'grade', label: 'المرحلة', type: 'text', default: 'الثانوية' },
      { key: 'cat', label: 'التصنيف (للفلترة)', type: 'select', options: [
          ['برمجة','برمجة'], ['عربي','عربي'], ['رياضة','رياضة'], ['علوم','علوم'],
          ['تاريخ','تاريخ'], ['فلسفة','فلسفة ومنطق'], ['دينية','تربية دينية'],
          ['انجليزي','انجليزي'], ['فرنساوي','فرنساوي'], ['رياضيات','رياضيات'],
          ['جغرافيا','جغرافيا'], ['نفس','علم نفس'], ['اجتماعي','أخصائي اجتماعي'],
          ['تكنولوجيا','تكنولوجيا'], ['عام','عام'],
        ] },
      { key: 'gender', label: 'النوع', type: 'select', options: [['ذ','ذكر'],['أ','أنثى']] },
      { key: 'lang', label: 'لغة العرض', type: 'select', options: [['ar','عربي'],['en','إنجليزي'],['fr','فرنساوي']] },
      { key: 'where', label: 'مكان التدريس', type: 'text', default: 'مدرسة شهيد حسن حمدي الثانوية' },
      { key: 'bio', label: 'نبذة', type: 'textarea' },
      { key: 'sort_order', label: 'ترتيب العرض', type: 'number', default: 0 },
      { key: 'photo_data', label: 'صورة المدرس', type: 'image' },
    ],
    itemTitle: t => t.name, itemSub: t => t.subject || '',
  },
  students: {
    label: 'الطلاب الأوائل', api: '/api/students', idField: 'id',
    fields: [
      { key: 'rank', label: 'الترتيب', type: 'number', required: true },
      { key: 'name', label: 'الاسم', type: 'text', required: true },
      { key: 'grade', label: 'الصف', type: 'text' },
      { key: 'score', label: 'المجموع (مثال: 98.5%)', type: 'text' },
      { key: 'from', label: 'من', type: 'text' },
      { key: 'dob', label: 'تاريخ الميلاد', type: 'date' },
      { key: 'quote', label: 'مقولة الطالب', type: 'textarea' },
      { key: 'photo_data', label: 'صورة الطالب', type: 'image' },
    ],
    itemTitle: s => s.name, itemSub: s => `#${s.rank} — ${s.score || ''}`,
  },
  photos: {
    label: 'صور الذكريات', api: '/api/photos', idField: 'id',
    fields: [
      { key: 'title', label: 'عنوان الصورة', type: 'text' },
      { key: 'sort_order', label: 'ترتيب العرض', type: 'number', default: 0 },
      { key: 'image_data', label: 'الصورة', type: 'image', required: true },
    ],
    itemTitle: p => p.title || '(بدون عنوان)', itemSub: () => '',
  },
};

let admActiveTab = 'teachers';
let admItems = [];
let admSearchQuery = '';

function renderAdminDashboard(tab) {
  admActiveTab = tab;
  admSearchQuery = '';
  const root = document.getElementById('adminRoot');
  const tabs = Object.keys(ADMIN_SCHEMAS).map(k => `
    <button class="adm-tab ${k === tab ? 'active' : ''}" data-tab="${k}">${ADMIN_SCHEMAS[k].label}</button>
  `).join('');
  root.innerHTML = adminShell(`
    <div class="adm-tabs">${tabs}</div>
    <div class="adm-toolbar">
      <div class="adm-search">
        ${ADM_ICON.search}
        <input id="admSearchInput" type="text" placeholder="ابحث بالاسم...">
      </div>
      <span class="adm-count" id="admCount"></span>
      <button id="admAddBtn" class="adm-btn adm-btn-gold">${ADM_ICON.plus}<span>إضافة جديد</span></button>
    </div>
    <div id="admList" class="adm-grid"><p style="color:var(--text-muted,#9a9488);">جاري التحميل...</p></div>
    <div id="admFormWrap"></div>
  `);
  document.querySelectorAll('.adm-tab').forEach(b => b.onclick = () => renderAdminDashboard(b.dataset.tab));
  document.getElementById('admAddBtn').onclick = () => openAdminForm({});
  document.getElementById('admSearchInput').addEventListener('input', (e) => {
    admSearchQuery = e.target.value.trim();
    renderAdminList();
  });
  const logoutBtn = document.getElementById('admLogout');
  if (logoutBtn) logoutBtn.onclick = () => {
    try { sessionStorage.removeItem('adminPass'); } catch (e) {}
    ADMIN.pass = null;
    renderAdminLogin();
  };
  loadAdminList();
}

async function loadAdminList() {
  const schema = ADMIN_SCHEMAS[admActiveTab];
  const listEl = document.getElementById('admList');
  try {
    const r = await adminFetch(schema.api);
    if (r.status === 401) { forceAdminLogout(); return; }
    const data = await r.json();
    admItems = Array.isArray(data) ? data : [];
    renderAdminList();
  } catch (e) {
    listEl.innerHTML = `<p style="color:#e88;grid-column:1/-1;">تعذر تحميل البيانات. تأكد إن الـ API وقاعدة البيانات متظبطين.</p>`;
  }
}

function renderAdminList() {
  const schema = ADMIN_SCHEMAS[admActiveTab];
  const listEl = document.getElementById('admList');
  const countEl = document.getElementById('admCount');
  const q = admSearchQuery.toLowerCase();
  const filtered = q
    ? admItems.filter(item => (schema.itemTitle(item) + ' ' + schema.itemSub(item)).toLowerCase().includes(q))
    : admItems;

  if (countEl) countEl.textContent = `${filtered.length} / ${admItems.length}`;

  if (!admItems.length) {
    listEl.innerHTML = `<div class="adm-empty" style="grid-column:1/-1;">${ADM_ICON.image}<p>مفيش عناصر لسه. دوس "إضافة جديد".</p></div>`;
    return;
  }
  if (!filtered.length) {
    listEl.innerHTML = `<div class="adm-empty" style="grid-column:1/-1;">${ADM_ICON.search}<p>مفيش نتايج للبحث "${admEsc(admSearchQuery)}"</p></div>`;
    return;
  }

  listEl.innerHTML = filtered.map(item => {
    const thumb = admImgSrc(item.photo_data || item.image_data);
    return `
    <div class="adm-card">
      <div class="adm-card-top">
        <div class="adm-thumb">
          ${thumb
            ? `<img src="${thumb}" alt="">`
            : admEsc((schema.itemTitle(item) || '?').trim().slice(0,1))}
        </div>
        <div class="adm-card-text">
          <div class="adm-card-name">${admEsc(schema.itemTitle(item))}</div>
          <div class="adm-card-sub">${admEsc(schema.itemSub(item))}</div>
        </div>
      </div>
      <div class="adm-card-actions">
        <button class="adm-btn adm-btn-ghost admEditBtn" data-id="${item[schema.idField]}">${ADM_ICON.edit}<span>تعديل</span></button>
        <button class="adm-btn adm-btn-danger admDelBtn" data-id="${item[schema.idField]}">${ADM_ICON.trash}<span>حذف</span></button>
      </div>
    </div>`;
  }).join('');

  document.querySelectorAll('.admEditBtn').forEach(b => b.onclick = () => {
    const item = admItems.find(x => String(x[schema.idField]) === b.dataset.id);
    if (item) openAdminForm(item);
  });
  document.querySelectorAll('.admDelBtn').forEach(b => b.onclick = async () => {
    if (!confirm('متأكد إنك عايز تحذف؟')) return;
    try {
      const r = await adminFetch(`${schema.api}?id=${b.dataset.id}`, { method: 'DELETE' });
      if (r.status === 401) { forceAdminLogout(); return; }
      if (!r.ok) { admToast('تعذر الحذف، حاول تاني', false); return; }
      admToast('اتحذف بنجاح');
      loadAdminList();
    } catch (e) {
      admToast('تعذر الاتصال بالسيرفر', false);
    }
  });
}

function fileToResizedBase64(file, maxDim = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
          else { width = Math.round(width * (maxDim / height)); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        // JPEG مبيدعمش الشفافية — لو الأصل PNG شفاف (لوجو مثلًا) الخلفية كانت
        // بتطلع سودا. نملاها أبيض الأول عشان النتيجة تفضل نضيفة.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function openAdminForm(item) {
  const schema = ADMIN_SCHEMAS[admActiveTab];
  const isNew = !item[schema.idField];
  const wrap = document.getElementById('admFormWrap');
  const fieldsHtml = schema.fields.map(f => {
    let val = item[f.key] !== undefined && item[f.key] !== null ? item[f.key] : (f.default !== undefined ? f.default : '');
    // input[type=date] بيفهم YYYY-MM-DD بس — قاعدة البيانات ممكن ترجّع التاريخ
    // بصيغة ISO كاملة (2008-03-15T00:00:00.000Z) فالحقل كان بيفضل فاضي وقت
    // التعديل. نقص أول 10 حروف عشان الصيغتين يظبطوا.
    if (f.type === 'date' && val) val = String(val).slice(0, 10);
    if (f.type === 'textarea') {
      return `<div class="adm-field"><label>${f.label}</label>
        <textarea data-field="${f.key}" rows="3">${admEsc(val)}</textarea></div>`;
    }
    if (f.type === 'select') {
      return `<div class="adm-field"><label>${f.label}</label>
        <select data-field="${f.key}">
          ${f.options.map(([v,l]) => `<option value="${v}" ${v===val?'selected':''}>${l}</option>`).join('')}
        </select></div>`;
    }
    if (f.type === 'image') {
      const cur = admImgSrc(val); // أي قيمة مش data:image سليمة متتعرضش
      return `<div class="adm-field">
        <label>${f.label}${f.required && isNew ? ' *' : ' (اختياري — سيب فاضي لو مش عايز تغيّرها)'}</label>
        <div class="adm-img-drop">
          <button type="button" class="adm-img-pickbtn" id="pickbtn-${f.key}">${ADM_ICON.upload}<span>اختار صورة</span></button>
          <input type="file" accept="image/*" id="imginput-${f.key}" data-field="${f.key}" data-imgfield="1">
          <div class="adm-img-preview" id="preview-${f.key}" style="${cur ? '' : 'display:none;'}margin-top:0;">
            <img src="${cur}" alt="">
            <span style="font-size:0.8rem;color:var(--text-muted,#9a9488);">الصورة الحالية</span>
          </div>
        </div>
      </div>`;
    }
    return `<div class="adm-field"><label>${f.label}</label>
      <input type="${f.type}" data-field="${f.key}" value="${admEsc(val)}"></div>`;
  }).join('');

  wrap.innerHTML = `
    <div class="adm-overlay" id="admFormOverlay">
      <div class="adm-modal">
        <div class="adm-modal-head">
          <h3>${isNew ? 'إضافة' : 'تعديل'} — ${schema.label}</h3>
          <button type="button" class="adm-modal-close" id="admCancelBtn">${ADM_ICON.close}</button>
        </div>
        <form id="admForm">${fieldsHtml}
          <div class="adm-form-actions">
            <button type="submit" class="adm-btn adm-btn-gold">حفظ</button>
            <button type="button" id="admCancelBtn2" class="adm-btn adm-btn-ghost">إلغاء</button>
          </div>
          <p id="admFormErr" class="adm-err"></p>
        </form>
      </div>
    </div>`;

  const closeForm = () => { wrap.innerHTML = ''; };
  document.getElementById('admCancelBtn').onclick = closeForm;
  document.getElementById('admCancelBtn2').onclick = closeForm;
  document.getElementById('admFormOverlay').onclick = (e) => { if (e.target.id === 'admFormOverlay') closeForm(); };

  // زرار "اختار صورة" الحقيقي بيفتح الـ input المخفي — أضمن بكتير من حيلة
  // الـ input الشفاف فوق الزرار، اللي بتبوظ أحيانًا على بعض متصفحات الموبايل.
  schema.fields.filter(f => f.type === 'image').forEach(f => {
    const btn = document.getElementById(`pickbtn-${f.key}`);
    const input = document.getElementById(`imginput-${f.key}`);
    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      if (!input.files || !input.files[0]) return;
      const reader = new FileReader();
      reader.onload = () => {
        const prev = document.getElementById(`preview-${f.key}`);
        prev.style.display = 'flex';
        prev.querySelector('img').src = reader.result;
        prev.querySelector('span').textContent = 'معاينة الصورة الجديدة';
      };
      reader.readAsDataURL(input.files[0]);
    });
  });

  document.getElementById('admForm').onsubmit = async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('admFormErr');
    errEl.style.display = 'none';
    const submitBtn = e.target.querySelector('button[type=submit]');
    const payload = {};
    for (const f of schema.fields) {
      if (f.type === 'image') continue;
      const el = e.target.querySelector(`[data-field="${f.key}"]`);
      const raw = el ? el.value : '';
      // الحقول المطلوبة بتتحقق هنا كمان مش بس في الـ HTML: قيمة فاضية كانت
      // هتتحفظ من غير ما حد ياخد باله وتطلّع كارت فاضي في الموقع.
      if (f.required && !String(raw).trim()) {
        errEl.textContent = `${f.label} مطلوب`;
        errEl.style.display = 'block';
        if (el) el.focus();
        return;
      }
      payload[f.key] = f.type === 'number' ? (parseFloat(raw) || 0) : raw;
    }
    for (const f of schema.fields.filter(x => x.type === 'image')) {
      const fileInput = e.target.querySelector(`[data-imgfield][data-field="${f.key}"]`);
      if (fileInput && fileInput.files && fileInput.files[0]) {
        try { payload[f.key] = await fileToResizedBase64(fileInput.files[0]); }
        catch (err) { errEl.textContent = 'تعذر قراءة الصورة'; errEl.style.display = 'block'; return; }
      } else if (f.required && isNew) {
        errEl.textContent = `${f.label} مطلوبة`; errEl.style.display = 'block'; return;
      }
    }
    submitBtn.textContent = '...جاري الحفظ'; submitBtn.disabled = true;
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? schema.api : `${schema.api}?id=${item[schema.idField]}`;
      const r = await adminFetch(url, { method, body: JSON.stringify(payload) });
      if (r.status === 401) { forceAdminLogout(); return; }
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        errEl.textContent = d.error || 'حصل خطأ، حاول تاني';
        errEl.style.display = 'block';
        submitBtn.textContent = 'حفظ'; submitBtn.disabled = false;
        return;
      }
      closeForm();
      admToast(isNew ? 'اتضاف بنجاح' : 'اتحدّث بنجاح');
      loadAdminList();
    } catch (err) {
      errEl.textContent = 'تعذر الاتصال بالسيرفر';
      errEl.style.display = 'block';
      submitBtn.textContent = 'حفظ'; submitBtn.disabled = false;
    }
  };
}
