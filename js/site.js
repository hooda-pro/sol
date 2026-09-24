/* ============================================================
   DATA
============================================================ */
function calcAge(dob) {
  const now = new Date();
  const d = new Date(dob);
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

// Converts Western digits to Eastern Arabic-Indic digits (٠-٩) to match the
// site's numbering style everywhere else in the Arabic copy.
function toArabicDigits(n) {
  const map = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return String(n).replace(/[0-9]/g, d => map[d]);
}

// Keeps the footer copyright year current automatically instead of it being
// a hardcoded string that quietly goes stale every year.
function updateCopyrightYear() {
  const year = toArabicDigits(new Date().getFullYear());
  document.querySelectorAll('.copyright-year').forEach(el => { el.textContent = year; });
}

/* ============================================================
   TEACHER / PRINCIPAL PHOTOS
   Put real photo files in a "photos" folder next to this HTML
   file. Name each file with the person's number (see the `num`
   field on each teacher below, and the principal = 1), e.g.
   photos/1.jpg, photos/2.jpg ... Any of jpg/jpeg/png/webp works —
   the page tries each extension in turn. If no matching file is
   found, the existing generated initial/avatar graphic is shown
   instead, so nothing breaks before photos are added.
============================================================ */
const PHOTO_EXTS = ['jpg','jpeg','png','webp'];
function tryNextPhotoExt(img) {
  const idx = parseInt(img.dataset.extIdx || '0', 10) + 1;
  if (idx >= PHOTO_EXTS.length) { img.style.display = 'none'; return; }
  img.dataset.extIdx = idx;
  img.src = `photos/${img.dataset.num}.${PHOTO_EXTS[idx]}`;
}
function onPhotoLoad(img, containerSelector) {
  const container = img.closest(containerSelector);
  if (container) container.classList.add('has-photo');
}

const DEFAULT_TEACHERS = [
  {
    name:'أ. محمد الصادق إبراهيم', subject:'لغة عربية',
    num:2,
    spec:'لغة عربية', grade:'الثانوية', icon:'م', cat:'عربي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. محمد الصادق إبراهيم، يقوم بتدريس مادة لغة عربية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. أحمد عبد القادر محمد', subject:'تدريس / مدرس',
    num:3,
    spec:'تدريس / مدرس', grade:'الثانوية', icon:'أ', cat:'عام',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. أحمد عبد القادر محمد، يعمل بالتدريس في مدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. السيد السيد احمد عبد العال', subject:'لغة عربية',
    num:4,
    spec:'لغة عربية', grade:'الثانوية', icon:'ا', cat:'عربي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. السيد السيد احمد عبد العال، يقوم بتدريس مادة لغة عربية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. محمد حنفي محمد محمد', subject:'لغة إنجليزية',
    num:5,
    spec:'لغة إنجليزية', grade:'الثانوية', icon:'م', cat:'انجليزي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. محمد حنفي محمد محمد، يقوم بتدريس مادة لغة إنجليزية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. شاكر عبد العزيز إسماعيل', subject:'لغة إنجليزية',
    num:6,
    spec:'لغة إنجليزية', grade:'الثانوية', icon:'ش', cat:'انجليزي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. شاكر عبد العزيز إسماعيل، يقوم بتدريس مادة لغة إنجليزية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. فاروق اسكندر متنائيل', subject:'لغة إنجليزية',
    num:7,
    spec:'لغة إنجليزية', grade:'الثانوية', icon:'ف', cat:'انجليزي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. فاروق اسكندر متنائيل، يقوم بتدريس مادة لغة إنجليزية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. السيد محمد أحمد علي سخيل', subject:'لغة إنجليزية',
    num:8,
    spec:'لغة إنجليزية', grade:'الثانوية', icon:'ا', cat:'انجليزي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. السيد محمد أحمد علي سخيل، يقوم بتدريس مادة لغة إنجليزية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. إبراهيم عبد اللطيف إبراهيم', subject:'لغة فرنسية',
    num:9,
    spec:'لغة فرنسية', grade:'الثانوية', icon:'إ', cat:'فرنساوي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. إبراهيم عبد اللطيف إبراهيم، يقوم بتدريس مادة لغة فرنسية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. الحسين محمد السيد يوسف', subject:'لغة فرنسية',
    num:10,
    spec:'لغة فرنسية', grade:'الثانوية', icon:'ا', cat:'فرنساوي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. الحسين محمد السيد يوسف، يقوم بتدريس مادة لغة فرنسية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. محمد إبراهيم أحمد', subject:'لغة فرنسية',
    num:11,
    spec:'لغة فرنسية', grade:'الثانوية', icon:'م', cat:'فرنساوي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. محمد إبراهيم أحمد، يقوم بتدريس مادة لغة فرنسية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. محمد موسى أحمد إبراهيم السعداوي', subject:'رياضيات',
    num:12,
    spec:'رياضيات', grade:'الثانوية', icon:'م', cat:'رياضيات',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. محمد موسى أحمد إبراهيم السعداوي، يقوم بتدريس مادة رياضيات بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. عبد المجيد محمد أحمد', subject:'تاريخ',
    num:13,
    spec:'تاريخ', grade:'الثانوية', icon:'ع', cat:'تاريخ',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. عبد المجيد محمد أحمد، يقوم بتدريس مادة تاريخ بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. محمد عبد الله عبد المعطي علاوي', subject:'جغرافيا',
    num:14,
    spec:'جغرافيا', grade:'الثانوية', icon:'م', cat:'جغرافيا',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. محمد عبد الله عبد المعطي علاوي، يقوم بتدريس مادة جغرافيا بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. عادل عوض عبد الملاك', subject:'تربية دينية مسيحية',
    num:15,
    spec:'تربية دينية مسيحية', grade:'الثانوية', icon:'ع', cat:'دينية',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. عادل عوض عبد الملاك، يقوم بتدريس مادة تربية دينية مسيحية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. محمد محمد عبد الحميد عبد الحق', subject:'أخصائي اجتماعي',
    num:16,
    spec:'أخصائي اجتماعي', grade:'الثانوية', icon:'م', cat:'اجتماعي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'ذ',
    bio:'أ. محمد محمد عبد الحميد عبد الحق، يقوم بتدريس مادة أخصائي اجتماعي بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. سهير جرجس المصيلحي', subject:'لغة عربية',
    num:17,
    spec:'لغة عربية', grade:'الثانوية', icon:'س', cat:'عربي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'أ',
    bio:'أ. سهير جرجس المصيلحي، تقوم بتدريس مادة لغة عربية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. أميرة عبد الناصر عبد المنعم', subject:'لغة عربية',
    num:18,
    spec:'لغة عربية', grade:'الثانوية', icon:'أ', cat:'عربي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'أ',
    bio:'أ. أميرة عبد الناصر عبد المنعم، تقوم بتدريس مادة لغة عربية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. زينب محمد عبد الحميد عبد الحق', subject:'لغة فرنسية',
    num:19,
    spec:'لغة فرنسية', grade:'الثانوية', icon:'ز', cat:'فرنساوي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'أ',
    bio:'أ. زينب محمد عبد الحميد عبد الحق، تقوم بتدريس مادة لغة فرنسية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. هانم محمد أحمد شريف', subject:'لغة فرنسية',
    num:20,
    spec:'لغة فرنسية', grade:'الثانوية', icon:'ه', cat:'فرنساوي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'أ',
    bio:'أ. هانم محمد أحمد شريف، تقوم بتدريس مادة لغة فرنسية بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. هبة حماد محمد حسانين', subject:'علم نفس',
    num:21,
    spec:'علم نفس', grade:'الثانوية', icon:'ه', cat:'نفس',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'أ',
    bio:'أ. هبة حماد محمد حسانين، تقوم بتدريس مادة علم نفس بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. سحر عبد العليم موسى خاطر', subject:'فلسفة',
    num:22,
    spec:'فلسفة', grade:'الثانوية', icon:'س', cat:'فلسفة',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'أ',
    bio:'أ. سحر عبد العليم موسى خاطر، تقوم بتدريس مادة فلسفة بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. رباب أحمد السيد', subject:'فلسفة',
    num:23,
    spec:'فلسفة', grade:'الثانوية', icon:'ر', cat:'فلسفة',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'أ',
    bio:'أ. رباب أحمد السيد، تقوم بتدريس مادة فلسفة بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. هالة جودة السيد', subject:'علم نفس',
    num:24,
    spec:'علم نفس', grade:'الثانوية', icon:'ه', cat:'نفس',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'أ',
    bio:'أ. هالة جودة السيد، تقوم بتدريس مادة علم نفس بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. فتحية عبد المحيد عبد الرحمن', subject:'تكنولوجيا',
    num:25,
    spec:'تكنولوجيا', grade:'الثانوية', icon:'ف', cat:'تكنولوجيا',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'أ',
    bio:'أ. فتحية عبد المحيد عبد الرحمن، تقوم بتدريس مادة تكنولوجيا بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
  {
    name:'أ. نجلاء محمد عبده عطا الله', subject:'أخصائي اجتماعي',
    num:26,
    spec:'أخصائي اجتماعي', grade:'الثانوية', icon:'ن', cat:'اجتماعي',
    where:'مدرسة شهيد حسن حمدي الثانوية',
    lang:'ar', gender:'أ',
    bio:'أ. نجلاء محمد عبده عطا الله، تقوم بتدريس مادة أخصائي اجتماعي بمدرسة شهيد حسن حمدي الثانوية بإدارة الحسنية.'
  },
];
let teachers = DEFAULT_TEACHERS.slice();

const DEFAULT_STUDENTS = [
  {
    rank:1, name:'أحمد خالد محمود', icon:'أ',
    grade:'الصف الثالث الثانوي — علمي', score:'99.2%',
    from:'القاهرة', dob:'2008-03-15',
    quote:'العلم نور، والاجتهاد طريق النجاح المستمر'
  },
  {
    rank:2, name:'سارة ياسر عبد الرحمن', icon:'س',
    grade:'الصف الثالث الثانوي — أدبي', score:'98.7%',
    from:'الجيزة', dob:'2008-07-22',
    quote:'التميز ليس هدفًا بل هو أسلوب حياة'
  },
  {
    rank:3, name:'عمر سامي إبراهيم', icon:'ع',
    grade:'الصف الثاني الثانوي — علمي', score:'98.1%',
    from:'القاهرة', dob:'2009-01-10',
    quote:'كل يوم هو فرصة جديدة للتعلم والتطور'
  },
  {
    rank:4, name:'نور محمد علي', icon:'ن',
    grade:'الصف الثالث الثانوي — علمي', score:'97.8%',
    from:'الجيزة', dob:'2008-11-05',
    quote:'الصبر والمثابرة مفتاح كل نجاح'
  },
  {
    rank:5, name:'فاطمة أحمد حسن', icon:'ف',
    grade:'الصف الأول الثانوي — أدبي', score:'97.3%',
    from:'القاهرة', dob:'2010-06-18',
    quote:'العلم بالتعلم، والحكمة بالتجربة'
  },
  {
    rank:6, name:'محمود أحمد سعيد', icon:'م',
    grade:'الصف الأول الثانوي — علمي', score:'97.0%',
    from:'القاهرة', dob:'2010-01-27',
    quote:'من جد وجد، ومن زرع حصد'
  },
];
let students = DEFAULT_STUDENTS.slice();

const videos = [
  { title:'حفل نهاية العام الدراسي ٢٠٢٧', meta:'يونيو ٢٠٢٧ · قاعة الاحتفالات' },
  { title:'يوم الرياضة السنوي ٢٠٢٧', meta:'مارس ٢٠٢٧ · ملعب المدرسة' },
  { title:'معرض العلوم والإبداع', meta:'فبراير ٢٠٢٧ · مختبر العلوم' },
];

const DEFAULT_PHOTOS = [
  'حفل التخرج ٢٠٢٧','يوم الكتاب العالمي','بطولة القدم الداخلية',
  'معرض العلوم','معرض الفنون الطلابي','تكريم المتفوقين',
  'يوم البيئة المدرسي','المسرحية السنوية','الرحلة المدرسية',
  'الحفل الموسيقي','اجتماع أولياء الأمور','تجارب المختبر',
].map(title => ({ id: null, title, image_data: null }));
let photos = DEFAULT_PHOTOS.slice();

/* ============================================================
   تحميل البيانات من قاعدة البيانات (Neon عبر /api)
   لو الطلب فشل (السيرفر لسه مش متظبط، أو مفيش نت) بيفضل الموقع
   شغال بالبيانات الافتراضية اللي فوق من غير ما يبوظ حاجة.
============================================================ */
async function loadLiveData() {
  try {
    const [tRes, sRes, pRes] = await Promise.all([
      fetch('/api/teachers', { cache: 'no-store' }).catch(() => null),
      fetch('/api/students', { cache: 'no-store' }).catch(() => null),
      fetch('/api/photos', { cache: 'no-store' }).catch(() => null),
    ]);
    if (tRes && tRes.ok) {
      const data = await tRes.json();
      if (Array.isArray(data) && data.length) teachers = data;
    }
    if (sRes && sRes.ok) {
      const data = await sRes.json();
      if (Array.isArray(data) && data.length) students = data;
    }
    if (pRes && pRes.ok) {
      const data = await pRes.json();
      if (Array.isArray(data) && data.length) photos = data;
    }
    // إعادة رسم أي صفحة اتعرضت بالفعل بالبيانات الافتراضية قبل ما الداتا توصل
    const teachersList = document.getElementById('teachersList');
    if (teachersList && teachersList.childElementCount) renderTeachersList('teachersList','filterTabs');
    const studentsGrid = document.getElementById('studentsGrid');
    if (studentsGrid && studentsGrid.childElementCount) renderStudents();
    const photosGrid = document.getElementById('photosGrid');
    if (photosGrid && photosGrid.childElementCount) { photosGrid.innerHTML=''; renderMemoriesPhotosOnly(); }
  } catch (e) {
    console.warn('تعذر تحميل بيانات مباشرة، هيتم استخدام البيانات الافتراضية.', e);
  }
}

/* ============================================================
   PAGES SYSTEM
============================================================ */
const PAGE_IDS = ['home','principal','students','memories','about','teacher-profile'];

function syncBNav(id) {
  document.querySelectorAll('.bnav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.page === id);
  });
  const home = document.getElementById('bnavHome');
  if (home) home.classList.toggle('active', id === 'home');
}

function goPage(id, linkEl) {
  const target = document.getElementById('page-'+id);
  if (!target) return;

  // Settle scroll position BEFORE swapping which page is visible, and force it
  // instant — 'instant' bypasses this page's global CSS scroll-behavior:smooth,
  // unlike 'auto', which would still defer to it and animate over several frames.
  // Do this first so there's never a moment where the new (often shorter) page's
  // content is shown at the old page's leftover scroll position.
  window.scrollTo({ top:0, behavior:'instant' });

  PAGE_IDS.forEach(p => {
    const el = document.getElementById('page-'+p);
    if (el) el.classList.remove('active');
  });
  target.classList.add('active');
  syncBNav(id);

  // update nav active
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  if (linkEl) { linkEl.classList.add('active'); }
  else {
    document.querySelectorAll(`.nav-links a[data-page="${id}"]`).forEach(a => a.classList.add('active'));
  }

  // render on demand
  if (id === 'principal' && !document.getElementById('teachersList').childElementCount) { renderTeachersList('teachersList','filterTabs'); }
  if (id === 'students'  && !document.getElementById('studentsGrid').childElementCount) { renderStudents(); }
  if (id === 'memories'  && !document.getElementById('videosGrid').childElementCount)   { renderMemories(); }

  setTimeout(setupReveal, 80);
}

/* ============================================================
   MOBILE MENU
============================================================ */
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileMenuOverlay');
  const ham = document.getElementById('hamburger');
  const isOpen = menu.classList.contains('open');
  menu.classList.toggle('open', !isOpen);
  overlay.classList.toggle('show', !isOpen);
  ham.classList.toggle('active', !isOpen);
  ham.setAttribute('aria-expanded', String(!isOpen));
  ham.setAttribute('aria-label', !isOpen ? 'إغلاق القائمة' : 'فتح القائمة');
  document.body.classList.toggle('menu-open', !isOpen);
}
function closeMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
  document.getElementById('mobileMenuOverlay').classList.remove('show');
  const ham = document.getElementById('hamburger');
  ham.classList.remove('active');
  ham.setAttribute('aria-expanded', 'false');
  ham.setAttribute('aria-label', 'فتح القائمة');
  document.body.classList.remove('menu-open');
}

/* ============================================================
   BOTTOM NAV NOTCH — pixel-perfect on any screen width
============================================================ */
function updateBNavNotch() {
  const wrap = document.querySelector('.bnav-wrap');
  const svg = document.getElementById('bnavNotchSvg');
  const path = document.getElementById('bnavNotchPath');
  if (!wrap || !svg || !path) return;
  const W = wrap.clientWidth;
  const H = wrap.clientHeight;
  if (!W || !H) return; // bar is display:none (desktop width) — nothing to sync yet

  const cx = W / 2; // .bnav-home is always centered via left:50%
  // Fixed pixel offsets from center, sized to .bnav-home's actual 58px
  // diameter plus breathing room — NOT proportional to screen width, so the
  // notch matches the button exactly on every screen instead of stretching.
  const outer = 49.5, ctrl1 = 37.5, mid1 = 33.5, ctrl2 = 27.5;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  path.setAttribute('d',
    `M0,0 L${cx-outer},0 Q${cx-ctrl1},0 ${cx-mid1},10 Q${cx-ctrl2},26 ${cx},26 ` +
    `Q${cx+ctrl2},26 ${cx+mid1},10 Q${cx+ctrl1},0 ${cx+outer},0 L${W},0 L${W},${H} L0,${H} Z`
  );
}
window.addEventListener('resize', updateBNavNotch);

/* ============================================================
   STARS CANVAS
============================================================ */
function initStars() {
  const canvas = document.getElementById('starsCanvas');
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, stars = [];
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < 85; i++) {
    stars.push({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random(),
      speed: Math.random() * 0.012 + 0.004,
      dir: Math.random() > 0.5 ? 1 : -1
    });
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      if (!reduceMotion) {
        s.a += s.speed * s.dir;
        if (s.a >= 1 || s.a <= 0.05) s.dir *= -1;
      }
      ctx.beginPath();
      ctx.arc(s.x % W, s.y % H, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,76,${s.a * 0.7})`;
      ctx.fill();
    });
    // Pause the loop while the tab isn't visible — no point burning battery
    // redrawing a canvas nobody can see.
    if (!document.hidden) requestAnimationFrame(draw);
  }
  draw();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) requestAnimationFrame(draw);
  });
}

/* ============================================================
   HERO PARTICLES
============================================================ */
function initHeroParticles() {
  const c = document.getElementById('heroParticles');
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'hero-particle';
    const size = Math.random() * 4 + 2;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      top:${Math.random()*100}%;
      left:${Math.random()*100}%;
      --d:${Math.random()*5+4}s;
      --del:${Math.random()*4}s;
    `;
    c.appendChild(p);
  }
}

/* ============================================================
   HERO 3D SCENE (Three.js)
   A bespoke signature shape — a faceted 8-point gold star medallion
   (نجمة), tied to the site's own "نجوم المدرسة" language — instead of
   generic stock "education" clipart. Solid-shaded with real lights,
   tumbling slowly with real depth and a gentle mouse-parallax look.
   Scales itself down automatically on small / low-core devices so it
   stays light on weaker phones.
============================================================ */
function initHero3D() {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('hero3d');
  const heroSection = document.querySelector('.hero-section');
  if (!canvas || !heroSection) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Device tier: fewer objects, lower pixel ratio, no AA on weak/small devices ----
  const cores = navigator.hardwareConcurrency || 4;
  const narrowScreen = window.innerWidth < 700;
  const lowTier = narrowScreen || cores <= 4;
  const starCount = lowTier ? 5 : 10;
  const dustCount = lowTier ? 90 : 260;
  const pixelRatioCap = lowTier ? 1.3 : 2;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(0, 0, 20);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: !lowTier, powerPreference: 'low-power'
    });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));

  const GOLD = 0xc9a84c, GOLD2 = 0xe8c96a, GOLD3 = 0xb8944a, CRIMSON = 0x8b1a1a;
  const starMats = [
    new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.72, roughness: 0.24 }),
    new THREE.MeshStandardMaterial({ color: GOLD2, metalness: 0.68, roughness: 0.28 }),
    new THREE.MeshStandardMaterial({ color: GOLD3, metalness: 0.75, roughness: 0.22 })
  ];
  const bossMat = new THREE.MeshStandardMaterial({ color: CRIMSON, metalness: 0.3, roughness: 0.45 });

  // Soft studio lighting — no shadow maps, cheap but gives real shaded form
  scene.add(new THREE.AmbientLight(0x8f86a8, 0.55));
  const keyLight = new THREE.DirectionalLight(0xfff2d0, 1.15);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(GOLD, 0.4);
  rimLight.position.set(-5, -3, -4);
  scene.add(rimLight);

  // ---- Signature shape: an 8-point Islamic star medallion (نجمة) —
  // echoes the "نجوم المدرسة" language used for top students elsewhere
  // on the site, and Egyptian geometric ornament, instead of generic
  // stock "education" clipart. One shared geometry, reused per instance. ----
  function buildStarGeometry(points, outerR, innerR, depth) {
    const shape = new THREE.Shape();
    const step = Math.PI / points;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = i * step - Math.PI / 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 1
    });
  }
  const starGeo = buildStarGeometry(8, 1, 0.42, 0.18);
  const bossGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.3, 16);
  bossGeo.rotateX(Math.PI / 2);

  function createStarMedallion() {
    const g = new THREE.Group();
    const star = new THREE.Mesh(starGeo, starMats[Math.floor(Math.random() * starMats.length)]);
    g.add(star);
    if (Math.random() > 0.4) g.add(new THREE.Mesh(bossGeo, bossMat)); // center medallion boss, on most stars
    return g;
  }

  const models = [];
  function place(obj, scale) {
    obj.scale.setScalar(scale);
    obj.position.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14 - 4);
    obj.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * 0.6 - 0.3);
    obj.userData.spin = { x: (Math.random() - 0.5) * 0.12, y: (Math.random() - 0.5) * 0.12 };
    obj.userData.bob = { amp: 0.35 + Math.random() * 0.55, speed: 0.22 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2, baseY: obj.position.y };
    scene.add(obj);
    models.push(obj);
  }
  for (let i = 0; i < starCount; i++) place(createStarMedallion(), 0.55 + Math.random() * 0.75);

  // Fine gold dust — a soft, sparse point field for depth
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 32;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 6;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: GOLD2, size: 0.055, transparent: true, opacity: 0.55, sizeAttenuation: true });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // Mouse parallax target (lerped toward each frame)
  let mouseX = 0, mouseY = 0, curX = 0, curY = 0;
  window.addEventListener('pointermove', e => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function resize() {
    // Guard against the mobile browser's address-bar show/hide firing window
    // 'resize' while #page-home (and this canvas) is display:none on another
    // page — heroSection would report 0x0, which used to get clamped to a
    // degenerate 1x1 render size and corrupt the renderer until the next
    // real resize. Skip instead: keep whatever the last valid size was.
    const r = heroSection.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    renderer.setSize(r.width, r.height, false);
  }
  resize();
  window.addEventListener('resize', resize);

  // Only animate while the hero is actually visible — cheap when scrolled away.
  // rafId guards against ever having more than one tick() loop in flight: the
  // IntersectionObserver firing, a visibilitychange event, and tick()'s own
  // self-scheduling can all ask to resume at once, and without this guard each
  // one stacks another parallel render loop on top instead of sharing the same one.
  let isVisible = true;
  let rafId = null;
  function scheduleTick() {
    if (rafId !== null || reduceMotion) return;
    rafId = requestAnimationFrame(tick);
  }

  new IntersectionObserver(entries => {
    entries.forEach(en => {
      isVisible = en.isIntersecting;
      if (isVisible) { resize(); scheduleTick(); } // catch up on any size change missed while hidden
    });
  }, { threshold: 0.01 }).observe(heroSection);

  const clock = new THREE.Clock();
  function tick() {
    rafId = null;
    if (!isVisible || document.hidden) return;
    const t = clock.getElapsedTime();

    curX += (mouseX - curX) * 0.04;
    curY += (mouseY - curY) * 0.04;
    scene.rotation.y = curX * 0.18;
    scene.rotation.x = curY * 0.1;

    models.forEach(m => {
      m.rotation.x += m.userData.spin.x * 0.01;
      m.rotation.y += m.userData.spin.y * 0.01;
      m.position.y = m.userData.bob.baseY + Math.sin(t * m.userData.bob.speed + m.userData.bob.phase) * m.userData.bob.amp;
    });
    dust.rotation.y = t * 0.01;

    renderer.render(scene, camera);
    scheduleTick();
  }

  if (reduceMotion) {
    renderer.render(scene, camera);
    canvas.classList.add('ready');
  } else {
    tick();
    requestAnimationFrame(() => canvas.classList.add('ready'));
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isVisible) scheduleTick();
  });
}

/* ============================================================
   3D TILT — pointer-driven card tilt, applied via delegation so it
   works on cards rendered later (teachers, students, memories...).
   Skipped entirely on touch devices and prefers-reduced-motion.
============================================================ */
function initTiltCards() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const TILT_TARGETS = [
    { sel: '.teacher-row',        max: 6, persp: 1500 },
    { sel: '.principal-hero-row', max: 4, persp: 1800 },
    { sel: '.stat-cell',          max: 9, persp: 900  },
    { sel: '.student-card',       max: 7, persp: 1000 },
    { sel: '.video-card',         max: 6, persp: 1000 },
    { sel: '.photo-card',         max: 8, persp: 800  }
  ];
  let activeEl = null;

  function resetTilt(el) {
    el.style.transition = 'transform 0.5s var(--ease-out)';
    el.style.transform = '';
  }

  document.addEventListener('pointermove', e => {
    let el = null, cfg = null;
    for (const c of TILT_TARGETS) {
      const found = e.target.closest(c.sel);
      if (found) { el = found; cfg = c; break; }
    }
    if (el !== activeEl) {
      if (activeEl) resetTilt(activeEl);
      activeEl = el;
    }
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * cfg.max;
    const ry = (px - 0.5) * cfg.max;
    el.style.transition = 'transform 0.08s linear';
    el.style.transform = `perspective(${cfg.persp}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  }, { passive: true });

  window.addEventListener('blur', () => { if (activeEl) { resetTilt(activeEl); activeEl = null; } });
}

/* ============================================================
   TEACHER ROWS
============================================================ */
function buildTeacherRow(t) {
  const row = document.createElement('div');
  const isLangEn = t.lang === 'en';
  const isLangFr = t.lang === 'fr';
  row.className = `teacher-row teacher-reveal ${isLangEn ? 'lang-en' : isLangFr ? 'lang-fr' : ''}`;

  // Generate a stylized SVG "portrait" using the teacher's initial
  // The image panel — full-height colored panel with large SVG figure silhouette + initial
  const genderIsMale = (t.gender === 'ذ' || t.gender === 'M');
  const photoPanel = `
    <div class="teacher-row-photo">
      <span class="teacher-photo-letter">${t.icon}</span>
      <svg class="teacher-portrait-svg" viewBox="0 0 240 260" preserveAspectRatio="xMidYMax meet" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Background gradient wash -->
        <defs>
          <linearGradient id="bg-${t.icon}-${t.name.length}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0c1120"/>
            <stop offset="100%" stop-color="#07090f"/>
          </linearGradient>
          <linearGradient id="figure-${t.icon}-${t.name.length}" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stop-color="rgba(201,168,76,0.22)"/>
            <stop offset="100%" stop-color="rgba(201,168,76,0.06)"/>
          </linearGradient>
          <linearGradient id="glow-${t.icon}-${t.name.length}" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stop-color="rgba(201,168,76,0.35)"/>
            <stop offset="100%" stop-color="rgba(201,168,76,0)"/>
          </linearGradient>
        </defs>
        <!-- Subtle glow circle -->
        <ellipse cx="120" cy="200" rx="90" ry="40" fill="rgba(201,168,76,0.05)"/>
        <!-- Person silhouette — head -->
        <circle cx="120" cy="85" r="42" fill="url(#figure-${t.icon}-${t.name.length})" stroke="rgba(201,168,76,0.25)" stroke-width="1.5"/>
        <!-- Inner face detail -->
        <circle cx="120" cy="85" r="30" fill="rgba(12,17,32,0.5)"/>
        <!-- Body/shoulders -->
        ${genderIsMale
          ? `<path d="M60 260 Q70 185 120 175 Q170 185 180 260Z" fill="url(#figure-${t.icon}-${t.name.length})" stroke="rgba(201,168,76,0.2)" stroke-width="1"/>`
          : `<path d="M50 260 Q65 178 120 168 Q175 178 190 260Z" fill="url(#figure-${t.icon}-${t.name.length})" stroke="rgba(201,168,76,0.2)" stroke-width="1"/>`
        }
        <!-- Collar/jacket detail -->
        <path d="M100 175 L120 195 L140 175" stroke="rgba(201,168,76,0.3)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- Initial letter centered in head -->
        <text x="120" y="96" text-anchor="middle" dominant-baseline="middle"
          font-family="Tajawal, Cairo, sans-serif" font-size="28" font-weight="900"
          fill="rgba(201,168,76,0.9)">${t.icon}</text>
        <!-- Bottom fade mask -->
        <rect x="0" y="200" width="240" height="60" fill="url(#bg-${t.icon}-${t.name.length})" opacity="0.7"/>
      </svg>
      <div class="teacher-photo-badge">${t.subject}</div>
      ${t.photo_data ? `<img class="teacher-photo-img" src="${t.photo_data}" alt="${t.name}" loading="lazy" onload="onPhotoLoad(this, '.teacher-row-photo')" />`
        : t.num ? `<img class="teacher-photo-img" src="photos/${t.num}.jpg" data-num="${t.num}" data-ext-idx="0" alt="${t.name}" loading="lazy" onerror="tryNextPhotoExt(this)" onload="onPhotoLoad(this, '.teacher-row-photo')" />` : ''}
    </div>
  `;

  const infoPanel = `
    <div class="teacher-row-info">
      <h3 class="t-name">${t.name}</h3>
      <div class="t-location">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${t.from ? t.from + ' — ' : ''}${t.where}
      </div>
      <p class="t-bio-short">${t.bio.substring(0, 150)}...</p>
      <div class="t-meta-chips">
        ${t.age ? `<div class="t-chip">السن: <strong>${t.age} سنة</strong></div>` : ''}
        ${t.exp ? `<div class="t-chip">الخبرة: <strong>${t.exp} سنة</strong></div>` : ''}
        <div class="t-chip">التخصص: <strong>${t.spec}</strong></div>
        <div class="t-chip">المرحلة: <strong>${t.grade}</strong></div>
      </div>
    </div>
  `;

  // DOM order is always [photo, info] — the CSS 'direction' rule on
  // .lang-en/.lang-fr (see .teacher-row.lang-en/.lang-fr above) is what flips
  // which side each one lands on, so no JS branching is needed here.
  row.innerHTML = photoPanel + infoPanel;
  row.lang = t.lang; // correct pronunciation for EN/FR bios under screen readers

  row.onclick = () => openTeacherPage(t);
  return row;
}

function renderTeachersList(listId, tabsId, filter = 'all') {
  const list = document.getElementById(listId);
  list.innerHTML = '';
  const filtered = filter === 'all' ? teachers : teachers.filter(t => t.cat === filter);
  filtered.forEach((t, i) => {
    const row = buildTeacherRow(t);
    row.style.transitionDelay = Math.min(i * 0.05, 0.4) + 's';
    list.appendChild(row);
  });
  setTimeout(setupTeacherReveal, 50);
}

function toggleFilterDropdown(id) {
  const dd = document.getElementById(id);
  const btn = document.getElementById('filterDropBtn');
  if (!dd) return;
  const isOpen = dd.classList.contains('open');
  dd.classList.toggle('open', !isOpen);
  if (btn) btn.classList.toggle('open', !isOpen);
  if (!isOpen) {
    setTimeout(() => {
      document.addEventListener('click', function close(e) {
        if (!dd.contains(e.target) && e.target !== btn) {
          dd.classList.remove('open');
          if (btn) btn.classList.remove('open');
        }
        document.removeEventListener('click', close);
      });
    }, 10);
  }
}

function filterTeachers(f, btn, fromDropdown) {
  // Sync both the tab bar and the dropdown to whichever filter is active,
  // matched by data-filter — reliable regardless of which of the two
  // triggered the change, and doesn't break if a category's button text changes.
  document.querySelectorAll('#filterTabs .filter-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === f);
  });
  document.querySelectorAll('#filterDropdown .fdrop-item').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === f);
  });
  if (fromDropdown) {
    const dd = document.getElementById('filterDropdown');
    const dbtn = document.getElementById('filterDropBtn');
    if (dd) { dd.classList.remove('open'); }
    if (dbtn) { dbtn.classList.remove('open'); }
  }
  renderTeachersList('teachersList','filterTabs', f);
}

/* ============================================================
   TEACHER MODAL
============================================================ */
/* ============================================================
   SINGLE TEACHER PROFILE PAGE
============================================================ */
function openTeacherPage(t) {
  const genderIsMale = (t.gender === 'ذ' || t.gender === 'M');

  document.getElementById('tpLetter').textContent   = t.icon;
  document.getElementById('tpInitial').textContent  = t.icon;
  document.getElementById('tpName').textContent     = t.name;
  document.getElementById('tpSubject').textContent  = t.subject;
  document.getElementById('tpBadge').textContent    = t.subject;
  document.getElementById('tpBio').textContent      = t.bio;

  // Body silhouette shape varies slightly by gender, matching the teacher-row cards
  document.getElementById('tpBodyPath').setAttribute('d', genderIsMale
    ? 'M65 340 Q80 228 140 215 Q200 228 215 340Z'
    : 'M55 340 Q68 235 140 222 Q212 235 225 340Z');

  const area = document.getElementById('tpPhotoArea');
  const img  = document.getElementById('tpPhotoImg');
  area.classList.remove('has-photo');
  if (t.photo_data) {
    img.removeAttribute('data-num');
    img.alt = t.name;
    img.src = t.photo_data;
  } else if (t.num) {
    img.dataset.extIdx = '0';
    img.dataset.num = t.num;
    img.alt = t.name;
    img.src = `photos/${t.num}.jpg`;
  } else {
    img.removeAttribute('src');
  }

  const chips = [];
  if (t.age)   chips.push(`<div class="p-chip"><span class="lbl">السن</span><span class="val">${t.age} سنة</span></div>`);
  if (t.exp)   chips.push(`<div class="p-chip"><span class="lbl">سنوات الخبرة</span><span class="val">${t.exp} سنوات</span></div>`);
  if (t.spec)  chips.push(`<div class="p-chip"><span class="lbl">التخصص</span><span class="val">${t.spec}</span></div>`);
  if (t.grade) chips.push(`<div class="p-chip"><span class="lbl">المرحلة</span><span class="val">${t.grade}</span></div>`);
  if (t.from)  chips.push(`<div class="p-chip"><span class="lbl">المنشأ</span><span class="val">${t.from}</span></div>`);
  if (t.where) chips.push(`<div class="p-chip"><span class="lbl">يُدرِّس في</span><span class="val">${t.where}</span></div>`);
  document.getElementById('tpChips').innerHTML = chips.join('');

  goPage('teacher-profile');
}

function openTModal(t) {
  document.getElementById('mAvLetter').textContent = t.icon;
  const avEl = document.getElementById('mAv');
  const avImg = document.getElementById('mAvImg');
  avEl.classList.remove('has-photo');
  if (t.photo_data) {
    avImg.removeAttribute('data-num');
    avImg.alt = t.name;
    avImg.src = t.photo_data;
  } else if (t.num) {
    avImg.dataset.extIdx = '0';
    avImg.dataset.num = t.num;
    avImg.alt = t.name;
    avImg.src = `photos/${t.num}.jpg`;
  } else {
    avImg.removeAttribute('src');
  }
  document.getElementById('mName').textContent = t.name;
  document.getElementById('mSub').textContent  = t.subject;
  document.getElementById('mAgeCell').style.display = t.age ? '' : 'none';
  if (t.age) document.getElementById('mAge').textContent = t.age + ' سنة';
  document.getElementById('mExpCell').style.display = t.exp ? '' : 'none';
  if (t.exp) document.getElementById('mExp').textContent = t.exp + ' سنة';
  document.getElementById('mSpec').textContent = t.spec;
  document.getElementById('mGrade').textContent= t.grade;
  document.getElementById('mFromCell').style.display = t.from ? '' : 'none';
  if (t.from) document.getElementById('mFrom').textContent = t.from;
  document.getElementById('mWhere').textContent= t.where;
  document.getElementById('mBio').textContent  = t.bio;
  document.getElementById('tModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeTModal(e) { if (e.target === document.getElementById('tModal')) closeTModalDirect(); }
function closeTModalDirect() {
  document.getElementById('tModal').classList.remove('open');
  document.body.style.overflow = '';
}

/* ============================================================
   STUDENTS
============================================================ */
function renderStudents() {
  const grid = document.getElementById('studentsGrid');
  students.forEach((s, i) => {
    const hasDob = !!s.dob;
    const age = hasDob ? calcAge(s.dob) : '—';
    const dob = hasDob ? new Date(s.dob) : null;
    const dobAr = hasDob ? `${dob.getFullYear()}/${String(dob.getMonth()+1).padStart(2,'0')}/${String(dob.getDate()).padStart(2,'0')}` : 'غير محدد';
    const card = document.createElement('div');
    card.className = 'student-card student-reveal';
    card.style.transitionDelay = Math.min(i * 0.07, 0.5) + 's';
    card.innerHTML = `
      <div class="rank-badge rank-${s.rank <= 3 ? s.rank : ''}">${s.rank}</div>
      <div class="s-avatar"${s.photo_data ? ` style="background-image:url(${s.photo_data});background-size:cover;background-position:center;color:transparent"` : ''}>${s.icon}</div>
      <div class="s-name">${s.name}</div>
      <div class="s-from">من ${s.from}</div>
      <div class="s-grade">${s.grade}</div>
      <div class="s-score">${s.score}</div>
      <div class="s-score-label">المجموع التراكمي</div>
      <div class="s-age-live">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        العمر: <strong class="live-age">${age}</strong> سنة
      </div>
      <div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:0.8rem;">تاريخ الميلاد: ${dobAr}</div>
      <div class="s-quote">"${s.quote}"</div>
    `;
    grid.appendChild(card);
  });
  setTimeout(setupStudentReveal, 50);

  // Live age updates every minute
  setInterval(() => {
    students.forEach((s, i) => {
      const cards = document.querySelectorAll('#studentsGrid .student-card');
      if (cards[i]) {
        const el = cards[i].querySelector('.live-age');
        if (el) el.textContent = s.dob ? calcAge(s.dob) : '—';
      }
    });
  }, 60000);
}

/* ============================================================
   MEMORIES
============================================================ */
function renderMemories() {
  const vGrid = document.getElementById('videosGrid');
  videos.forEach((v, i) => {
    const card = document.createElement('div');
    card.className = 'video-card video-reveal';
    card.style.transitionDelay = Math.min(i * 0.09, 0.5) + 's';
    card.innerHTML = `
      <div class="video-thumb">
        <div class="play-btn">
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </div>
      <div class="video-info">
        <div class="video-title">${v.title}</div>
        <div class="video-meta">${v.meta}</div>
      </div>
    `;
    card.onclick = () => { document.getElementById('vidTitle').textContent = v.title; document.getElementById('vidModal').classList.add('open'); };
    vGrid.appendChild(card);
  });

  renderMemoriesPhotosOnly();
  setTimeout(setupMemoriesReveal, 50);
}

function renderMemoriesPhotosOnly() {
  const pGrid = document.getElementById('photosGrid');
  if (!pGrid) return;
  pGrid.innerHTML = '';
  photos.forEach((p, i) => {
    const label = typeof p === 'string' ? p : p.title;
    const img = typeof p === 'string' ? null : p.image_data;
    const card = document.createElement('div');
    card.className = 'photo-card photo-reveal';
    card.setAttribute('data-label', label);
    card.style.transitionDelay = Math.min(i * 0.045, 0.5) + 's';
    if (img) {
      card.style.backgroundImage = `url(${img})`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
    } else {
      card.innerHTML = `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    }
    card.onclick = () => openPhotoModal(label, img);
    pGrid.appendChild(card);
  });
}

function closeVidModal() {
  document.getElementById('vidModal').classList.remove('open');
}

function openPhotoModal(label, img) {
  document.getElementById('photoTitle').textContent = label;
  const placeholder = document.getElementById('photoPlaceholder');
  const fullImg = document.getElementById('photoFullImg');
  if (img) {
    fullImg.src = img;
    fullImg.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    fullImg.style.display = 'none';
    placeholder.style.display = '';
  }
  document.getElementById('photoModal').classList.add('open');
}
function closePhotoModal() {
  document.getElementById('photoModal').classList.remove('open');
}

/* ============================================================
   SETTINGS — accent color / font size / light-dark appearance
   All three are independent CSS variable overrides (see :root
   rules), so they never fight each other, and persist via
   localStorage across visits.
============================================================ */
function openSettingsModal() {
  document.getElementById('settingsModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSettingsModalDirect() {
  document.getElementById('settingsModal').classList.remove('open');
  document.body.style.overflow = '';
}

function applyTheme(theme) {
  if (theme === 'gold') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-swatch').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.theme === theme);
  });
}
function setSiteTheme(theme) {
  applyTheme(theme);
  try { localStorage.setItem('siteTheme', theme); } catch (e) { /* private mode etc — just won't persist */ }
}

function applyAppearance(mode) {
  document.documentElement.classList.toggle('light-mode', mode === 'light');
  const lightBtn = document.getElementById('appLightBtn');
  const darkBtn = document.getElementById('appDarkBtn');
  if (lightBtn) lightBtn.classList.toggle('active', mode === 'light');
  if (darkBtn) darkBtn.classList.toggle('active', mode !== 'light');
  // Keep the mobile browser chrome (status bar / address bar tint) matching the page
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', mode === 'light' ? '#f7f4ee' : '#07090f');
}
function setAppearance(mode) {
  applyAppearance(mode);
  try { localStorage.setItem('siteAppearance', mode); } catch (e) {}
}

const FONT_STEPS = ['صغير', 'عادي', 'كبير', 'أكبر'];
const FONT_SIZES = ['87.5%', '100%', '112.5%', '125%'];
function applyFontStep(step) {
  step = Math.max(0, Math.min(FONT_STEPS.length - 1, step));
  document.documentElement.style.fontSize = FONT_SIZES[step];
  document.documentElement.dataset.fontStep = String(step);
  const label = document.getElementById('fsCurrentLabel');
  if (label) label.textContent = FONT_STEPS[step];
  const minusBtn = document.getElementById('fsMinusBtn');
  const plusBtn = document.getElementById('fsPlusBtn');
  if (minusBtn) minusBtn.disabled = step === 0;
  if (plusBtn) plusBtn.disabled = step === FONT_STEPS.length - 1;
}
function changeFontSize(dir) {
  const current = parseInt(document.documentElement.dataset.fontStep || '1', 10);
  const next = current + dir;
  if (next < 0 || next > FONT_STEPS.length - 1) return;
  applyFontStep(next);
  try { localStorage.setItem('siteFontStep', String(next)); } catch (e) {}
}

function initSettings() {
  let theme = 'gold', appearance = 'dark', fontStep = 1;
  try {
    theme = localStorage.getItem('siteTheme') || 'gold';
    appearance = localStorage.getItem('siteAppearance') || 'dark';
    fontStep = parseInt(localStorage.getItem('siteFontStep') || '1', 10);
  } catch (e) { /* localStorage unavailable — defaults above stay in effect */ }
  applyTheme(theme);
  applyAppearance(appearance);
  applyFontStep(fontStep);
}

/* ============================================================
   SUPPORT MODAL — full-screen sequential "story" reveal.
   Each slide fades in, holds for a set duration, fades out, then
   the next one takes over — ending on the back / WhatsApp actions.
============================================================ */
const SUPPORT_SLIDE_MS = 3400;
let _supportTimer = null;

function openSupportModal() {
  const modal = document.getElementById('supportModal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  runSupportSequence();
}
function closeSupportModal() {
  const modal = document.getElementById('supportModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
  clearTimeout(_supportTimer);
}
function runSupportSequence() {
  const modal = document.getElementById('supportModal');
  const slides = Array.from(modal.querySelectorAll('.support-slide'));
  const fills = Array.from(modal.querySelectorAll('.support-progress-fill'));
  const actions = document.getElementById('supportActions');
  if (!slides.length) return;

  clearTimeout(_supportTimer);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  modal.classList.toggle('no-motion', reduceMotion);

  slides.forEach(s => s.classList.remove('active'));
  actions.classList.remove('show');
  fills.forEach(f => { f.style.transition = 'none'; f.style.width = '0%'; });

  let i = 0;
  function step() {
    if (i > 0) slides[i - 1].classList.remove('active');
    if (i >= slides.length) { actions.classList.add('show'); return; }
    slides[i].classList.add('active');
    const fill = fills[i];
    if (fill) {
      requestAnimationFrame(() => {
        fill.style.transition = reduceMotion ? 'none' : `width ${SUPPORT_SLIDE_MS}ms linear`;
        fill.style.width = '100%';
      });
    }
    _supportTimer = setTimeout(() => { i++; step(); }, SUPPORT_SLIDE_MS);
  }
  step();
}

/* ============================================================
   COUNTER ANIMATION
============================================================ */
function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target);

      // Animate the cell entrance
      const cell = el.closest('.stat-cell');
      if (cell) {
        const idx = Array.from(cell.parentElement.children).indexOf(cell);
        cell.style.opacity = '0';
        cell.style.transform = 'translateY(20px) scale(0.94)';
        setTimeout(() => {
          cell.style.transition = 'opacity 0.55s ease, transform 0.55s var(--ease-bounce)';
          cell.style.opacity = '';
          cell.style.transform = '';
        }, idx * 90);
      }

      let cur = 0;
      const step = target / 55;
      const timer = setInterval(() => {
        cur = Math.min(cur + step, target);
        el.textContent = Math.floor(cur);
        if (cur >= target) clearInterval(timer);
      }, 18);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-num').forEach(n => obs.observe(n));
}

/* ============================================================
   SCROLL REVEAL
============================================================ */
function setupReveal() {
  const els = document.querySelectorAll('.reveal:not(.visible), .reveal-left:not(.visible), .reveal-right:not(.visible)');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(el => obs.observe(el));
}

/* ============================================================
   REVERSIBLE SCROLL REVEAL (shared engine)
   Never unobserves: each matched element shows itself as it scrolls
   into view and hides itself again as it scrolls out — in EITHER
   direction. No page navigation involved, purely a scroll-linked
   toggle. Each section below just points this at its own selector;
   the actual look of each section's animation lives entirely in CSS
   (teacher rows flip on X, students turn on Y, videos/photos in
   Memories slide+tilt or blur into focus, About slides+rotates,
   the team list cascades) so every section reads as its own thing.
============================================================ */
const _revealObservers = {};
function setupReversibleReveal(key, selector, options = {}) {
  const { threshold = 0.12, rootMargin = '-10% 0px -10% 0px' } = options;
  const els = document.querySelectorAll(selector);
  if (!els.length) return null;
  if (_revealObservers[key]) _revealObservers[key].disconnect();

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        el.classList.add('visible');
        el.classList.remove('exiting');
      } else {
        el.classList.remove('visible');
        // Only play the "exit" motion when it left past the TOP (scrolling
        // down through it). If it's below the viewport again (scrolled back
        // up past its entrance point), reset to the normal entrance pose so
        // scrolling back down replays the same way.
        const leftFromTop = entry.boundingClientRect.top < 0;
        el.classList.toggle('exiting', leftFromTop);
      }
    });
  }, { threshold, rootMargin });

  els.forEach(el => obs.observe(el));
  _revealObservers[key] = obs;
  return obs;
}

function setupTeacherReveal()  { setupReversibleReveal('teachers', '#teachersList .teacher-row.teacher-reveal'); }
function setupStudentReveal()  { setupReversibleReveal('students', '#studentsGrid .student-card.student-reveal'); }
function setupMemoriesReveal() {
  setupReversibleReveal('videos', '#videosGrid .video-card.video-reveal');
  setupReversibleReveal('photos', '#photosGrid .photo-card.photo-reveal');
}
function setupAboutReveal() {
  setupReversibleReveal('about-hero', '.about-hero-reveal');
  setupReversibleReveal('about-team', '.about-member-reveal');
}

/* ============================================================
   SCROLL EVENTS
============================================================ */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.classList.toggle('scrolled', window.scrollY > 60);
  const btn = document.getElementById('scrollTop');
  btn.classList.toggle('show', window.scrollY > 500);
}, { passive: true });

/* ============================================================
   KEYBOARD
============================================================ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeTModalDirect();
    closeVidModal();
    closePhotoModal();
    closeSettingsModalDirect();
    closeSupportModal();
    closeMenu();
  }
});

/* ============================================================
   INIT
============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  // Hide the loader on a guaranteed timer FIRST, so a future error in any
  // init function below can never leave the whole site stuck on the splash screen.
  // 1900ms gives the staggered word-drop animation (last word lands ~1.4s in) a beat to breathe.
  setTimeout(() => {
    const l = document.getElementById('loader');
    if (l) l.classList.add('gone');
  }, 1900);

  try { updateCopyrightYear(); } catch (err) { console.error('updateCopyrightYear failed:', err); }
  try { updateBNavNotch(); } catch (err) { console.error('updateBNavNotch failed:', err); }
  try { initStars(); } catch (err) { console.error('initStars failed:', err); }
  try { initHeroParticles(); } catch (err) { console.error('initHeroParticles failed:', err); }
  try { initHero3D(); } catch (err) { console.error('initHero3D failed:', err); }
  try { initTiltCards(); } catch (err) { console.error('initTiltCards failed:', err); }
  try { initCounters(); } catch (err) { console.error('initCounters failed:', err); }
  try { initSettings(); } catch (err) { console.error('initSettings failed:', err); }
  try { setupAboutReveal(); } catch (err) { console.error('setupAboutReveal failed:', err); }
  setTimeout(setupReveal, 300);

  loadLiveData();
  checkAdminRoute();
});
