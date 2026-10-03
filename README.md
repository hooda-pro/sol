# موقع مدرسة شهيد حسن حمدي الثانوية — إدارة الحسنية

موقع ثابت (HTML/CSS/JS) + دوال Vercel Serverless + قاعدة بيانات Neon Postgres.
فيه: المدرسين، الأوائل، معرض الذكريات، نموذج الشكاوى، ولوحة أدمن (`/#/admin`).

## شكل المشروع

```
index.html              الصفحة الرئيسية
css/style.css           التصميم
js/site.js              منطق الموقع
js/admin.js             لوحة الأدمن (بتتحمّل كسولًا أول ما حد يفتح #/admin)
api/                    الـ API (Vercel Serverless — CommonJS)
  teachers.js  students.js  photos.js  complaints.js  settings.js
  login.js              دخول الأدمن
  _auth.js _db.js _validate.js   كود مشترك
sw.js  manifest.webmanifest  icons/  og-image.png   PWA
robots.txt  sitemap.xml
schema.sql              هيكل الجداول
seed.sql                بيانات المدرسين والأوائل الأولية
tests/                  4 اختبارات (npm test)
```

## التشغيل لأول مرة

1. في Neon → SQL Editor: شغّل `schema.sql` ثم `seed.sql` (مرة واحدة بس — تكرار `seed.sql` بيكرر البيانات).
2. في Vercel → Settings → Environment Variables ضيف:
   - `DATABASE_URL` — رابط الاتصال بقاعدة Neon
   - `ADMIN_PASSWORD` — كلمة سر لوحة الأدمن
3. ارفع المشروع على Vercel (الجذر هو نفسه مجلد الموقع، مفيش `public/`).

## ملاحظات

- لو غيّرت أي ملف ثابت (HTML/CSS/JS) زوّد `CACHE_VERSION` في `sw.js` عشان المتصفحات تجيب النسخة الجديدة.
- الاختبارات: `npm test` (من غير أي تنزيلات).
