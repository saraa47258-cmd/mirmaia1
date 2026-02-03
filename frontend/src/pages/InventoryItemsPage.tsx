import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import '../styles/inventory.clean.css';
import '../styles/inventory-items.css';
import '../styles/pages.css';

interface RawMaterial {
  id: number;
  name: string;
  quantity: number;
  unit_cost: number | null;
  min_quantity: number;
}

interface Product {
  id: number;
  name: string;
}

interface Usage {
  id: number;
  product_id: number;
  product_name: string;
  inventory_item_id: number;
  inventory_item_name: string;
  quantity_per_order: number;
  inventory_item_quantity: number;
}

interface DeductionLog {
  id: number;
  order_id: number;
  order_number: string;
  product_name: string;
  inventory_item_name: string;
  quantity_deducted: number;
  unit_selling_price: number;
  created_at: string;
}

/** عرض الكمية بدون أصفار عشرية غير مفيدة (مثل 1 بدلاً من 1.0000) */
function formatQuantity(value: number | string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return n % 1 === 0 ? String(Math.round(n)) : String(parseFloat(n.toFixed(4)));
}

const InventoryItemsPage: React.FC = () => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [usages, setUsages] = useState<Usage[]>([]);
  const [deductionLog, setDeductionLog] = useState<DeductionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'materials' | 'usage' | 'log'>('materials');

  const [formMaterial, setFormMaterial] = useState({ name: '', quantity: 0, unit_cost: '', min_quantity: 0 });
  const [formUsage, setFormUsage] = useState({ product_id: '', inventory_item_id: '', quantity_per_order: 1 });
  const [adjustQty, setAdjustQty] = useState<{ id: number; delta: string } | null>(null);

  useEffect(() => {
    fetchRawMaterials();
    fetchProducts();
    fetchUsages();
    fetchDeductionLog();
  }, []);

  const fetchRawMaterials = async () => {
    try {
      const res = await axios.get('/api/inventory-items');
      setRawMaterials(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setRawMaterials([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      const list = Array.isArray(res.data) ? res.data : [];
      setProducts(list.map((p: any) => ({ id: p.id, name: p.name })));
    } catch (e) {
      console.error(e);
      setProducts([]);
    }
  };

  const fetchUsages = async () => {
    try {
      const res = await axios.get('/api/product-inventory-usage');
      setUsages(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setUsages([]);
    }
  };

  const fetchDeductionLog = async () => {
    try {
      const res = await axios.get('/api/inventory-items/deduction-log');
      setDeductionLog(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setDeductionLog([]);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMaterial.name.trim()) return;
    setLoading(true);
    try {
      await axios.post('/api/inventory-items', {
        name: formMaterial.name.trim(),
        quantity: formMaterial.quantity,
        unit_cost: formMaterial.unit_cost === '' ? null : parseFloat(formMaterial.unit_cost),
        min_quantity: formMaterial.min_quantity,
      });
      setFormMaterial({ name: '', quantity: 0, unit_cost: '', min_quantity: 0 });
      fetchRawMaterials();
    } catch (err: any) {
      alert(err.response?.data?.error || 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustMaterial = async () => {
    if (!adjustQty || !adjustQty.delta) return;
    const delta = parseInt(adjustQty.delta, 10);
    if (isNaN(delta)) return;
    setLoading(true);
    try {
      await axios.post(`/api/inventory-items/${adjustQty.id}/adjust`, { quantity_change: delta });
      setAdjustQty(null);
      fetchRawMaterials();
    } catch (err: any) {
      alert(err.response?.data?.error || 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsage.product_id || !formUsage.inventory_item_id) return;
    setLoading(true);
    try {
      await axios.post('/api/product-inventory-usage', {
        product_id: parseInt(formUsage.product_id, 10),
        inventory_item_id: parseInt(formUsage.inventory_item_id, 10),
        quantity_per_order: formUsage.quantity_per_order,
      });
      setFormUsage({ product_id: '', inventory_item_id: '', quantity_per_order: 1 });
      fetchUsages();
    } catch (err: any) {
      alert(err.response?.data?.error || 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUsage = async (id: number) => {
    if (!window.confirm('إزالة الربط؟')) return;
    try {
      await axios.delete(`/api/product-inventory-usage/${id}`);
      fetchUsages();
    } catch (err: any) {
      alert(err.response?.data?.error || 'خطأ');
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!window.confirm('حذف المادة؟')) return;
    try {
      await axios.delete(`/api/inventory-items/${id}`);
      fetchRawMaterials();
      fetchUsages();
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
            <h1>مواد المخزون وربط المنتجات</h1>
            <p className="inv-page-subtitle">إدارة المواد الخام (مثل الأكواب) وربطها بمنتجات المنيو — الخصم التلقائي عند الطلب</p>
          </header>

          <div className="inv-tabs">
            <button type="button" className={tab === 'materials' ? 'active' : ''} onClick={() => setTab('materials')}>مواد المخزون</button>
            <button type="button" className={tab === 'usage' ? 'active' : ''} onClick={() => setTab('usage')}>ربط المنتجات</button>
            <button type="button" className={tab === 'log' ? 'active' : ''} onClick={() => setTab('log')}>سجل الخصم التلقائي</button>
          </div>

          {tab === 'materials' && (
            <>
              <section className="inv-card">
                <h2>إضافة مادة خام</h2>
                <form className="inv-form" onSubmit={handleCreateMaterial}>
                  <div className="inv-field inv-field-wide">
                    <label>اسم المادة</label>
                    <input type="text" placeholder="مثال: كوب ورقي صغير" value={formMaterial.name} onChange={e => setFormMaterial({ ...formMaterial, name: e.target.value })} required />
                  </div>
                  <div className="inv-field">
                    <label>الكمية</label>
                    <input type="number" min="0" value={formMaterial.quantity || ''} onChange={e => setFormMaterial({ ...formMaterial, quantity: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="inv-field">
                    <label>تكلفة الوحدة (اختياري)</label>
                    <input type="number" step="0.001" min="0" placeholder="0.000" value={formMaterial.unit_cost} onChange={e => setFormMaterial({ ...formMaterial, unit_cost: e.target.value })} />
                  </div>
                  <div className="inv-field">
                    <label>الحد الأدنى</label>
                    <input type="number" min="0" value={formMaterial.min_quantity || ''} onChange={e => setFormMaterial({ ...formMaterial, min_quantity: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="inv-form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'جاري الحفظ...' : 'إضافة'}</button>
                  </div>
                </form>
              </section>
              <section className="inv-card">
                <h2>قائمة المواد الخام</h2>
                <table className="modern-inventory-table">
                  <thead>
                    <tr>
                      <th>المادة</th>
                      <th>الكمية</th>
                      <th>تكلفة الوحدة</th>
                      <th>الحد الأدنى</th>
                      <th>إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawMaterials.map(m => (
                      <tr key={m.id}>
                        <td><strong>{m.name}</strong></td>
                        <td>
                          <span className={`inv-qty-badge ${m.quantity <= m.min_quantity ? 'low' : 'normal'}`}>{m.quantity}</span>
                        </td>
                        <td>{m.unit_cost != null ? Number(m.unit_cost).toFixed(3) : '—'}</td>
                        <td>{m.min_quantity}</td>
                        <td>
                          <div className="inv-action-group">
                            {adjustQty?.id === m.id ? (
                              <>
                                <input type="number" className="inv-adjust-input" value={adjustQty.delta} onChange={e => setAdjustQty({ ...adjustQty, delta: e.target.value })} placeholder="+/-" />
                                <button type="button" className="btn-primary" onClick={handleAdjustMaterial}>تطبيق</button>
                                <button type="button" className="btn-secondary" onClick={() => setAdjustQty(null)}>إلغاء</button>
                              </>
                            ) : (
                              <>
                                <button type="button" className="btn-secondary" onClick={() => setAdjustQty({ id: m.id, delta: '' })}>تعديل الكمية</button>
                                <button type="button" className="btn-danger" onClick={() => handleDeleteMaterial(m.id)}>حذف</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rawMaterials.length === 0 && (
                  <div className="inv-empty">
                    <div className="inv-empty-icon">📦</div>
                    <p>لا توجد مواد. أضف مادة من النموذج أعلاه.</p>
                  </div>
                )}
              </section>
            </>
          )}

          {tab === 'usage' && (
            <>
              <section className="inv-card">
                <h2>ربط منتج المنيو بمادة خام</h2>
                <p className="inv-card-desc">عند طلب المنتج سيتم خصم الكمية تلقائياً من المادة المرتبطة.</p>
                <form className="inv-form" onSubmit={handleCreateUsage}>
                  <div className="inv-field">
                    <label>المنتج</label>
                    <select value={formUsage.product_id} onChange={e => setFormUsage({ ...formUsage, product_id: e.target.value })} required>
                      <option value="">— اختر المنتج —</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="inv-field">
                    <label>المادة الخام</label>
                    <select value={formUsage.inventory_item_id} onChange={e => setFormUsage({ ...formUsage, inventory_item_id: e.target.value })} required>
                      <option value="">— اختر المادة —</option>
                      {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="inv-field">
                    <label>الكمية لكل طلب</label>
                    <input type="number" step="0.01" min="0.01" value={formUsage.quantity_per_order} onChange={e => setFormUsage({ ...formUsage, quantity_per_order: parseFloat(e.target.value) || 1 })} />
                  </div>
                  <span className="inv-inline-label">وحدة لكل طلب</span>
                  <div className="inv-form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'جاري الربط...' : 'ربط'}</button>
                  </div>
                </form>
              </section>
              <section className="inv-card">
                <h2>الربطات الحالية</h2>
                <table className="modern-inventory-table">
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th>المادة المستخدمة</th>
                      <th>الكمية لكل طلب</th>
                      <th>رصيد المادة</th>
                      <th>إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usages.map(u => (
                      <tr key={u.id}>
                        <td><strong>{u.product_name}</strong></td>
                        <td>{u.inventory_item_name}</td>
                        <td>{formatQuantity(u.quantity_per_order)}</td>
                        <td><span className={`inv-qty-badge ${u.inventory_item_quantity <= 0 ? 'low' : 'normal'}`}>{u.inventory_item_quantity}</span></td>
                        <td>
                          <button type="button" className="btn-danger" onClick={() => handleDeleteUsage(u.id)}>إزالة الربط</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {usages.length === 0 && (
                  <div className="inv-empty">
                    <div className="inv-empty-icon">🔗</div>
                    <p>لا توجد ربطات. أضف ربط من النموذج أعلاه.</p>
                  </div>
                )}
              </section>
            </>
          )}

          {tab === 'log' && (
            <section className="inv-card">
              <h2>سجل الخصم التلقائي</h2>
              <p className="inv-card-desc">كل خصم يتم تلقائياً عند إنشاء طلب (منتج ← مادة خام).</p>
              <table className="modern-inventory-table">
                <thead>
                  <tr>
                    <th>الوقت</th>
                    <th>رقم الطلب</th>
                    <th>المنتج</th>
                    <th>المادة المخصومة</th>
                    <th>الكمية</th>
                    <th>سعر البيع</th>
                  </tr>
                </thead>
                <tbody>
                  {deductionLog.map(l => (
                    <tr key={l.id}>
                      <td>{new Date(l.created_at).toLocaleString('ar')}</td>
                      <td>{l.order_number}</td>
                      <td><strong>{l.product_name}</strong></td>
                      <td>{l.inventory_item_name}</td>
                      <td>{l.quantity_deducted}</td>
                      <td>{Number(l.unit_selling_price).toFixed(3)} ر.ع</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {deductionLog.length === 0 && (
                <div className="inv-empty">
                  <div className="inv-empty-icon">📋</div>
                  <p>لا توجد حركات حتى الآن. ستظهر هنا بعد إتمام طلبات مرتبطة بمواد مخزون.</p>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default InventoryItemsPage;
