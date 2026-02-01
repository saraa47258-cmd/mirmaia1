-- Mirmaia Coffee Shop POS Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'cashier') DEFAULT 'cashier',
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  image_url VARCHAR(255),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  min_quantity INT DEFAULT 5,
  max_quantity INT DEFAULT 100,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY unique_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inventory Logs Table (تتبع المخزن)
CREATE TABLE IF NOT EXISTS inventory_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  quantity_change INT NOT NULL,
  operation_type ENUM('purchase', 'sale', 'adjustment', 'return') NOT NULL,
  notes TEXT,
  user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tables (الطاولات)
CREATE TABLE IF NOT EXISTS `tables` (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  cashier_id INT NOT NULL,
  table_id INT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  payment_method ENUM('cash', 'card', 'both') DEFAULT 'cash',
  order_status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cashier_id) REFERENCES users(id),
  FOREIGN KEY (table_id) REFERENCES `tables`(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inventory Items (المواد الخام)
CREATE TABLE IF NOT EXISTS inventory_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10, 4) DEFAULT NULL,
  min_quantity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Product Inventory Usage (ربط المنتجات بالمواد الخام)
CREATE TABLE IF NOT EXISTS product_inventory_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  inventory_item_id INT NOT NULL,
  quantity_per_order DECIMAL(10, 4) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_inventory (product_id, inventory_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inventory Deduction Log (سجل خصم المخزن عند الطلبات)
CREATE TABLE IF NOT EXISTS inventory_deduction_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  order_item_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  inventory_item_id INT NOT NULL,
  inventory_item_name VARCHAR(255) NOT NULL,
  quantity_deducted DECIMAL(10, 4) NOT NULL,
  unit_selling_price DECIMAL(10, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Daily Closures (الإغلاق اليومي)
CREATE TABLE IF NOT EXISTS daily_closures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  closure_date DATE NOT NULL UNIQUE,
  closed_by_user_id INT NOT NULL,
  cashier_name VARCHAR(255) NOT NULL,
  total_orders INT NOT NULL DEFAULT 0,
  total_sales DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_tax DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cash_sales DECIMAL(12, 2) NOT NULL DEFAULT 0,
  card_sales DECIMAL(12, 2) NOT NULL DEFAULT 0,
  opening_balance DECIMAL(12, 2) DEFAULT NULL,
  closing_balance DECIMAL(12, 2) DEFAULT NULL,
  notes TEXT,
  closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (closed_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Daily Reports Table
CREATE TABLE IF NOT EXISTS daily_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_date DATE NOT NULL,
  total_orders INT DEFAULT 0,
  total_sales DECIMAL(12, 2) DEFAULT 0,
  total_discount DECIMAL(10, 2) DEFAULT 0,
  total_tax DECIMAL(10, 2) DEFAULT 0,
  cash_sales DECIMAL(12, 2) DEFAULT 0,
  card_sales DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Monthly Reports Table
CREATE TABLE IF NOT EXISTS monthly_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_month INT NOT NULL,
  report_year INT NOT NULL,
  total_orders INT DEFAULT 0,
  total_sales DECIMAL(12, 2) DEFAULT 0,
  total_discount DECIMAL(10, 2) DEFAULT 0,
  total_tax DECIMAL(10, 2) DEFAULT 0,
  average_transaction DECIMAL(10, 2),
  top_product_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (top_product_id) REFERENCES products(id),
  UNIQUE KEY unique_month (report_month, report_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user (كلمة المرور: admin123)
INSERT INTO users (name, email, `password`, role) 
VALUES ('Admin Mirmaia', 'admin@mirmaia.com', '$2a$10$mGD4ePGSZ66UwlhcWnwKveD672bFIk7VmF7ZaGAzklQeeW8vIumQu', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Insert second admin (كلمة المرور: admin)
INSERT INTO users (name, email, `password`, role) 
VALUES ('Admin', 'admin@admin.com', '$2a$10$e8oEt1amvrgeU5em5y/The9SY8xirfyCDne2Wes4rbYg5aFuQyc0O', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Insert default categories
INSERT INTO categories (name, description) 
VALUES 
('قهوة', 'المشروبات الساخة والقهوة'),
('عصائر', 'العصائر الطازجة'),
('وجبات خفيفة', 'الوجبات الخفيفة والحلويات'),
('مشروبات باردة', 'المشروبات الباردة'),
('أخرى', 'منتجات أخرى')
ON DUPLICATE KEY UPDATE id=id;
