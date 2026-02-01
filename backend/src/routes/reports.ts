import express, { Request, Response } from 'express';
import { getPool } from '../database/connection';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get daily report
router.get('/daily', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const pool = getPool();
    
    const reportDate = date || new Date().toISOString().split('T')[0];
    
    const [report]: any = await pool.execute(
      'SELECT * FROM daily_reports WHERE report_date = ?',
      [reportDate]
    );
    
    // Get order details for the day
    const [orders]: any = await pool.execute(`
      SELECT COUNT(*) as total_orders, SUM(total_amount) as total_sales,
             SUM(tax_amount) as total_tax, SUM(discount_amount) as total_discount
      FROM orders 
      WHERE DATE(created_at) = ? AND order_status = 'completed'
    `, [reportDate]);
    
    // Get payment breakdown
    const [paymentBreakdown] = await pool.execute(`
      SELECT payment_method, COUNT(*) as count, SUM(total_amount) as amount
      FROM orders
      WHERE DATE(created_at) = ? AND order_status = 'completed'
      GROUP BY payment_method
    `, [reportDate]);
    
    res.json({
      date: reportDate,
      summary: report[0] || orders[0],
      paymentBreakdown,
      timestamp: new Date()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly report
router.get('/monthly', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    const pool = getPool();
    
    const currentDate = new Date();
    const reportMonth = month || currentDate.getMonth() + 1;
    const reportYear = year || currentDate.getFullYear();
    
    const [report]: any = await pool.execute(
      'SELECT * FROM monthly_reports WHERE report_month = ? AND report_year = ?',
      [reportMonth, reportYear]
    );
    
    // Calculate monthly statistics
    const [stats]: any = await pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_sales,
        SUM(tax_amount) as total_tax,
        SUM(discount_amount) as total_discount,
        AVG(total_amount) as avg_transaction,
        MIN(total_amount) as min_transaction,
        MAX(total_amount) as max_transaction
      FROM orders
      WHERE YEAR(created_at) = ? AND MONTH(created_at) = ? AND order_status = 'completed'
    `, [reportYear, reportMonth]);
    
    // Top products
    const [topProducts]: any = await pool.execute(`
      SELECT p.id, p.name, SUM(oi.quantity) as total_sold, SUM(oi.subtotal) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE YEAR(o.created_at) = ? AND MONTH(o.created_at) = ? AND o.order_status = 'completed'
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 10
    `, [reportYear, reportMonth]);
    
    // Daily breakdown
    const [dailyBreakdown]: any = await pool.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as sales
      FROM orders
      WHERE YEAR(created_at) = ? AND MONTH(created_at) = ? AND order_status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [reportYear, reportMonth]);
    
    res.json({
      period: { month: reportMonth, year: reportYear },
      summary: stats[0],
      topProducts,
      dailyBreakdown
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get sales by category
router.get('/sales/by-category', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    const pool = getPool();
    
    let query = `
      SELECT c.name as category, COUNT(oi.id) as items_sold, SUM(oi.subtotal) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_status = 'completed'
    `;
    
    const params: any = [];
    
    if (start_date) {
      query += ' AND o.created_at >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND o.created_at <= ?';
      params.push(end_date);
    }
    
    query += ' GROUP BY c.id, c.name ORDER BY total_revenue DESC';
    
    const [sales] = await pool.execute(query, params);
    res.json(sales);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
