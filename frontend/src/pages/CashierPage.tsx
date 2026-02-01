import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import Navigation from '../components/Navigation';
import { 
  calculateItemSubtotal, 
  calculateDiscountAmount, 
  preciseSubtract,
  formatCurrency,
  sumItems,
  round
} from '../utils/calculations';
import '../styles/cashier.css';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  is_available?: boolean;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
}

interface TableItem {
  id: number;
  name: string;
  sort_order: number;
}

const CashierPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'both'>('cash');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [discount, setDiscount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cartExpanded, setCartExpanded] = useState(false);
  const [dailyCloseOpen, setDailyCloseOpen] = useState(false);
  const [todaySummary, setTodaySummary] = useState<any>(null);
  const [dailyCloseLoading, setDailyCloseLoading] = useState(false);
  const [closeForm, setCloseForm] = useState({ opening_balance: '', closing_balance: '', notes: '' });
  
  const cart = useCartStore();
  const user = useAuthStore((state) => state.user);
  const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '') || 'http://localhost:3000';
  const getImageSrc = (imageUrl: string) => {
    if (!imageUrl || !imageUrl.trim()) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    const filename = imageUrl.replace(/^\/uploads\/products\//, '').replace(/^\/api\/uploads\/products\//, '');
    return filename ? `${apiBase}/api/uploads/products/${filename}` : '';
  };

  useEffect(() => {
    fetchProducts();
    fetchTables();
  }, []);

  useEffect(() => {
    if (dailyCloseOpen) fetchTodaySummary();
  }, [dailyCloseOpen]);

  const fetchTodaySummary = async () => {
    try {
      const res = await axios.get('/api/daily-closure/today-summary');
      setTodaySummary(res.data);
    } catch (e) {
      setTodaySummary(null);
    }
  };

  const handleDailyClose = async (e: React.FormEvent) => {
    e.preventDefault();
    setDailyCloseLoading(true);
    try {
      await axios.post('/api/daily-closure', {
        opening_balance: closeForm.opening_balance || undefined,
        closing_balance: closeForm.closing_balance || undefined,
        notes: closeForm.notes || undefined,
      });
      alert('تم إغلاق الحسابات بنجاح');
      setDailyCloseOpen(false);
      setCloseForm({ opening_balance: '', closing_balance: '', notes: '' });
      fetchTodaySummary();
    } catch (err: any) {
      alert(err.response?.data?.error || 'خطأ في الإغلاق');
    } finally {
      setDailyCloseLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await axios.get('/api/tables');
      setTables(Array.isArray(res.data) ? res.data : []);
      if (res.data?.length && !selectedTableId) setSelectedTableId(res.data[0].id);
    } catch (e) {
      setTables([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      const raw = Array.isArray(response.data) ? response.data : [];
      const list = raw.filter((p: any) => p && typeof p === 'object');
      setProducts(list);
      
      const categoryIcons: { [key: string]: string } = {
        'الكل': '🏷️',
        'المشروبات الساخنة': '☕',
        'عصائر': '🧃',
        'قهوة باردة': '🧊',
        'مشروبات غازية': '🥤',
        'حلويات': '🍰',
        'مأكولات': '🍽️',
      };
      
      const uniqueCategories = [
        { id: 0, name: 'الكل', icon: '🏷️' },
        ...Array.from(new Map(list.map((p: any) => [p?.category ?? 'أخرى', p])).values())
          .map((p: any, i: number) => ({ 
            id: i + 1, 
            name: p?.category ?? 'أخرى',
            icon: categoryIcons[p?.category] || '📦'
          }))
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setCategories([{ id: 0, name: 'الكل', icon: '🏷️' }]);
    }
  };

  const productList = Array.isArray(products) ? products : [];
  const filteredProducts = productList.filter(p => {
    const matchCategory = selectedCategory === null || selectedCategory === 0 || 
      p.category === categories[selectedCategory]?.name;
    const matchSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleAddToCart = (product: Product) => {
    const subtotal = calculateItemSubtotal(product.price, 1);
    cart.addItem({
      product_id: product.id,
      name: product.name,
      quantity: 1,
      unit_price: product.price,
      subtotal: subtotal,
    });
  };

  // حساب الإجمالي بدقة
  const subtotal = sumItems(cart.items);

  const applyDiscountPercent = (percent: number) => {
    setDiscountPercent(percent);
    const discountAmount = calculateDiscountAmount(subtotal, percent);
    setDiscount(discountAmount);
    cart.setDiscount(discountAmount);
  };

  const handleCheckout = async () => {
    if (orderType === 'dine-in' && (!selectedTableId || tables.length === 0)) {
      alert('يرجى اختيار الطاولة (أو إضافة الطاولات من لوحة التحكم → الطاولات)');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/orders', {
        items: cart.items.map(item => ({
          ...item,
          subtotal: round(item.subtotal)
        })),
        discount_amount: round(discount),
        payment_method: paymentMethod,
        table_id: orderType === 'dine-in' ? selectedTableId : null,
      });
      
      alert('تم إنشاء الطلب بنجاح' + (orderType === 'dine-in' && selectedTableId ? ` — ${tables.find(t => t.id === selectedTableId)?.name || ''}` : ''));
      cart.clear();
      setDiscount(0);
      setDiscountPercent(0);
      setCartExpanded(false);
    } catch (error: any) {
      alert('خطأ في إنشاء الطلب: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  // حساب الإجمالي النهائي بدقة
  const total = preciseSubtract(subtotal, discount);

  return (
    <div className="cashier-container">
      <Navigation />
      
      <main className="main-content">
        <div className="cashier-content">
          {/* Products Section */}
          <div className="products-section">
            <div className="products-header">
              <h2 className="products-title">الكاشير</h2>
              <p className="products-subtitle">نقطة البيع - mirmaia</p>
            </div>
            
            {/* Search */}
            <div className="products-search">
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Categories */}
            <div className="categories-section">
              <div className="categories">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span className="category-icon">{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="products-grid-container">
              <div className="products-grid">
                {filteredProducts.map((product) => {
                  const imgSrc = getImageSrc(product.image_url || '');
                  return (
                  <div 
                    key={product.id} 
                    className="product-card"
                    onClick={() => handleAddToCart(product)}
                  >
                    <div className="product-image">
                      {imgSrc ? (
                        <img 
                          src={imgSrc} 
                          alt={product.name || ''}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span className="placeholder-icon">☕</span>
                      )}
                      {product.is_available === false && (
                        <span className="product-badge out-of-stock">غير متوفر</span>
                      )}
                    </div>
                    <div className="product-info">
                      <h4 className="product-name">{product.name}</h4>
                      <p className="product-category">{product.category}</p>
                      <div className="product-footer">
                        <span className="product-price">
                          {formatCurrency(Number(product.price) || 0)}
                          <span className="currency">ر.ع</span>
                        </span>
                        <button className="btn-add">
                          + إضافة
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className={`cart-section ${cartExpanded ? 'expanded' : ''}`}>
            {/* Mobile Toggle */}
            <div className="cart-toggle" onClick={() => setCartExpanded(!cartExpanded)}>
              <div className="cart-toggle-info">
                <span className="cart-toggle-icon">🛒</span>
                <span>{cart.items.length} عناصر</span>
              </div>
              <span style={{ fontWeight: 700 }}>{formatCurrency(total)} ر.ع</span>
            </div>

            <div className="cart-header">
              <h3 className="cart-title">
                🛒 السلة
                {cart.items.length > 0 && (
                  <span className="cart-count">{cart.items.length}</span>
                )}
              </h3>
            </div>

            {/* Order Type */}
            <div className="order-type-tabs">
              <button 
                className={`order-type-btn ${orderType === 'dine-in' ? 'active' : ''}`}
                onClick={() => setOrderType('dine-in')}
              >
                <span className="icon">🍽️</span>
                <span>صالة</span>
              </button>
              <button 
                className={`order-type-btn ${orderType === 'takeaway' ? 'active' : ''}`}
                onClick={() => setOrderType('takeaway')}
              >
                <span className="icon">🥡</span>
                <span>سفري</span>
              </button>
              <button 
                className={`order-type-btn ${orderType === 'delivery' ? 'active' : ''}`}
                onClick={() => setOrderType('delivery')}
              >
                <span className="icon">🛵</span>
                <span>توصيل</span>
              </button>
            </div>

            {/* Table selector (صالة فقط) */}
            {orderType === 'dine-in' && (
              <div className="table-select-section">
                <label className="table-select-label">الطاولة</label>
                <select
                  className="table-select"
                  value={selectedTableId ?? ''}
                  onChange={e => setSelectedTableId(e.target.value ? parseInt(e.target.value, 10) : null)}
                >
                  <option value="">— اختر الطاولة —</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {tables.length === 0 && (
                  <span className="table-select-hint">أضف الطاولات من لوحة التحكم → الطاولات</span>
                )}
              </div>
            )}

            {/* Customer Info */}
            <div className="customer-section">
              <div className="customer-input-group">
                <input type="text" placeholder="اسم العميل" />
                <input type="text" placeholder="الهاتف" />
              </div>
            </div>

            {/* Cart Items */}
            <div className="cart-items">
              {cart.items.length === 0 ? (
                <div className="empty-cart">
                  <div className="empty-cart-icon">🛒</div>
                  <p className="empty-cart-text">السلة فارغة</p>
                  <p className="empty-cart-hint">اضغط على المنتجات لإضافتها</p>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div key={item.product_id} className="cart-item">
                    <div className="cart-item-image">
                      <span className="placeholder">☕</span>
                    </div>
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <p className="cart-item-price">{formatCurrency(item.unit_price)} × {item.quantity}</p>
                    </div>
                    <div className="cart-item-controls">
                      <div className="qty-control">
                        <button 
                          className="qty-btn"
                          onClick={() => cart.updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                        >
                          −
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button 
                          className="qty-btn"
                          onClick={() => cart.updateQuantity(item.product_id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <span className="cart-item-total">{formatCurrency(item.subtotal)}</span>
                    <button 
                      className="btn-remove"
                      onClick={() => cart.removeItem(item.product_id)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Discount */}
            <div className="discount-section">
              <label className="discount-label">% خصم (%)</label>
              <div className="discount-buttons">
                {[0, 5, 10, 15, 20].map((percent) => (
                  <button
                    key={percent}
                    className={`discount-btn ${discountPercent === percent ? 'active' : ''}`}
                    onClick={() => applyDiscountPercent(percent)}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
              <div className="discount-input-row">
                <input
                  type="number"
                  placeholder="المبلغ المخصوم (للمنتجات)"
                  value={discount || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setDiscount(val);
                    cart.setDiscount(val);
                  }}
                />
                <span className="discount-value">{formatCurrency(discount)} ر.ع</span>
              </div>
            </div>

            {/* Summary */}
            <div className="cart-summary">
              <div className="summary-row">
                <span className="label">المجموع قبل الخصم</span>
                <span className="value">{formatCurrency(subtotal)} ر.ع</span>
              </div>
              {discount > 0 && (
                <div className="summary-row discount">
                  <span className="label">الخصم</span>
                  <span className="value">-{formatCurrency(discount)} ر.ع</span>
                </div>
              )}
              <div className="summary-row total">
                <span className="label">الإجمالي النهائي</span>
                <span className="value">{formatCurrency(total)} ر.ع</span>
              </div>
            </div>

            {/* Actions */}
            <div className="cart-actions">
              <button
                className="btn-clear"
                onClick={() => {
                  cart.clear();
                  setDiscount(0);
                  setDiscountPercent(0);
                }}
                disabled={cart.items.length === 0}
              >
                إلغاء الطلب
              </button>
              <button
                className="btn-checkout"
                onClick={handleCheckout}
                disabled={cart.items.length === 0 || loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    💳 إنهاء الطلب
                  </>
                )}
              </button>
            </div>

            {/* Cashier Info */}
            <div className="cashier-info">
              <span>الكاشير: {user?.name}</span>
              <span>{new Date().toLocaleDateString('ar-SA')}</span>
            </div>

            {/* Daily Close */}
            <div className="daily-close-section">
              <button
                type="button"
                className="btn-daily-close"
                onClick={() => setDailyCloseOpen(true)}
              >
                🔒 إغلاق يومي
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Daily Close Modal */}
      {dailyCloseOpen && (
        <div className="modal-overlay" onClick={() => setDailyCloseOpen(false)}>
          <div className="modal-content daily-close-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إغلاق الحسابات اليومية</h3>
              <button type="button" className="modal-close" onClick={() => setDailyCloseOpen(false)}>✕</button>
            </div>
            {todaySummary?.alreadyClosed ? (
              <div className="daily-close-closed">
                <p className="closed-badge">تم إغلاق هذا اليوم</p>
                {todaySummary.closedAt && (
                  <p className="closed-at">وقت الإغلاق: {new Date(todaySummary.closedAt).toLocaleString('ar')}</p>
                )}
                <p>يمكنك عرض التفاصيل من صفحة التقارير → الإغلاقات اليومية</p>
              </div>
            ) : (
              <>
                <div className="daily-close-summary">
                  <h4>ملخص اليوم ({todaySummary?.date || new Date().toISOString().split('T')[0]})</h4>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="label">عدد الطلبات</span>
                      <span className="value">{todaySummary?.summary?.total_orders ?? 0}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">إجمالي المبيعات</span>
                      <span className="value">{formatCurrency(Number(todaySummary?.summary?.total_sales) || 0)} ر.ع</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">نقدي</span>
                      <span className="value">{formatCurrency(Number(todaySummary?.summary?.cash_sales) || 0)} ر.ع</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">بطاقة</span>
                      <span className="value">{formatCurrency(Number(todaySummary?.summary?.card_sales) || 0)} ر.ع</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">الضريبة</span>
                      <span className="value">{formatCurrency(Number(todaySummary?.summary?.total_tax) || 0)} ر.ع</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">الخصم</span>
                      <span className="value">{formatCurrency(Number(todaySummary?.summary?.total_discount) || 0)} ر.ع</span>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleDailyClose} className="daily-close-form">
                  <div className="form-row">
                    <label>رصيد الافتتاح (اختياري)</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={closeForm.opening_balance}
                      onChange={e => setCloseForm(f => ({ ...f, opening_balance: e.target.value }))}
                    />
                  </div>
                  <div className="form-row">
                    <label>رصيد الإغلاق / الكاش في الصندوق (اختياري)</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={closeForm.closing_balance}
                      onChange={e => setCloseForm(f => ({ ...f, closing_balance: e.target.value }))}
                    />
                  </div>
                  <div className="form-row">
                    <label>ملاحظات (اختياري)</label>
                    <textarea
                      placeholder="ملاحظات الإغلاق..."
                      value={closeForm.notes}
                      onChange={e => setCloseForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setDailyCloseOpen(false)}>إلغاء</button>
                    <button type="submit" className="btn-checkout" disabled={dailyCloseLoading}>
                      {dailyCloseLoading ? 'جاري الحفظ...' : 'إغلاق الحسابات'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierPage;
