import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getPool } from '../database/connection';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Same path as index.ts - use cwd so uploads work locally and in Docker
const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (_err) {
  // ignore if already exists
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = (file.originalname && path.extname(file.originalname)) || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext.toLowerCase()) ? ext : '.jpg';
    cb(null, `product-${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);
    if (allowed) cb(null, true);
    else cb(new Error('صيغة الملف غير مدعومة. استخدم: jpg, png, gif, webp'));
  },
});

// Get all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const [products] = await pool.execute(`
      SELECT p.id, p.category_id, p.name, p.description, p.price, p.cost, 
             p.image_url, c.name as category, p.is_available
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY c.name, p.name
    `);
    
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get products by category
router.get('/category/:categoryId', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const pool = getPool();
    
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE category_id = ? AND is_available = true',
      [categoryId]
    );
    
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add product (Admin only) – multipart with optional image
router.post('/', authMiddleware, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const body = req.body as Record<string, string>;
    const category_id = body.category_id != null ? Number(body.category_id) : undefined;
    const name = body.name;
    const description = body.description || null;
    const price = body.price != null ? parseFloat(body.price) : undefined;
    const cost = body.cost != null && body.cost !== '' ? parseFloat(body.cost) : null;
    
    if (category_id == null || !name || price == null) {
      return res.status(400).json({ error: 'category_id, name, price مطلوبة' });
    }
    
    let image_url: string | null = null;
    if (req.file) {
      image_url = `/uploads/products/${req.file.filename}`;
    }
    
    const pool = getPool();
    const [result]: any = await pool.execute(
      'INSERT INTO products (category_id, name, description, price, cost, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [category_id, name, description, price, cost, image_url]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Product added' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update product (Admin only) – multipart with optional new image
router.put('/:id', authMiddleware, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const body = req.body as Record<string, string>;
    const category_id = body.category_id != null ? Number(body.category_id) : undefined;
    const name = body.name;
    const description = body.description || null;
    const price = body.price != null ? parseFloat(body.price) : undefined;
    const cost = body.cost != null && body.cost !== '' ? parseFloat(body.cost) : null;
    const is_available = body.is_available !== 'false';
    
    let image_url: string | undefined;
    if (req.file) {
      image_url = `/uploads/products/${req.file.filename}`;
    }
    
    const pool = getPool();
    if (image_url != null) {
      if (category_id != null) {
        await pool.execute(
          'UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, cost = ?, is_available = ?, image_url = ? WHERE id = ?',
          [category_id, name, description, price, cost, is_available, image_url, id]
        );
      } else {
        await pool.execute(
          'UPDATE products SET name = ?, description = ?, price = ?, cost = ?, is_available = ?, image_url = ? WHERE id = ?',
          [name, description, price, cost, is_available, image_url, id]
        );
      }
    } else {
      if (category_id != null) {
        await pool.execute(
          'UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, cost = ?, is_available = ? WHERE id = ?',
          [category_id, name, description, price, cost, is_available, id]
        );
      } else {
        await pool.execute(
          'UPDATE products SET name = ?, description = ?, price = ?, cost = ?, is_available = ? WHERE id = ?',
          [name, description, price, cost, is_available, id]
        );
      }
    }
    
    res.json({ message: 'Product updated' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete product (Admin only)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const pool = getPool();
    
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
