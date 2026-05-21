# ⚡ البدء السريع — CRM Pro

## الخطوة 1: Supabase Setup (5 دقائق)

1. اذهب إلى [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً
2. اذهب إلى **Settings → API** وانسخ:
   - `Project URL`
   - `anon public` key (وليس service_role!)
3. اذهب إلى **SQL Editor → New query**
4. الصق محتوى ملف `sql/schema.sql` بالكامل واضغط **Run**
5. اذهب إلى **Authentication → Providers → Email** وفعّله
   - عطّل "Confirm email" للاختبار السريع

## الخطوة 2: تشغيل المشروع محلياً

```bash
# 1. ثبّت dependencies
npm install

# 2. عدّل .env.local وضع مفاتيحك
nano .env.local  # أو افتحه بأي editor

# 3. شغّل
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

## الخطوة 3: النشر على Vercel

### الطريقة الأسهل (3 خطوات):

```bash
# 1. ارفع المشروع على GitHub
git init && git add . && git commit -m "first commit"
gh repo create crm-arabic --public --source=. --push
# (أو ارفعه يدوياً)

# 2. اذهب إلى vercel.com → New Project → Import
# 3. أضف Environment Variables:
#    NEXT_PUBLIC_SUPABASE_URL
#    NEXT_PUBLIC_SUPABASE_ANON_KEY
```

اضغط **Deploy** — سيكون جاهزاً في أقل من دقيقتين.

## الخطوة 4: استخدام التطبيق

1. سجّل حساباً جديداً من صفحة Login
2. سيتم إنشاء `profile` تلقائياً عبر trigger
3. ابدأ بإضافة فروع → عملاء → طلبات
4. شاهد التحديثات الفورية عبر Realtime

---

## ⚠️ ملاحظات أمان مهمة

- لا تشارك ملف `.env.local` أبداً
- استخدم `anon` key فقط (وليس `service_role`)
- RLS مفعّل تلقائياً على كل الجداول
- المستخدمون يرون فقط إشعاراتهم الخاصة (RLS policy)

## 📚 ملفات مهمة

| الملف | الغرض |
|---|---|
| `sql/schema.sql` | الـ Schema الكامل |
| `.env.local` | مفاتيح Supabase (لا ترفعها!) |
| `src/middleware.ts` | حماية الـ routes |
| `src/lib/supabase-client.ts` | Supabase client |
| `README.md` | الدليل الكامل |
