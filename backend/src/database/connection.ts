import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mirmaia_pos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function runMigrations(connection: mysql.PoolConnection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS tables (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  try {
    await connection.query('ALTER TABLE orders ADD COLUMN table_id INT NULL');
  } catch (e: any) {
    if (e.code !== 'ER_DUP_FIELDNAME') throw e;
  }
  try {
    await connection.query('ALTER TABLE orders ADD CONSTRAINT fk_orders_table FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL');
  } catch (e: any) {
    if (e.code !== 'ER_FK_DUP_NAME' && e.code !== 'ER_DUP_KEY') throw e;
  }
  await connection.query(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL DEFAULT 0,
      unit_cost DECIMAL(10, 4) DEFAULT NULL,
      min_quantity INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS product_inventory_usage (
      id INT PRIMARY KEY AUTO_INCREMENT,
      product_id INT NOT NULL,
      inventory_item_id INT NOT NULL,
      quantity_per_order DECIMAL(10, 4) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
      UNIQUE KEY unique_product_inventory (product_id, inventory_item_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await connection.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await connection.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    await runMigrations(connection);
    connection.release();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

export function getPool() {
  return pool;
}
