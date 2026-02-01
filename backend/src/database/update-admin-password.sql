-- تحديث/إضافة حسابات المسؤول الافتراضية
-- استخدم في phpMyAdmin أو: docker exec -i mirmaia-db mysql -umirmaia_user -pmirmaia_pass123 mirmaia_pos < backend/src/database/update-admin-password.sql

-- admin@mirmaia.com → كلمة المرور: admin123
UPDATE users 
SET `password` = '$2a$10$mGD4ePGSZ66UwlhcWnwKveD672bFIk7VmF7ZaGAzklQeeW8vIumQu' 
WHERE email = 'admin@mirmaia.com';

-- admin@admin.com → كلمة المرور: admin
INSERT INTO users (name, email, `password`, role) 
VALUES ('Admin', 'admin@admin.com', '$2a$10$e8oEt1amvrgeU5em5y/The9SY8xirfyCDne2Wes4rbYg5aFuQyc0O', 'admin')
ON DUPLICATE KEY UPDATE `password` = '$2a$10$e8oEt1amvrgeU5em5y/The9SY8xirfyCDne2Wes4rbYg5aFuQyc0O';
