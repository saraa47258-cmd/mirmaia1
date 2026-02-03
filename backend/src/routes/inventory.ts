import express, { Request, Response } from 'express';
import { getPool } from '../database/connection';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get inventory
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    
    const [inventory] = await pool.execute(`
      SELECT i.id, i.product_id, p.name, i.quantity, i.min_quantity, i.max_quantity,
             CASE 
               WHEN i.quantity <= i.min_quantity THEN 'low'
               WHEN i.quantity >= i.max_quantity THEN 'high'
               ELSE 'normal'
             END as status
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      ORDER BY p.name
    `);
    
    res.json(inventory);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items
router.get('/low-stock/list', authMiddleware, async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    
    const [items] = await pool.execute(`
      SELECT i.id, p.id as product_id, p.name, i.quantity, i.min_quantity
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.quantity <= i.min_quantity
      ORDER BY i.quantity ASC
    `);
    
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory (Add stock)
router.post('/adjust', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    const { product_id, quantity, operation_type, notes } = req.body;
    
    const pool = getPool();
    
    // Update inventory
    await pool.execute(
      'UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?',
      [quantity, product_id]
    );
    
    // Log the adjustment
    await pool.execute(
      'INSERT INTO inventory_logs (product_id, quantity_change, operation_type, notes, user_id) VALUES (?, ?, ?, ?, ?)',
      [product_id, quantity, operation_type || 'adjustment', notes, user.id]
    );
    
    res.json({ message: 'Inventory updated' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get inventory logs
router.get('/logs/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { product_id, start_date, end_date } = req.query;
    const pool = getPool();
    
    let query = 'SELECT il.*, p.name FROM inventory_logs il JOIN products p ON il.product_id = p.id WHERE 1=1';
    const params: any = [];
    
    if (product_id) {
      query += ' AND il.product_id = ?';
      params.push(product_id);
    }
    
    if (start_date) {
      query += ' AND il.created_at >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND il.created_at <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY il.created_at DESC LIMIT 500';
    
    const [logs] = await pool.execute(query, params);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
