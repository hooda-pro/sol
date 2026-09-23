const ADMIN = { pass: sessionStorage.getItem('adminPass') || null };
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

function adminShell(inner) {
  return `
  <div style="max-width:980px;margin:0 auto;padding:2rem 1.2rem 6rem;font-family:'Cairo',sans-serif;color:var(--text);">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.6rem;flex-wrap:wrap;gap:0.8rem;">
      <h1 style="font-family:'Tajawal',sans-serif;font-weight:900;color:var(--gold);font-size:1.4rem;margin:0;">لوحة تحكم المدرسة</h1>
      ${ADMIN.pass ? `<button id="admLogout" style="background:var(--surface2);color:var(--text);border:1px solid var(--border2);padding:0.5rem 1rem;border-radius:8px;cursor:pointer;">تسجيل خروج</button>` : ''}
    </div>
    ${inner}
  </div>`;
}

function renderAdmin() {
  if (!ADMIN.pass) renderAdminLogin();
  else renderAdminDashboard('teachers');
}

function renderAdminLogin() {
  const root = document.getElementById('adminRoot');
  root.innerHTML = adminShell(`
    <div style="max-width:360px;margin:3rem auto 0;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1.8rem;">
      <p style="margin:0 0 1rem;color:var(--text-muted,#9a9488);">أدخل كلمة سر الأدمن للمتابعة</p>
      <input id="admPassInput" type="password" placeholder="كلمة السر" style="width:100%;box-sizing:border-box;padding:0.7rem 0.9rem;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);margin-bottom:0.9rem;">
      <button id="admLoginBtn" style="width:100%;padding:0.7rem;border-radius:8px;background:var(--gold);color:#07090f;font-weight:800;cursor:pointer;">دخول</button>
      <p id="admLoginErr" style="color:var(--crimson2);font-size:0.85rem;margin-top:0.8rem;display:none;"></p>
    </div>
  `);
  const doLogin = async () => {
    const pass = document.getElementById('admPassInput').value;
    const errEl = document.getElementById('admLoginErr');
    errEl.style.display = 'none';
    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
      });
      const data = await r.json();
      if (r.ok && data.ok) {
        ADMIN.pass = pass;
        sessionStorage.setItem('adminPass', pass);
        renderAdminDashboard('teachers');
      } else {
        errEl.textContent = data.error || 'كلمة السر غلط';
        errEl.style.display = 'block';
      }
    } catch (e) {
      errEl.textContent = 'تعذر الاتصال بالسيرفر. تأكد إن API متظبط.';
      errEl.style.display = 'block';
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
      { key: 'cat', label: 'التصنيف (للفلترة)', type: 'text' },
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
    itemTitle: p => p.title || '(بدون عنوان)', itemSub: p => '',
  },
};

let admActiveTab = 'teachers';
let admItems = [];
let admEditing = null; // null = not editing, {} = new, object = existing item

function renderAdminDashboard(tab) {
  admActiveTab = tab;
  admEditing = null;
  const root = document.getElementById('adminRoot');
  const tabs = Object.keys(ADMIN_SCHEMAS).map(k => `
    <button class="admTabBtn" data-tab="${k}" style="padding:0.55rem 1.1rem;border-radius:8px;border:1px solid var(--border2);cursor:pointer;font-weight:700;
      background:${k===tab?'var(--gold)':'var(--surface)'};color:${k===tab?'#07090f':'var(--text)'};">${ADMIN_SCHEMAS[k].label}</button>
  `).join('');
  root.innerHTML = adminShell(`
    <div style="display:flex;gap:0.6rem;margin-bottom:1.4rem;flex-wrap:wrap;">${tabs}</div>
    <div style="margin-bottom:1rem;">
      <button id="admAddBtn" style="padding:0.6rem 1.2rem;border-radius:8px;background:var(--gold2);color:#07090f;font-weight:800;cursor:pointer;">+ إضافة جديد</button>
    </div>
    <div id="admList" style="display:grid;gap:0.7rem;"><p style="color:var(--text-muted,#9a9488);">جاري التحميل...</p></div>
    <div id="admFormWrap"></div>
  `);
  document.querySelectorAll('.admTabBtn').forEach(b => b.onclick = () => renderAdminDashboard(b.dataset.tab));
  document.getElementById('admAddBtn').onclick = () => openAdminForm({});
  const logoutBtn = document.getElementById('admLogout');
  if (logoutBtn) logoutBtn.onclick = () => { sessionStorage.removeItem('adminPass'); ADMIN.pass = null; renderAdminLogin(); };
  loadAdminList();
}

async function loadAdminList() {
  const schema = ADMIN_SCHEMAS[admActiveTab];
  const listEl = document.getElementById('admList');
  try {
    const r = await adminFetch(schema.api);
    const data = await r.json();
    admItems = Array.isArray(data) ? data : [];
    if (!admItems.length) {
      listEl.innerHTML = `<p style="color:var(--text-muted,#9a9488);">مفيش عناصر لسه. دوس "إضافة جديد".</p>`;
      return;
    }
    listEl.innerHTML = admItems.map(item => `
      <div style="display:flex;align-items:center;gap:0.9rem;background:var(--surface);border:1px solid var(--border2);border-radius:10px;padding:0.7rem 0.9rem;">
        <div style="width:44px;height:44px;border-radius:8px;background:var(--bg2);flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;">
          ${item.photo_data || item.image_data ? `<img src="${item.photo_data || item.image_data}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="color:var(--gold);font-weight:800;">${(schema.itemTitle(item)||'?').trim().slice(0,1)}</span>`}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${schema.itemTitle(item)}</div>
          <div style="font-size:0.8rem;color:var(--text-muted,#9a9488);">${schema.itemSub(item)}</div>
        </div>
        <button class="admEditBtn" data-id="${item[schema.idField]}" style="padding:0.4rem 0.8rem;border-radius:7px;background:var(--surface2);color:var(--text);cursor:pointer;">تعديل</button>
        <button class="admDelBtn" data-id="${item[schema.idField]}" style="padding:0.4rem 0.8rem;border-radius:7px;background:rgba(139,26,26,0.5);color:#fff;cursor:pointer;">حذف</button>
      </div>
    `).join('');
    document.querySelectorAll('.admEditBtn').forEach(b => b.onclick = () => {
      const item = admItems.find(x => String(x[schema.idField]) === b.dataset.id);
      if (item) openAdminForm(item);
    });
    document.querySelectorAll('.admDelBtn').forEach(b => b.onclick = async () => {
      if (!confirm('متأكد إنك عايز تحذف؟')) return;
      await adminFetch(`${schema.api}?id=${b.dataset.id}`, { method: 'DELETE' });
      loadAdminList();
    });
  } catch (e) {
    listEl.innerHTML = `<p style="color:var(--crimson2);">تعذر تحميل البيانات. تأكد إن الـ API وقاعدة البيانات متظبطين.</p>`;
  }
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
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function openAdminForm(item) {
  admEditing = item;
  const schema = ADMIN_SCHEMAS[admActiveTab];
  const isNew = !item[schema.idField];
  const wrap = document.getElementById('admFormWrap');
  const fieldsHtml = schema.fields.map(f => {
    const val = item[f.key] !== undefined && item[f.key] !== null ? item[f.key] : (f.default !== undefined ? f.default : '');
    if (f.type === 'textarea') {
      return `<div style="margin-bottom:0.8rem;"><label style="display:block;margin-bottom:0.3rem;font-size:0.85rem;color:var(--text-muted,#9a9488);">${f.label}</label>
        <textarea data-field="${f.key}" rows="3" style="width:100%;box-sizing:border-box;padding:0.6rem;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);">${val}</textarea></div>`;
    }
    if (f.type === 'select') {
      return `<div style="margin-bottom:0.8rem;"><label style="display:block;margin-bottom:0.3rem;font-size:0.85rem;color:var(--text-muted,#9a9488);">${f.label}</label>
        <select data-field="${f.key}" style="width:100%;box-sizing:border-box;padding:0.6rem;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);">
          ${f.options.map(([v,l]) => `<option value="${v}" ${v===val?'selected':''}>${l}</option>`).join('')}
        </select></div>`;
    }
    if (f.type === 'image') {
      return `<div style="margin-bottom:0.8rem;"><label style="display:block;margin-bottom:0.3rem;font-size:0.85rem;color:var(--text-muted,#9a9488);">${f.label}${f.required && isNew ? ' *' : ' (سيب فاضي لو مش عايز تغيّرها)'}</label>
        <input type="file" accept="image/*" data-field="${f.key}" data-imgfield="1" style="width:100%;color:var(--text);">
        ${val ? `<img src="${val}" style="max-width:120px;max-height:120px;border-radius:8px;margin-top:0.5rem;display:block;">` : ''}
        <input type="hidden" data-field-hidden="${f.key}" value="${val ? '1' : ''}"></div>`;
    }
    return `<div style="margin-bottom:0.8rem;"><label style="display:block;margin-bottom:0.3rem;font-size:0.85rem;color:var(--text-muted,#9a9488);">${f.label}</label>
      <input type="${f.type}" data-field="${f.key}" value="${val}" style="width:100%;box-sizing:border-box;padding:0.6rem;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);"></div>`;
  }).join('');

  wrap.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:2;display:flex;align-items:flex-start;justify-content:center;padding:2rem 1rem;overflow:auto;" id="admFormOverlay">
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:1.5rem;max-width:480px;width:100%;">
        <h3 style="margin:0 0 1rem;color:var(--gold);font-family:'Tajawal',sans-serif;">${isNew ? 'إضافة' : 'تعديل'} — ${schema.label}</h3>
        <form id="admForm">${fieldsHtml}
          <div style="display:flex;gap:0.6rem;margin-top:1rem;">
            <button type="submit" style="flex:1;padding:0.7rem;border-radius:8px;background:var(--gold);color:#07090f;font-weight:800;cursor:pointer;">حفظ</button>
            <button type="button" id="admCancelBtn" style="flex:1;padding:0.7rem;border-radius:8px;background:var(--surface2);color:var(--text);cursor:pointer;">إلغاء</button>
          </div>
          <p id="admFormErr" style="color:var(--crimson2);font-size:0.85rem;margin-top:0.8rem;display:none;"></p>
        </form>
      </div>
    </div>`;

  document.getElementById('admCancelBtn').onclick = () => { wrap.innerHTML = ''; };

  document.getElementById('admForm').onsubmit = async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('admFormErr');
    errEl.style.display = 'none';
    const payload = {};
    for (const f of schema.fields) {
      if (f.type === 'image') continue;
      const el = e.target.querySelector(`[data-field="${f.key}"]`);
      payload[f.key] = f.type === 'number' ? (parseFloat(el.value) || 0) : el.value;
    }
    // Handle image fields: convert selected file to base64 (resized), else leave unset (keeps old on edit)
    for (const f of schema.fields.filter(x => x.type === 'image')) {
      const fileInput = e.target.querySelector(`[data-imgfield][data-field="${f.key}"]`);
      if (fileInput && fileInput.files && fileInput.files[0]) {
        try { payload[f.key] = await fileToResizedBase64(fileInput.files[0]); }
        catch (err) { errEl.textContent = 'تعذر قراءة الصورة'; errEl.style.display = 'block'; return; }
      } else if (f.required && isNew) {
        errEl.textContent = `${f.label} مطلوبة`; errEl.style.display = 'block'; return;
      }
    }
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? schema.api : `${schema.api}?id=${item[schema.idField]}`;
      const r = await adminFetch(url, { method, body: JSON.stringify(payload) });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        errEl.textContent = d.error || 'حصل خطأ، حاول تاني';
        errEl.style.display = 'block';
        return;
      }
      wrap.innerHTML = '';
      loadAdminList();
    } catch (err) {
      errEl.textContent = 'تعذر الاتصال بالسيرفر';
      errEl.style.display = 'block';
    }
  };
}
