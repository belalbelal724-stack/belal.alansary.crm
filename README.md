# 🚀 CRM Pro — نظام إدارة العملاء العربي

نظام CRM احترافي كامل بـ **Next.js 15** + **Tailwind CSS** + **shadcn/ui** + **Supabase** مع دعم RTL عربي كامل و Realtime updates.

## ✨ المميزات

- 🔐 **تسجيل دخول + تسجيل حسابات** عبر Supabase Auth
- 📊 **لوحة تحكم تحليلية** مع KPIs ورسوم بيانية (Recharts)
- 👥 **إدارة العملاء** — CRUD كامل، بحث، فلترة بالحالة والفرع
- 🏪 **إدارة الفروع** — بطاقات تفاعلية
- 🛒 **إدارة الطلبات** — حالات الطلب والدفع
- 🔔 **إشعارات realtime** مع عداد غير المقروء
- 🌙 **Dark mode** كامل
- ⚡ **Realtime Subscriptions** عبر Supabase channels — تحديثات فورية بدون refresh
- 📱 **Responsive** مع sidebar متحرك للموبايل
- 🇸🇦 **RTL عربي** كامل + خط Tajawal
- 🎨 **تصميم احترافي** بنمط SaaS حديث (تدرجات، animations، shadows)

## 📦 التشغيل المحلي

```bash
# 1. ثبّت الـ dependencies
npm install

# 2. أنشئ .env.local وضع المفاتيح
echo "NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY" >> .env.local

# 3. شغّل SQL في Supabase Dashboard → SQL Editor
# انسخ محتوى ملف sql/schema.sql والصقه ثم Run

# 4. شغّل التطبيق
npm run dev
# افتح http://localhost:3000
```

## 🗄️ Supabase Setup

1. **أنشئ مشروعاً** في [supabase.com](https://supabase.com)
2. **انسخ المفاتيح** من Settings → API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   
   ⚠️ **مهم**: استخدم `anon` فقط، **لا** تستخدم `service_role` في environment variables الـ public!

3. **شغّل SQL Schema**:
   - Dashboard → SQL Editor → New query
   - الصق محتوى `sql/schema.sql` بالكامل
   - اضغط Run

4. **فعّل Realtime**:
   - Dashboard → Database → Replication
   - فعّل `clients`, `orders`, `notifications`, `branches`
   - (أو شغّل SQL الموجود في آخر الـ schema)

5. **فعّل Email Auth**:
   - Authentication → Providers → Email → Enable
   - (اختياري): عطّل "Confirm email" للاختبار السريع

## 🚢 النشر على Vercel

### الطريقة الأولى: GitHub + Vercel Dashboard

```bash
git init
git add .
git commit -m "Initial CRM"
git remote add origin https://github.com/YOUR_USER/crm-arabic.git
git push -u origin main
```

ثم على [vercel.com](https://vercel.com):
1. New Project → Import من GitHub
2. أضف Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

### الطريقة الثانية: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
# اتبع التعليمات وأضف environment variables عند السؤال
```

### Domain مخصص
في Vercel Dashboard → Settings → Domains → Add Domain

## 🗂️ هيكل المشروع

```
crm-arabic/
├── src/
│   ├── app/
│   │   ├── (app)/                # Routes محمية (بعد تسجيل الدخول)
│   │   │   ├── dashboard/        # لوحة التحكم
│   │   │   ├── clients/          # العملاء (CRUD)
│   │   │   ├── branches/         # الفروع (CRUD)
│   │   │   ├── orders/           # الطلبات (CRUD)
│   │   │   ├── notifications/    # الإشعارات
│   │   │   ├── settings/         # الإعدادات
│   │   │   └── layout.tsx        # AppShell wrapper
│   │   ├── api/                  # REST API routes
│   │   │   ├── clients/
│   │   │   └── stats/
│   │   ├── login/                # تسجيل دخول
│   │   ├── layout.tsx            # Root layout (RTL, theme, fonts)
│   │   ├── page.tsx              # Landing → redirect
│   │   └── globals.css           # Tailwind + theme tokens
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/               # Sidebar, Topbar, AppShell
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   ├── supabase-client.ts    # Browser client
│   │   ├── supabase-server.ts    # Server client (RSC)
│   │   └── utils.ts              # cn, formatters
│   ├── types/                    # TypeScript types
│   └── middleware.ts             # Route protection
├── sql/
│   └── schema.sql                # SQL Schema كامل
├── public/
├── tailwind.config.js
├── next.config.mjs
├── tsconfig.json
├── vercel.json
└── package.json
```

## 🎨 الـ Tech Stack

| التقنية | الاستخدام |
|---|---|
| **Next.js 15** | App Router + RSC + middleware |
| **React 19** | UI |
| **TypeScript 5** | Type safety |
| **Tailwind CSS 3** | Styling |
| **shadcn/ui** | Component primitives |
| **Radix UI** | Accessible primitives |
| **Supabase** | Auth + Database + Realtime + Storage |
| **@supabase/ssr** | SSR-friendly Supabase clients |
| **Recharts** | الرسوم البيانية |
| **Lucide React** | الأيقونات |
| **next-themes** | Dark mode |
| **Sonner** | Toast notifications |
| **date-fns** | معالجة التواريخ |

## 🛡️ الأمان

- ✅ **Row Level Security (RLS)** مفعّل على كل الجداول
- ✅ **Middleware** يحمي الـ routes غير المصرّحة
- ✅ **Anon key فقط** في environment variables (لا service_role)
- ✅ **Server Components** للحماية على مستوى السيرفر
- ✅ **CSRF protection** عبر Next.js
- ✅ **HTTPS** افتراضياً على Vercel

## 🐛 استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| لا تعمل Realtime | فعّل publication في Supabase → Replication |
| Login فشل | تأكد من تفعيل Email auth في Supabase Dashboard |
| 401 على API | تحقق من المفتاح في `.env.local` |
| لا يظهر الـ profile | شغّل trigger `handle_new_user` من schema.sql |
| RTL لا يعمل | تأكد أن `<html dir="rtl">` في layout |

## 📝 الترخيص

MIT — حر الاستخدام والتعديل.

---

**صُمم بحب للسوق العربي 🇸🇦 🇶🇦 🇦🇪 🇪🇬**
