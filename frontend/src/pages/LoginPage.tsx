import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import '../styles/pages.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@mirmaia.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/cashier');
    } catch (err: any) {
      setError(err.response?.data?.error || 'فشل تسجيل الدخول - تحقق من البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">☕</div>
          <h1 className="login-title">mirmaia</h1>
          <p className="login-subtitle">نظام نقاط البيع الاحترافي</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              ⚠️ {error}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mirmaia.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              required
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="login-btn"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                جاري التحميل...
              </>
            ) : (
              '🔐 تسجيل الدخول'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>💡 حسابات تجريبية: admin@mirmaia.com / admin123 — admin@admin.com / admin</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
