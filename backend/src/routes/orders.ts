import express, { Request, Response } from 'express';
import { getPool } from '../database/connection';
import { authMiddleware } from '../middleware/auth';
import { 
  sumItems, 
  preciseSubtract, 
  calculateTax, 
  preciseAdd, 
  round,
  calculateItemSubtotal 
} from '../utils/calculations';

const router = express.Router();

/** Compute required inventory for order items; return { required: Map<inventory_item_id, needed>, insufficient: string | null } */
async function computeRequiredInventory(connection: any, processedItems: any[]) {
  const required = new Map<number, number>();
  for (const item of processedItems) {
    const [usages]: any = await connection.execute(
      'SELECT inventory_item_id, quantity_per_order FROM product_inventory_usage WHERE product_id = ?',
      [item.product_id]
    );
    for (const u of usages) {
      const need = (item.quantity * Number(u.quantity_per_order)) || 0;
      required.set(u.inventory_item_id, (required.get(u.inventory_item_id) || 0) + need);
    }
  }
  for (const [invId, need] of required) {
    const [rows]: any = await connection.execute('SELECT name, quantity FROM inventory_items WHERE id = ?', [invId]);
    if (!rows.length) continue;
    const have = Number(rows[0].quantity) || 0;
    if (have < need) {
      return { required, insufficient: `${rows[0].name}: مطلوب ${need}، المتوفر ${have}` };
    }
  }
  return { required, insufficient: null };
}

/** Deduct inventory and write audit log for one order item */
async function deductInventoryForOrderItem(
  connection: any,
  orderId: number,
  orderItemId: number,
  productId: number,
  productName: string,
  quantityOrdered: number,
  unitPrice: number
) {
  const [usages]: any = await connection.execute(
    `SELECT piu.inventory_item_id, piu.quantity_per_order, ii.name as inventory_item_name
     FROM product_inventory_usage piu
     JOIN inventory_items ii ON ii.id = piu.inventory_item_id
     WHERE piu.product_id = ?`,
    [productId]
  );
  for (const u of usages) {
    const deducted = quantityOrdered * Number(u.quantity_per_order);
    await connection.execute(
      'UPDATE inventory_items SET quantity = quantity - ? WHERE id = ?',
      [deducted, u.inventory_item_id]
    );
    await connection.execute(
      `INSERT INTO inventory_deduction_log
       (order_id, order_item_id, product_id, product_name, inventory_item_id, inventory_item_name, quantity_deducted, unit_selling_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, orderItemId, productId, productName, u.inventory_item_id, u.inventory_item_name, deducted, unitPrice]
    );
  }
}

// Create order
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    const { items, discount_amount = 0, payment_method = 'cash', table_id } = req.body;
    
    const pool = getPool();
    
    const processedItems = items.map((item: any) => ({
      ...item,
      subtotal: calculateItemSubtotal(item.unit_price, item.quantity)
    }));
    
    const subtotal = sumItems(processedItems);
    const totalAmount = preciseSubtract(subtotal, round(discount_amount));
    const taxAmount = calculateTax(totalAmount, 5);
    const finalTotal = preciseAdd(totalAmount, taxAmount);
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Check inventory (raw materials) before creating order
      const { insufficient } = await computeRequiredInventory(connection, processedItems);
      if (insufficient) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          error: 'رصيد المخزون غير كافٍ',
          detail: insufficient
        });
      }
      
      const orderNumber = `ORD-${Date.now()}`;
      const tableId = table_id != null && table_id !== '' ? parseInt(String(table_id), 10) : null;
      const [orderResult]: any = await connection.execute(
        'INSERT INTO orders (order_number, cashier_id, total_amount, tax_amount, discount_amount, payment_method, table_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderNumber, user.id, round(totalAmount), round(taxAmount), round(discount_amount), payment_method, Number.isNaN(tableId) ? null : tableId]
      );
      const orderId = orderResult.insertId;
      
      const [productRows]: any = await connection.execute('SELECT id, name FROM products');
      const productNames = Object.fromEntries((productRows || []).map((p: any) => [p.id, p.name]));
      
      for (const item of processedItems) {
        const [oiResult]: any = await connection.execute(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, round(item.unit_price), round(item.subtotal)]
        );
        const orderItemId = oiResult.insertId;
        await deductInventoryForOrderItem(
          connection,
          orderId,
          orderItemId,
          item.product_id,
          productNames[item.product_id] || '',
          item.quantity,
          item.unit_price
        );
      }
      
      const today = new Date().toISOString().split('T')[0];
      const [existingReport]: any = await connection.execute(
        'SELECT id FROM daily_reports WHERE report_date = ?',
        [today]
      );
      if (existingReport.length > 0) {
        await connection.execute(
          'UPDATE daily_reports SET total_orders = total_orders + 1, total_sales = total_sales + ?, total_tax = total_tax + ?, total_discount = total_discount + ? WHERE report_date = ?',
          [round(totalAmount), round(taxAmount), round(discount_amount), today]
        );
      } else {
        await connection.execute(
          'INSERT INTO daily_reports (report_date, total_orders, total_sales, total_tax, total_discount) VALUES (?, 1, ?, ?, ?)',
          [today, round(totalAmount), round(taxAmount), round(discount_amount)]
        );
      }
      
      await connection.commit();
      res.status(201).json({
        orderId,
        orderNumber,
        subtotal: round(subtotal),
        totalAmount: round(finalTotal),
        taxAmount: round(taxAmount),
        discountAmount: round(discount_amount),
        message: 'Order created successfully'
      });
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get orders (مع اسم الطاولة ودعم فلتر table_id)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { date, status, table_id } = req.query;
    const pool = getPool();
    
    let query = `
      SELECT o.*, t.name AS table_name
      FROM orders o
      LEFT JOIN tables t ON t.id = o.table_id
      WHERE 1=1
    `;
    const params: any = [];
    
    if (date) {
      query += ' AND DATE(o.created_at) = ?';
      params.push(date);
    }
    
    if (status) {
      query += ' AND o.order_status = ?';
      params.push(status);
    }
    
    if (table_id != null && table_id !== '') {
      const tid = parseInt(String(table_id), 10);
      if (tid === 0) {
        query += ' AND o.table_id IS NULL';
      } else if (!Number.isNaN(tid)) {
        query += ' AND o.table_id = ?';
        params.push(tid);
      }
    }
    
    query += ' ORDER BY o.created_at DESC LIMIT 100';
    
    const [orders] = await pool.execute(query, params);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get order details (مع اسم الطاولة)
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const [orderRows] = await pool.execute(
      'SELECT o.*, t.name AS table_name FROM orders o LEFT JOIN tables t ON t.id = o.table_id WHERE o.id = ?',
      [id]
    );
    
    const [items] = await pool.execute(
      'SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
      [id]
    );
    
    res.json({ order: (orderRows as any[])[0], items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
