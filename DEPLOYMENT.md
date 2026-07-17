# Deployment Guide - دليل النشر المجاني

هذا الدليل يوضح طريقة نشر المشروع مجاناً على:
- **GitHub** (استضافة الكود)
- **MongoDB Atlas** (قاعدة البيانات - Free M0 Cluster)
- **Render** (الباكاند + الفرونتإند)

---

## الخطوة 1: MongoDB Atlas (قاعدة البيانات)

1. اذهب إلى https://cloud.mongodb.com وأنشئ حساب مجاني
2. أنشئ **Cluster مجاني** (M0 - 512MB)
3. في **Database Access**: أنشئ مستخدم بكلمة مرور
4. في **Network Access**: أضف `0.0.0.0/0` (للسماح لـ Render)
5. احصل على **Connection String**:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **استورد البيانات التجريبية** (اختياري):
   ```bash
   mongorestore --uri="YOUR_ATLAS_URI" --nsFrom="test_database.*" --nsTo="property_management.*" mongodb_dump
   ```

---

## الخطوة 2: GitHub

1. أنشئ repo جديد في GitHub
2. ادفع الكود:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Property Management System"
   git branch -M main
   git remote add origin https://github.com/YOUR_USER/property-management.git
   git push -u origin main
   ```

**ملاحظة**: ملف `.gitignore` مدمج بالمشروع ويستثني `node_modules` و`.env` والملفات الحساسة.

---

## الخطوة 3: Render (التطبيق)

### الطريقة الأسرع (Blueprint):

1. اذهب إلى https://dashboard.render.com/blueprints
2. اضغط **"New Blueprint Instance"**
3. اختر GitHub repo الخاص بك
4. سيقرأ Render ملف `render.yaml` تلقائياً
5. أدخل المتغيرات المطلوبة:
   - `MONGO_URL` = connection string من Atlas
   - `REACT_APP_BACKEND_URL` = URL الباكاند في Render (مثل `https://property-mgmt-backend.onrender.com`)
6. اضغط **Apply** وانتظر 5-10 دقائق

### الطريقة اليدوية (لمزيد من التحكم):

**Backend Service:**
- Type: **Web Service**
- Root Directory: `backend`
- Runtime: `Python 3.11.9`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Environment Variables:
  - `MONGO_URL` = connection string من MongoDB Atlas
  - `DB_NAME` = `property_management`
  - `JWT_SECRET` = أي نص عشوائي طويل
  - `PYTHON_VERSION` = `3.11.9`

**Frontend Static Site:**
- Type: **Static Site**
- Root Directory: `frontend`
- Build Command: `yarn install && yarn build`
- Publish Directory: `build`
- Environment Variables:
  - `REACT_APP_BACKEND_URL` = URL الباكاند في Render
- Rewrite Rule: `/*` → `/index.html` (لدعم React Router)

---

## ملاحظات مهمة

1. **خطة Render المجانية** توقف الخدمة بعد 15 دقيقة من الخمول (أول طلب قد يأخذ 30-50ث)
2. **خطة MongoDB Atlas M0** مجانية دائماً (512MB و 500 connections)
3. **CORS**: `server.py` يسمح بكل origins (`allow_origins=['*']`) - مناسب للاختبار. للإنتاج اجعله محدداً.
4. **أول تشغيل**: سيقوم `seed.py` بإنشاء مستخدم admin/admin تلقائياً + بيانات تجريبية.
5. **HTTPS**: Render يوفر SSL مجانية تلقائياً.

---

## تحديث الكود

أي `git push` إلى branch `main` سيؤدي إلى إعادة نشر تلقائي في Render.

---

لأي مشكلة في النشر، تحقق من:
- `Render Dashboard` → `Logs` (لرؤية أخطاء التشغيل)
- `MongoDB Atlas` → `Network Access` (تأكد إضافة 0.0.0.0/0)
