import express, { Request, Response } from 'express';
import { getPool } from '../database/connection';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/** List all inventory items (raw materials) */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, quantity, unit_cost, min_quantity, created_at, updated_at FROM inventory_items ORDER BY name'
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/** Create inventory item */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const { name, quantity = 0, unit_cost, min_quantity = 0 } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const pool = getPool();
    const [result]: any = await pool.execute(
      'INSERT INTO inventory_items (name, quantity, unit_cost, min_quantity) VALUES (?, ?, ?, ?)',
      [String(name).trim(), Number(quantity) || 0, unit_cost != null ? Number(unit_cost) : null, Number(min_quantity) || 0]
    );
    res.status(201).json({ id: result.insertId, message: 'Inventory item created' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Update inventory item */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const { name, quantity, unit_cost, min_quantity } = req.body;
    const pool = getPool();
    const updates: string[] = [];
    const values: any[] = [];
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(String(name).trim());
    }
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(Number(quantity));
    }
    if (unit_cost !== undefined) {
      updates.push('unit_cost = ?');
      values.push(unit_cost === null || unit_cost === '' ? null : Number(unit_cost));
    }
    if (min_quantity !== undefined) {
      updates.push('min_quantity = ?');
      values.push(Number(min_quantity) || 0);
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    values.push(id);
    await pool.execute(
      `UPDATE inventory_items SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    res.json({ message: 'Updated' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Delete inventory item */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const pool = getPool();
    await pool.execute('DELETE FROM inventory_items WHERE id = ?', [id]);
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Deduction log (audit trail) - all automatic deductions from orders */
router.get('/deduction-log', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { order_id, inventory_item_id, start_date, end_date } = req.query;
    const pool = getPool();
    let sql = `
      SELECT idl.*, o.order_number, o.created_at as order_date
      FROM inventory_deduction_log idl
      JOIN orders o ON o.id = idl.order_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (order_id) {
      sql += ' AND idl.order_id = ?';
      params.push(order_id);
    }
    if (inventory_item_id) {
      sql += ' AND idl.inventory_item_id = ?';
      params.push(inventory_item_id);
    }
    if (start_date) {
      sql += ' AND idl.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND idl.created_at <= ?';
      params.push(end_date);
    }
    sql += ' ORDER BY idl.created_at DESC LIMIT 500';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/** Adjust stock (add/remove) - for manual restock */
router.post('/:id/adjust', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const { quantity_change } = req.body; // positive = add, negative = remove
    const delta = Number(quantity_change);
    if (isNaN(delta) || delta === 0) {
      return res.status(400).json({ error: 'quantity_change required (non-zero number)' });
    }
    const pool = getPool();
    const [rows]: any = await pool.execute('SELECT quantity FROM inventory_items WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    const newQty = rows[0].quantity + delta;
    if (newQty < 0) {
      return res.status(400).json({ error: 'Insufficient quantity' });
    }
    await pool.execute('UPDATE inventory_items SET quantity = ? WHERE id = ?', [newQty, id]);
    res.json({ message: 'Adjusted', new_quantity: newQty });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
