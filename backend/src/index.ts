import express, { Express, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';
import authRoutes from './routes/auth';
import categoriesRoutes from './routes/categories';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import usersRoutes from './routes/users';
import inventoryRoutes from './routes/inventory';
import inventoryItemsRoutes from './routes/inventoryItems';
import productInventoryUsageRoutes from './routes/productInventoryUsage';
import tablesRoutes from './routes/tables';
import dailyClosureRoutes from './routes/dailyClosure';
import reportsRoutes from './routes/reports';
import { initializeDatabase } from './database/connection';

const app: Express = express();

// Ensure uploads directory exists (for product images) - use cwd so it works locally and in Docker
const uploadsBase = path.join(process.cwd(), 'uploads');
const uploadsDir = path.join(uploadsBase, 'products');
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads dir:', uploadsDir);
} catch (err) {
  console.error('Could not create uploads dir:', uploadsDir, err);
}

// Middleware (allow cross-origin images so frontend can load them from different port)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Serve uploaded product images from /uploads
app.use('/uploads', express.static(uploadsBase));

// API route for product images (same origin as API - works with proxy)
app.get('/api/uploads/products/:filename', (req: Request, res: Response) => {
  const raw = req.params.filename;
  const filename = typeof raw === 'string' ? raw : (Array.isArray(raw) ? raw[0] : '');
  if (!filename || !/^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
    return res.status(400).send('Invalid filename');
  }
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Not found');
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.sendFile(path.resolve(filePath));
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/inventory-items', inventoryItemsRoutes);
app.use('/api/product-inventory-usage', productInventoryUsageRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/daily-closure', dailyClosureRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    await initializeDatabase();
    console.log(`✅ Mirmaia POS Server running on port ${PORT}`);
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
});

export default app;
