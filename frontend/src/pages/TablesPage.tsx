import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import '../styles/inventory-items.css';
import '../styles/pages.css';

interface TableItem {
  id: number;
  name: string;
  sort_order: number;
}

const TablesPage: React.FC = () => {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [count, setCount] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await axios.get('/api/tables');
      setTables(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setTables([]);
    }
  };

  const handleAddTables = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Math.min(Math.max(count, 1), 200);
    setLoading(true);
    try {
      await axios.post('/api/tables', { count: n });
      setCount(10);
      fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.error || 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (id: number) => {
    if (!window.confirm('حذف هذه الطاولة؟ الطلبات المرتبطة بها ستبقى بدون طاولة.')) return;
    try {
      await axios.delete(`/api/tables/${id}`);
      fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.error || 'خطأ');
    }
  };

  return (
    <div className="page-container inv-items-page">
      <Navigation />
      <main className="main-content">
        <div className="page-content">
          <header className="inv-page-header">
            <h1>إدارة الطاولات</h1>
            <p className="inv-page-subtitle">إضافة عدد الطاولات في الكوفي — عند الطلب من الكاشير (صالة) يتم ربط الطلب بالطاولة</p>
          </header>

          <section className="inv-card">
            <h2>إضافة طاولات</h2>
            <p className="inv-card-desc">أدخل عدد الطاولات المطلوب إضافتها (طاولة 1، طاولة 2، ...)</p>
            <form className="inv-form" onSubmit={handleAddTables}>
              <div className="inv-field">
                <label>عدد الطاولات</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={count}
                  onChange={e => setCount(parseInt(e.target.value, 10) || 10)}
                />
              </div>
              <div className="inv-form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'جاري الإضافة...' : 'إضافة الطاولات'}
                </button>
              </div>
            </form>
          </section>

          <section className="inv-card">
            <h2>قائمة الطاولات</h2>
            <table className="modern-inventory-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الطاولة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t, i) => (
                  <tr key={t.id}>
                    <td>{i + 1}</td>
                    <td><strong>{t.name}</strong></td>
                    <td>
                      <button type="button" className="btn-danger" onClick={() => handleDeleteTable(t.id)}>حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tables.length === 0 && (
              <div className="inv-empty">
                <div className="inv-empty-icon">🪑</div>
                <p>لا توجد طاولات. أضف طاولات من النموذج أعلاه.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default TablesPage;
