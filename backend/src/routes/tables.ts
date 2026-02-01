import express, { Request, Response } from 'express';
import { getPool } from '../database/connection';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/** GET /api/tables — قائمة الطاولات (للجميع) */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const [rows]: any = await pool.execute(
      'SELECT id, name, sort_order FROM tables ORDER BY sort_order ASC, id ASC'
    );
    res.json(rows || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/** POST /api/tables — إضافة طاولات (مسؤول فقط): body: { count: number } ينشئ طاولة 1، طاولة 2، ... */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح' });
    }
    const { count } = req.body;
    const n = Math.min(Math.max(parseInt(String(count), 10) || 0, 1), 200);
    if (n < 1) {
      return res.status(400).json({ error: 'عدد الطاولات يجب أن يكون 1 أو أكثر' });
    }
    const pool = getPool();
    const [countRows]: any = await pool.query('SELECT COUNT(*) AS cnt FROM tables');
    const startNum = (countRows?.[0]?.cnt ?? 0) + 1;
    for (let i = 0; i < n; i++) {
      const num = startNum + i;
      await pool.execute(
        'INSERT INTO tables (name, sort_order) VALUES (?, ?)',
        [`طاولة ${num}`, num]
      );
    }
    const [rows]: any = await pool.execute('SELECT id, name, sort_order FROM tables ORDER BY sort_order ASC, id ASC');
    res.status(201).json(rows || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/** DELETE /api/tables/:id — حذف طاولة (مسؤول فقط) */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح' });
    }
    const idParam = typeof req.params.id === 'string' ? req.params.id : (Array.isArray(req.params.id) ? req.params.id[0] : '');
    const id = parseInt(idParam, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'معرف غير صالح' });
    const pool = getPool();
    await pool.execute('UPDATE orders SET table_id = NULL WHERE table_id = ?', [id]);
    await pool.execute('DELETE FROM tables WHERE id = ?', [id]);
    res.json({ message: 'تم حذف الطاولة' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
