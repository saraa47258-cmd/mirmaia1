import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import useAuthStore from '../store/authStore';
import '../styles/pages.css';

interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  order_status: string;
  payment_method: string;
  created_at: string;
  cashier_id?: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
  }, []);

  const fetchStats = async () => {
    try {
      const [users, products, dailyReport] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/products'),
        axios.get('/api/reports/daily'),
      ]);

      const usersList = Array.isArray(users?.data) ? users.data : [];
      const productsList = Array.isArray(products?.data) ? products.data : [];
      const summary = dailyReport?.data?.summary || {};

      setStats({
        totalUsers: usersList.length,
        totalProducts: productsList.length,
        todayOrders: Number(summary.total_orders) || 0,
        todayRevenue: Number(summary.total_sales) || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      const data = Array.isArray(response?.data) ? response.data : [];
      setRecentOrders(data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching orders:', error);
      setRecentOrders([]);
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (dateString == null || dateString === '') return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('ar-SA', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const paymentLabel: Record<string, string> = { cash: 'نقد', card: 'بطاقة', both: 'كلاهما' };

  return (
    <div className="page-container">
      <Navigation />
      
      <main className="main-content">
        <div className="dashboard-page">
          {/* Header */}
          <header className="dashboard-header">
            <div className="dashboard-title-section">
              <h1 className="dashboard-title">لوحة التحكم</h1>
              <p className="dashboard-welcome">
                مرحباً {user?.name || 'بالعمل'}، إليك ملخص النشاط اليوم
              </p>
            </div>
            <Link to="/cashier" className="dashboard-cta">
              <span className="dashboard-cta-icon">💳</span>
              فتح الكاشير
            </Link>
          </header>

          {/* Stats Cards */}
          <section className="dashboard-stats" aria-label="إحصائيات سريعة">
            <article className="dashboard-stat-card stat-revenue">
              <div className="stat-icon-wrap">
                <span className="stat-icon" aria-hidden>💰</span>
              </div>
              <div className="stat-body">
                <span className="stat-value">{(Number(stats.todayRevenue) || 0).toFixed(3)}</span>
                <span className="stat-currency">ر.ع</span>
                <span className="stat-label">إيرادات اليوم</span>
              </div>
            </article>

            <article className="dashboard-stat-card stat-orders">
              <div className="stat-icon-wrap">
                <span className="stat-icon" aria-hidden>🛒</span>
              </div>
              <div className="stat-body">
                <span className="stat-value">{Number(stats.todayOrders) || 0}</span>
                <span className="stat-label">طلبات اليوم</span>
              </div>
            </article>

            <article className="dashboard-stat-card stat-products">
              <div className="stat-icon-wrap">
                <span className="stat-icon" aria-hidden>📦</span>
              </div>
              <div className="stat-body">
                <span className="stat-value">{Number(stats.totalProducts) || 0}</span>
                <span className="stat-label">إجمالي المنتجات</span>
              </div>
            </article>

            <article className="dashboard-stat-card stat-users">
              <div className="stat-icon-wrap">
                <span className="stat-icon" aria-hidden>👥</span>
              </div>
              <div className="stat-body">
                <span className="stat-value">{Number(stats.totalUsers) || 0}</span>
                <span className="stat-label">المستخدمون</span>
              </div>
            </article>
          </section>

          {/* Recent Orders + Quick Links Row */}
          <div className="dashboard-content-grid">
            {/* Recent Orders */}
            <section className="dashboard-card recent-orders">
              <div className="dashboard-card-header">
                <div className="dashboard-card-heading">
                  <h2 className="dashboard-card-title">آخر الطلبات</h2>
                  <span className="dashboard-card-subtitle">آخر 5 طلبات</span>
                </div>
                <Link to="/orders" className="dashboard-card-action">
                  عرض الكل
                  <span className="action-arrow">←</span>
                </Link>
              </div>
              <div className="recent-orders-table-wrap">
                <table className="recent-orders-table">
                  <thead>
                    <tr>
                      <th>رقم الطلب</th>
                      <th>المبلغ</th>
                      <th>الدفع</th>
                      <th>الوقت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="recent-orders-empty">
                          <span className="empty-icon">📋</span>
                          لا توجد طلبات حتى الآن
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order, idx) => (
                        <tr key={order?.id ?? order?.order_number ?? `recent-${idx}`}>
                          <td>
                            <span className="order-number">{order?.order_number || (order?.id != null ? `#${order.id}` : '—')}</span>
                          </td>
                          <td>
                            <span className="order-amount">{(Number(order?.total_amount) || 0).toFixed(3)} ر.ع</span>
                          </td>
                          <td>
                            <span className="order-payment">{paymentLabel[order?.payment_method ?? ''] ?? order?.payment_method ?? '—'}</span>
                          </td>
                          <td className="order-time">{formatDate(order?.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="dashboard-card quick-actions-card">
              <h2 className="dashboard-card-title">الإجراءات السريعة</h2>
              <div className="quick-actions-grid">
                <Link to="/cashier" className="quick-action-item">
                  <span className="quick-action-icon">💳</span>
                  <span className="quick-action-label">الكاشير</span>
                </Link>
                <Link to="/menu" className="quick-action-item">
                  <span className="quick-action-icon">📋</span>
                  <span className="quick-action-label">القائمة</span>
                </Link>
                <Link to="/inventory" className="quick-action-item">
                  <span className="quick-action-icon">📦</span>
                  <span className="quick-action-label">المخزن</span>
                </Link>
                <Link to="/reports" className="quick-action-item">
                  <span className="quick-action-icon">📈</span>
                  <span className="quick-action-label">التقارير</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
