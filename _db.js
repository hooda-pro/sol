// api/_db.js
// اتصال واحد بقاعدة بيانات Neon، بيتشارك بين كل الـ API endpoints.
// بيستخدم @neondatabase/serverless لأنه شغال على HTTP fetch،
// مناسب لـ Vercel serverless functions (مفيش تعقيد اتصالات TCP دائمة).
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL env var غير موجود. لازم تضيفه في إعدادات Vercel.');
}

const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };
