import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import '../styles/pages.css';

interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at?: string;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (e) {
      console.error(e);
      setError('فشل تحميل الأقسام');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setShowForm(true);
    setError('');
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, description: cat.description || '' });
    setShowForm(true);
    setError('');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('اسم القسم مطلوب');
      return;
    }
    setSubmitLoading(true);
    setError('');
    try {
      if (editingId) {
        await axios.put(`/api/categories/${editingId}`, formData);
        alert('تم تحديث القسم');
      } else {
        await axios.post('/api/categories', formData);
        alert('تم إضافة القسم');
      }
      fetchCategories();
      handleCloseForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'حدث خطأ');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`حذف القسم "${name}"؟ لا يمكن الحذف إذا كان يحتوي على منتجات.`)) return;
    try {
      await axios.delete(`/api/categories/${id}`);
      alert('تم حذف القسم');
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.error || 'فشل الحذف');
    }
  };

  return (
    <div className="page-container">
      <Navigation />
      <main className="main-content">
        <div className="categories-page">
          <header className="categories-header">
            <div>
              <h1 className="categories-title">الأقسام</h1>
              <p className="categories-subtitle">إدارة أقسام المنتجات (الفئات) وحفظها في قاعدة البيانات</p>
            </div>
            <button type="button" className="categories-btn-add" onClick={handleOpenAdd}>
              + إضافة قسم
            </button>
          </header>

          {showForm && (
            <section className="categories-form-card">
              <h2 className="categories-form-title">{editingId ? 'تعديل القسم' : 'إضافة قسم جديد'}</h2>
              <form onSubmit={handleSubmit}>
                {error && <div className="categories-form-error">{error}</div>}
                <div className="categories-form-group">
                  <label className="categories-form-label">اسم القسم</label>
                  <input
                    type="text"
                    className="categories-form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: قهوة، عصائر"
                    required
                  />
                </div>
                <div className="categories-form-group">
                  <label className="categories-form-label">الوصف (اختياري)</label>
                  <textarea
                    className="categories-form-input categories-form-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف القسم"
                    rows={2}
                  />
                </div>
                <div className="categories-form-actions">
                  <button type="submit" className="categories-form-btn-submit" disabled={submitLoading}>
                    {submitLoading ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'إضافة'}
                  </button>
                  <button type="button" className="categories-form-btn-cancel" onClick={handleCloseForm}>
                    إلغاء
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="categories-list-card">
            <h2 className="categories-list-title">قائمة الأقسام</h2>
            {loading ? (
              <p className="categories-loading">جاري التحميل...</p>
            ) : categories.length === 0 ? (
              <p className="categories-empty">لا توجد أقسام. أضف قسماً من زر "إضافة قسم".</p>
            ) : (
              <div className="categories-table-wrap">
                <table className="categories-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>اسم القسم</th>
                      <th>الوصف</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, index) => (
                      <tr key={cat.id}>
                        <td>{index + 1}</td>
                        <td><strong>{cat.name}</strong></td>
                        <td>{cat.description || '—'}</td>
                        <td>
                          <button
                            type="button"
                            className="categories-btn-edit"
                            onClick={() => handleOpenEdit(cat)}
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            className="categories-btn-delete"
                            onClick={() => handleDelete(cat.id, cat.name)}
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default CategoriesPage;
