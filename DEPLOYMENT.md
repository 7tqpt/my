# 🚀 دليل نشر المشروع مجاناً — GitHub + MongoDB Atlas + Render

هذا الدليل يشرح خطوة بخطوة كيفية نشر **نظام إدارة العقارات** مجاناً بالكامل عبر:

| الخدمة | الدور | التكلفة |
|---|---|---|
| **GitHub** | استضافة الكود | مجاني |
| **MongoDB Atlas** | قاعدة البيانات (M0) | مجاني للأبد (512MB) |
| **Render** | تشغيل الـ Backend و Frontend | مجاني |

المجموع: **0 ريال** شهرياً.

---

## 📦 الخطوة 1 — رفع المشروع إلى GitHub

المشروع يعمل داخل منصة Emergent. لرفعه إلى GitHub:

1. من أسفل نافذة المحادثة، اضغط زر **"Save to GitHub"** 
2. اربط حساب GitHub (لمرة واحدة فقط)
3. أنشئ Repo جديد (مثلاً: `property-management`) واختر Public أو Private
4. المنصة ستدفع الكود تلقائياً 🎉

> ملف `.gitignore` جاهز ويستثني تلقائياً `node_modules`، `.env`، `mongodb_dump/`، إلخ.

---

## 🗄️ الخطوة 2 — إعداد MongoDB Atlas (قاعدة البيانات)

1. اذهب إلى **https://cloud.mongodb.com** وأنشئ حساباً مجاناً
2. اضغط **"Build a Database"** → اختر **M0 Free Cluster** → اضغط Create
3. من القائمة الجانبية:
   - **Database Access** → **Add New Database User**
     - اختر Password Authentication  
     - أدخل username و password (احفظهما!)
     - Role: `Atlas admin`
   - **Network Access** → **Add IP Address**
     - اضغط **"Allow Access from Anywhere"** → أدخل `0.0.0.0/0` → Confirm
4. من صفحة **Database** → اضغط **Connect** على Cluster0:
   - Choose **Drivers** → Python → 3.11 or later
   - انسخ Connection String — يشبه:
     ```
     mongodb+srv://USERNAME:PASSWORD@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - **⚠️ استبدل `<password>` بكلمة المرور الفعلية.** احفظ هذا النص، ستحتاجه في Render.

---

## ☁️ الخطوة 3 — النشر على Render

الطريقة الأسرع تستخدم ملف **`render.yaml`** الموجود جاهزاً في جذر المشروع.

### 3.1 — إنشاء Blueprint

1. اذهب إلى **https://dashboard.render.com/blueprints** وسجّل دخول (يقبل GitHub Login)
2. اضغط **"New Blueprint Instance"**
3. اختر GitHub Repo الذي رفعته للتوّ
4. Render سيقرأ `render.yaml` تلقائياً ويعرض:
   - `property-mgmt-backend` (Web Service)
   - `property-mgmt-frontend` (Static Site)

### 3.2 — إدخال المتغيرات المطلوبة

سيطلب منك Render إدخال قيم المتغيرات التي عليها `sync: false`:

| المتغير | القيمة |
|---|---|
| `MONGO_URL` | connection string من MongoDB Atlas (من الخطوة 2) |
| `REACT_APP_BACKEND_URL` | **اترك فارغاً الآن**، ستملؤه في الخطوة 3.3 |

اضغط **Apply** — Render سيبدأ بناء الـ Backend أولاً.

### 3.3 — تحديث `REACT_APP_BACKEND_URL`

1. بعد ما ينتهي بناء الـ Backend (5–10 دقائق أول مرة)، انسخ URL الخاص به من Render:
   - مثال: `https://property-mgmt-backend.onrender.com`
2. اذهب إلى Service `property-mgmt-frontend` → **Environment** → عدّل `REACT_APP_BACKEND_URL` بهذا الـ URL
3. اضغط **Manual Deploy** → **Deploy latest commit**

بعد 3–5 دقائق سيكون التطبيق جاهزاً 🎉

---

## 🔑 تسجيل الدخول

- **Username:** `admin`
- **Password:** `admin`

عند أول تشغيل، سيقوم `seed.py` بإنشاء حساب المدير وبيانات تجريبية (ملاك، عقارات، عقود...) تلقائياً.

---

## ⚙️ متغيرات البيئة الكاملة (للمرجع)

### Backend
| المفتاح | مطلوب؟ | مثال |
|---|---|---|
| `MONGO_URL` | ✅ | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `DB_NAME` | ✅ | `property_management` |
| `JWT_SECRET` | ✅ (يُنشأ تلقائياً في Render) | نص عشوائي طويل ≥ 32 حرف |
| `FRONTEND_ORIGIN` | اختياري | `https://your-frontend.onrender.com` (تقييد CORS) |

### Frontend
| المفتاح | مطلوب؟ | مثال |
|---|---|---|
| `REACT_APP_BACKEND_URL` | ✅ | `https://property-mgmt-backend.onrender.com` |

---

## 📝 ملاحظات مهمة

- **الخطة المجانية في Render** توقف الخدمة بعد ~15 دقيقة من الخمول. أول طلب بعد الاستيقاظ قد يأخذ **30–50 ثانية**. الطلبات التالية سريعة.
- **MongoDB Atlas M0** يعطيك 512MB و 500 اتصال — كافٍ لآلاف السجلات.
- **SSL/HTTPS** مجاني وتلقائي في Render.
- **إعادة النشر التلقائي**: أي `git push` إلى `main` سيُعيد النشر تلقائياً.
- **تقييد CORS**: للأمان، بعد النشر عيّن `FRONTEND_ORIGIN` في Backend لتقتصر الطلبات على نطاق Frontend فقط.
- **مدير النظام (admin)** محمي: لا يمكن حذفه من الواجهة أو الـ API.

---

## 🐛 حل المشاكل الشائعة

| المشكلة | الحل |
|---|---|
| Backend logs: `MongoDB connection failed` | تأكد من إضافة `0.0.0.0/0` في Network Access في Atlas، وأن كلمة السر في `MONGO_URL` لا تحتوي على `@` أو `#` بدون URL-encoding |
| Frontend يعطي `Network Error` | تحقق أن `REACT_APP_BACKEND_URL` صحيح ولا ينتهي بـ `/`. أعد بناء Frontend بعد تعديله |
| صفحات لا تُحمّل عند التحديث (404) | تأكد أن `render.yaml` يحوي `type: rewrite, source: /*, destination: /index.html` — موجود جاهز |
| Cluster ينام بسرعة | استخدم [UptimeRobot](https://uptimerobot.com) لعمل ping كل 10 دقائق مجاناً |

---

## 📞 روابط مفيدة

- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://www.mongodb.com/docs/atlas/
- render.yaml Spec: https://render.com/docs/blueprint-spec

---

**🎉 مبروك! تطبيقك الآن على الإنترنت مجاناً بالكامل.**
