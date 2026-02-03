import express, { Request, Response } from 'express';
import { getPool } from '../database/connection';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all categories (للجميع - للعرض في الكاشير والمنيو)
router.get('/', async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const [categories] = await pool.execute(
      'SELECT id, name, description, created_at FROM categories ORDER BY name'
    );
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add category (Admin only)
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح' });
    }
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'اسم القسم مطلوب' });
    }
    const pool = getPool();
    const [result]: any = await pool.execute(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name.trim(), description?.trim() || null]
    );
    res.status(201).json({ id: result.insertId, message: 'تم إضافة القسم' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update category (Admin only)
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح' });
    }
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'اسم القسم مطلوب' });
    }
    const pool = getPool();
    const [rows]: any = await pool.execute(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name.trim(), description?.trim() || null, id]
    );
    if (rows.affectedRows === 0) {
      return res.status(404).json({ error: 'القسم غير موجود' });
    }
    res.json({ message: 'تم تحديث القسم' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete category (Admin only) - لا يحذف إذا كان فيه منتجات
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح' });
    }
    const { id } = req.params;
    const pool = getPool();
    const [products]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );
    if (products[0].count > 0) {
      return res.status(400).json({
        error: 'لا يمكن حذف القسم لأنه يحتوي على منتجات. انقل المنتجات لقسم آخر أولاً.',
      });
    }
    const [rows]: any = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    if (rows.affectedRows === 0) {
      return res.status(404).json({ error: 'القسم غير موجود' });
    }
    res.json({ message: 'تم حذف القسم' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
