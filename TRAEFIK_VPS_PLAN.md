# خطة إضافة Traefik على الـ VPS

## الهدف
تشغيل Traefik كـ reverse proxy أمام تطبيقاتك (مثل Mirmaia POS) مع HTTPS تلقائي (Let's Encrypt).

---

## معلومات الـ VPS
- **IP:** `72.62.249.18`
- الاتصال: `ssh مستخدم@72.62.249.18`

## المتطلبات
- VPS يعمل (Ubuntu 20/22 أو Debian)
- Docker و Docker Compose مثبتين
- دومين يشير إلى IP السيرفر (مثلاً `pos.mirmaia.store`, `api.mirmaia.store`)

---

## المرحلة 1: إنشاء شبكة Docker مشتركة

Traefik والتطبيقات يجب أن يكونوا على نفس الشبكة (مثلاً `web`).

```bash
docker network create web
```

---

## المرحلة 2: مجلد Traefik وملفات الإعداد

**الطريقة الأسهل:** استخدم الملف الجاهز من المشروع:

```bash
# من جهازك: انسخ مجلد deploy/traefik إلى السيرفر
scp -r deploy/traefik/* مستخدم@IP-السيرفر:/srv/traefik/
```

أو على السيرفر بعد رفع المشروع (git clone):

```bash
sudo mkdir -p /srv/traefik
sudo cp -r /srv/apps/mirmaia1/deploy/traefik/* /srv/traefik/
cd /srv/traefik
```

**قبل التشغيل:** عدّل في `docker-compose.yml`:
- `certificatesresolvers.le.acme.email` → ضع إيميلك الحقيقي (لـ Let's Encrypt).
- لوحة التحكم محمية بـ Basic Auth؛ لتغيير كلمة المرور:  
  `htpasswd -nb admin كلمة_المرور` ثم ضع الناتج في `traefik.http.middlewares.traefik-auth.basicauth.users`.

---

## المرحلة 3: تشغيل Traefik

```bash
cd /srv/traefik
docker compose up -d
```

تحقق:
```bash
docker ps
curl -I http://localhost
```

---

## المرحلة 4: ربط تطبيق Mirmaia بـ Traefik

- تأكد أن `docker-compose.yml` الخاص بـ Mirmaia (في `/srv/apps/mirmaia1/`) يستخدم:
  - شبكة `web` (external: true)
  - Labels الخاصة بـ Traefik (Host، entrypoints=websecure، certresolver=le)
- لا تعرّض منافذ الـ frontend/backend للعامة؛ فقط Traefik يعرّض 80/443.

ثم:
```bash
cd /srv/apps/mirmaia1
docker compose up -d --build
```

---

## المرحلة 5: DNS

**IP الـ VPS:** `72.62.249.18`

تأكد أن الدومينات تشير إلى هذا الـ IP (سجلات A):
- `pos.mirmaia.store`       → A → `72.62.249.18`
- `api.mirmaia.store`       → A → `72.62.249.18`
- (اختياري) `traefik.mirmaia.store` → A → `72.62.249.18` للوحة التحكم

---

## المرحلة 6: التحقق

- افتح في المتصفح: `https://pos.mirmaia.store`
- واختبر الـ API: `https://api.mirmaia.store/api/...`
- الشهادات تُصدر تلقائياً في أول طلب HTTPS.

---

## ملخص الأوامر بالترتيب

```bash
# 1) شبكة مشتركة
docker network create web

# 2) مجلد Traefik
sudo mkdir -p /srv/traefik
cd /srv/traefik

# 3) أنشئ docker-compose.yml و acme.json (كما أعلاه)
nano docker-compose.yml
touch acme.json && chmod 600 acme.json

# 4) تشغيل Traefik
docker compose up -d

# 5) تشغيل Mirmaia (بعد نسخ المشروع وملف docker-compose المحدث)
cd /srv/apps/mirmaia1
docker compose up -d --build
```

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| لا يوجد HTTPS | تأكد من أن الدومين يشير لـ IP السيرفر وانتظر دقيقة بعد أول طلب |
| 404 من Traefik | تأكد أن الحاوية على شبكة `web` والـ Host في الـ labels صحيح |
| **Docker API 1.24 too old** | Traefik v3.2 قديم؛ استخدم صورة أحدث: `traefik:v3.6` في `/srv/traefik/docker-compose.yml` ثم `docker compose up -d` |
| شهادة لا تُصدر | راجع سجلات Traefik: `docker logs traefik` وتأكد من فتح المنفذ 80 |

بعد تنفيذ هذه المراحل يكون Traefik مضافاً على الـ VPS وجاهزاً لخدمة Mirmaia وغيره.
