# MySQL Database Container

هذا المجلد يحتوي على كونتينر قاعدة البيانات MySQL منفصل عن تطبيق الكاشير.

## الملفات

| الملف | الوصف |
|-------|-------|
| `docker-compose.yml` | إعدادات Docker لـ MySQL و phpMyAdmin |
| `init.sql` | سكربت إنشاء الجداول |
| `start-mysql.bat` | سكربت تشغيل (Windows) |
| `start-mysql.sh` | سكربت تشغيل (Linux/Mac) |

## طريقة التشغيل

### 1. تشغيل MySQL أولاً

**Windows:**
```bash
cd mysql
start-mysql.bat
```

**Linux/Mac:**
```bash
cd mysql
chmod +x start-mysql.sh
./start-mysql.sh
```

### 2. ثم تشغيل الكاشير

```bash
cd ..
docker-compose up -d
```

## الوصول

| الخدمة | الرابط |
|--------|--------|
| MySQL | `localhost:3306` |
| phpMyAdmin | http://localhost:8080 |

## بيانات الدخول

| الحقل | القيمة |
|-------|--------|
| المستخدم | `root` |
| كلمة المرور | `mirmaia_root_2026` |
| قاعدة البيانات | `mirmaia_pos` |

## الشبكة

كلا الكونتينرين (MySQL والكاشير) متصلين عبر شبكة Docker مشتركة باسم `mirmaia_network`
