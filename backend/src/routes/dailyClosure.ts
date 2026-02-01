import express, { Request, Response } from 'express';
import { getPool } from '../database/connection';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

const today = () => new Date().toISOString().split('T')[0];

/** GET /api/daily-closure/today-summary — ملخص اليوم من الطلبات (للعرض قبل الإغلاق) */
router.get('/today-summary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const date = today();
    const [summary]: any = await pool.execute(
      `SELECT 
        COUNT(*) AS total_orders,
        COALESCE(SUM(total_amount), 0) AS total_sales,
        COALESCE(SUM(tax_amount), 0) AS total_tax,
        COALESCE(SUM(discount_amount), 0) AS total_discount,
        COALESCE(SUM(CASE WHEN payment_method IN ('cash', 'both') THEN total_amount ELSE 0 END), 0) AS cash_sales,
        COALESCE(SUM(CASE WHEN payment_method IN ('card', 'visa') THEN total_amount ELSE 0 END), 0) AS card_sales
       FROM orders
       WHERE DATE(created_at) = ?`,
      [date]
    );
    const [existing]: any = await pool.execute(
      'SELECT id, closed_at FROM daily_closures WHERE closure_date = ?',
      [date]
    );
    res.json({
      date,
      summary: summary[0] || {},
      alreadyClosed: (existing?.length ?? 0) > 0,
      closedAt: existing?.[0]?.closed_at || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/** POST /api/daily-closure — إغلاق اليوم وحفظ الحسابات */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    const { opening_balance, closing_balance, notes } = req.body;
    const pool = getPool();
    const date = today();

    const [existing]: any = await pool.execute(
      'SELECT id FROM daily_closures WHERE closure_date = ?',
      [date]
    );
    if (existing?.length > 0) {
      return res.status(400).json({ error: 'تم إغلاق هذا اليوم مسبقاً' });
    }

    const [summary]: any = await pool.execute(
      `SELECT 
        COUNT(*) AS total_orders,
        COALESCE(SUM(total_amount), 0) AS total_sales,
        COALESCE(SUM(tax_amount), 0) AS total_tax,
        COALESCE(SUM(discount_amount), 0) AS total_discount,
        COALESCE(SUM(CASE WHEN payment_method IN ('cash', 'both') THEN total_amount ELSE 0 END), 0) AS cash_sales,
        COALESCE(SUM(CASE WHEN payment_method IN ('card', 'visa') THEN total_amount ELSE 0 END), 0) AS card_sales
       FROM orders
       WHERE DATE(created_at) = ?`,
      [date]
    );
    const s = summary[0] || {};
    const cashierName = user?.name || 'غير معروف';

    await pool.execute(
      `INSERT INTO daily_closures (
        closure_date, closed_by_user_id, cashier_name,
        total_orders, total_sales, total_tax, total_discount, cash_sales, card_sales,
        opening_balance, closing_balance, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        user?.id ?? 0,
        cashierName,
        Number(s.total_orders) || 0,
        Number(s.total_sales) || 0,
        Number(s.total_tax) || 0,
        Number(s.total_discount) || 0,
        Number(s.cash_sales) || 0,
        Number(s.card_sales) || 0,
        opening_balance != null && opening_balance !== '' ? Number(opening_balance) : null,
        closing_balance != null && closing_balance !== '' ? Number(closing_balance) : null,
        notes && String(notes).trim() ? String(notes).trim() : null,
      ]
    );

    const [rows]: any = await pool.execute(
      'SELECT * FROM daily_closures WHERE closure_date = ?',
      [date]
    );
    res.status(201).json(rows[0] || { message: 'تم إغلاق اليوم بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/** GET /api/daily-closures — قائمة الإغلاقات اليومية (للتقارير) */
router.get('/list', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { date_from, date_to } = req.query;
    const pool = getPool();
    let query = 'SELECT * FROM daily_closures WHERE 1=1';
    const params: any[] = [];
    if (date_from) {
      query += ' AND closure_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      query += ' AND closure_date <= ?';
      params.push(date_to);
    }
    query += ' ORDER BY closure_date DESC, closed_at DESC LIMIT 365';
    const [rows]: any = await pool.execute(query, params);
    res.json(rows || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/** GET /api/daily-closures/:id — تفاصيل إغلاق واحد (للتقارير) */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const idParam = typeof req.params.id === 'string' ? req.params.id : (Array.isArray(req.params.id) ? req.params.id[0] : '');
    const id = parseInt(idParam, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'معرف غير صالح' });
    const pool = getPool();
    const [rows]: any = await pool.execute('SELECT * FROM daily_closures WHERE id = ?', [id]);
    if (!rows?.length) return res.status(404).json({ error: 'الإغلاق غير موجود' });
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
