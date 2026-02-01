import express, { Request, Response } from 'express';
import { getPool } from '../database/connection';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/** Get usage for a product (which inventory items it uses and how much per order) */
router.get('/product/:productId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT piu.id, piu.product_id, piu.inventory_item_id, piu.quantity_per_order,
              ii.name as inventory_item_name, ii.quantity as inventory_item_quantity
       FROM product_inventory_usage piu
       JOIN inventory_items ii ON ii.id = piu.inventory_item_id
       WHERE piu.product_id = ?
       ORDER BY ii.name`,
      [productId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/** Get all usages (for admin) */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT piu.id, piu.product_id, piu.inventory_item_id, piu.quantity_per_order,
              p.name as product_name, ii.name as inventory_item_name, ii.quantity as inventory_item_quantity
       FROM product_inventory_usage piu
       JOIN products p ON p.id = piu.product_id
       JOIN inventory_items ii ON ii.id = piu.inventory_item_id
       ORDER BY p.name, ii.name`
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/** Set usage: link product to inventory item with quantity per order */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const { product_id, inventory_item_id, quantity_per_order = 1 } = req.body;
    if (!product_id || !inventory_item_id) {
      return res.status(400).json({ error: 'product_id and inventory_item_id required' });
    }
    const qty = Number(quantity_per_order);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'quantity_per_order must be positive' });
    }
    const pool = getPool();
    await pool.execute(
      `INSERT INTO product_inventory_usage (product_id, inventory_item_id, quantity_per_order)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity_per_order = VALUES(quantity_per_order)`,
      [product_id, inventory_item_id, qty]
    );
    res.status(201).json({ message: 'Usage saved' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Remove usage */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const pool = getPool();
    await pool.execute('DELETE FROM product_inventory_usage WHERE id = ?', [id]);
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
