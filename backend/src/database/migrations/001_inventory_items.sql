-- Inventory Items (raw materials e.g. paper cups)
CREATE TABLE IF NOT EXISTS inventory_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL COMMENT 'e.g. Small Paper Cup',
  quantity INT NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10, 4) DEFAULT NULL,
  min_quantity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Link menu products to inventory items: how much of each item per order
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

-- Audit trail: every deduction when an order is placed
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
