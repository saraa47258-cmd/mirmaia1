import express, { Request, Response } from 'express';
import { getPool } from '../database/connection';
import { authMiddleware } from '../middleware/auth';
import bcryptjs from 'bcryptjs';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const pool = getPool();
    const [users] = await pool.execute(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    const pool = getPool();
    
    const [userData]: any = await pool.execute(
      'SELECT id, name, email, role, phone, is_active FROM users WHERE id = ?',
      [user.id]
    );
    
    res.json(userData[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add user (Admin only)
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { name, email, password, role, phone } = req.body;
    const pool = getPool();
    
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    const [result]: any = await pool.execute(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, phone]
    );
    
    res.status(201).json({ id: result.insertId, message: 'User created' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update user
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser: any = req.user;
    const { id } = req.params;
    const { name, email, phone, role, is_active } = req.body;
    
    // User can only update their own profile unless admin
    if (authUser.id !== parseInt(id as string) && authUser.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const pool = getPool();
    
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, phone = ?, role = COALESCE(?, role), is_active = COALESCE(?, is_active) WHERE id = ?',
      [name, email, phone, authUser.role === 'admin' ? role : null, 
       authUser.role === 'admin' ? is_active : null, id]
    );
    
    res.json({ message: 'User updated' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Change password
router.post('/change-password/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    if (user.id !== parseInt(id as string)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const pool = getPool();
    const [userData]: any = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [id]
    );
    
    if (!userData[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const passwordMatch = await bcryptjs.compare(currentPassword, userData[0].password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deactivate user (Admin only)
router.post('/:id/deactivate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user: any = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const pool = getPool();
    
    await pool.execute('UPDATE users SET is_active = false WHERE id = ?', [id]);
    res.json({ message: 'User deactivated' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
