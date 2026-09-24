/* ============================================================
   SERVICE WORKER — مدرسة شهيد حسن حمدي الثانوية
   بيخزّن الملفات الثابتة محليًا بأسلوب stale-while-revalidate:
   - أول زيارة بتنزّل عادي وبتتخزّن نسخة.
   - أي زيارة بعدها: الموقع يفتح فورًا من النسخة المخزّنة، وفي نفس
     الوقت بيحدّثها في الخلفية لو فيه نسخة أجدد على السيرفر.
   طلبات /api (الشكاوى وبيانات الموقع) بتعدّي على الشبكة دايمًا —
   ممنوع تتخزّن عشان البيانات تفضل طازة وكلمة سر الأدمن متتحفظش.
   ⚠️ لو غيّرت أي ملف ثابت في الموقع، زوّد رقم CACHE_VERSION هنا
   عشان المتصفح يرمي المخزن القديم ويجيب الجديد.
============================================================ */
const CACHE_VERSION = 'school-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/site.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// نشيل أي كاش قديم من نسخ سابقة عشان التخزين ميتكدّسش
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // GET بس، ومن نفس الدومين، ومش API — غير كده سيب المتصفح يتصرف طبيعي.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fresh = fetch(e.request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
