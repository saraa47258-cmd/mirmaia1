import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import { 
  Package, AlertTriangle, TrendingUp, CheckCircle, 
  Search, Edit3, DollarSign 
} from 'lucide-react';
import '../styles/inventory.clean.css';

interface InventoryItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  price?: number;
  status: 'low' | 'normal' | 'high';
}

const formatCurrency = (amount: number) => {
  return `${Number(amount || 0).toFixed(3)} OMR`;
};

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [operationType, setOperationType] = useState('purchase');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInventory();
    fetchLowStockItems();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const response = await axios.get('/api/inventory/low-stock/list');
      setLowStockItems(response.data);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || quantity === 0) return;

    setLoading(true);
    try {
      await axios.post('/api/inventory/adjust', {
        product_id: selectedItem.product_id,
        quantity,
        operation_type: operationType,
        notes: `تعديل من قبل الإدارة`,
      });

      fetchInventory();
      setSelectedItem(null);
      setQuantity(0);
      alert('تم تحديث المخزن بنجاح');
    } catch (error: any) {
      alert('خطأ: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low':
        return '#ff4444';
      case 'normal':
        return '#44aa44';
      case 'high':
        return '#ffaa00';
      default:
        return '#999';
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = inventory.length;
  const lowStockCount = inventory.filter(item => item.status === 'low').length;
  const normalStockCount = inventory.filter(item => item.status === 'normal').length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);

  return (
    <div className="page-container">
      <Navigation />
      <main className="main-content">
        <div className="page-content">
          <div className="inventory-container">
            <div className="inventory-header">
              <h1>إدارة المخزن والجرد</h1>
            </div>

            {lowStockItems.length > 0 && (
              <div className="inventory-alert">
                <AlertTriangle size={24} />
                <span>
                  تنبيه: {lowStockItems.length} منتج يحتاج إلى إعادة تموين فوراً
                </span>
              </div>
            )}

      <div className="inventory-stats">
        <div className="inventory-stat-card stat-card-total">
          <div className="stat-content">
            <h3>إجمالي المنتجات</h3>
            <p className="stat-number">{totalProducts}</p>
          </div>
          <div className="stat-icon">
            <Package />
          </div>
        </div>

        <div className="inventory-stat-card stat-card-low">
          <div className="stat-content">
            <h3>منتجات قليلة</h3>
            <p className="stat-number">{lowStockCount}</p>
          </div>
          <div className="stat-icon">
            <AlertTriangle />
          </div>
        </div>

        <div className="inventory-stat-card stat-card-normal">
          <div className="stat-content">
            <h3>منتجات طبيعية</h3>
            <p className="stat-number">{normalStockCount}</p>
          </div>
          <div className="stat-icon">
            <CheckCircle />
          </div>
        </div>

        <div className="inventory-stat-card stat-card-value">
          <div className="stat-content">
            <h3>قيمة المخزون</h3>
            <p className="stat-number" style={{ fontSize: '20px' }}>{formatCurrency(totalValue)}</p>
          </div>
          <div className="stat-icon">
            <DollarSign />
          </div>
        </div>
      </div>

      <div className="inventory-main-grid">
        <div className="inventory-table-section">
          <h2>قائمة المخزون</h2>
          
          <div className="inventory-search">
            <Search size={20} />
            <input
              type="text"
              placeholder="البحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <table className="modern-inventory-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>الحد الأدنى</th>
                <th>الحد الأقصى</th>
                <th>الحالة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr key={item.id}>
                  <td className="product-name-cell">{item.name}</td>
                  <td>
                    <span className={`quantity-badge ${
                      item.status === 'low' ? 'quantity-low' : 
                      item.status === 'high' ? 'quantity-high' : 
                      'quantity-normal'
                    }`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td>{item.min_quantity}</td>
                  <td>{item.max_quantity}</td>
                  <td>
                    <span className={`status-indicator status-${item.status}`}>
                      {item.status === 'low' && '⚠️ نفاد'}
                      {item.status === 'normal' && '✓ طبيعي'}
                      {item.status === 'high' && '↑ مرتفع'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="action-btn"
                      onClick={() => setSelectedItem(item)}
                    >
                      <Edit3 size={14} style={{ display: 'inline', marginLeft: '4px' }} />
                      تعديل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="adjustment-panel">
          {selectedItem ? (
            <>
              <h2>تعديل المخزون</h2>
              
              <div className="selected-product">
                <p className="selected-product-name">{selectedItem.name}</p>
                <p className="selected-product-stock">
                  الكمية الحالية: <strong>{selectedItem.quantity}</strong> وحدة
                </p>
              </div>

              <div className="form-field">
                <label>نوع العملية:</label>
                <select
                  value={operationType}
                  onChange={(e) => setOperationType(e.target.value)}
                >
                  <option value="purchase">📦 شراء (إضافة)</option>
                  <option value="adjustment">🔧 تعديل يدوي</option>
                  <option value="return">↩️ إرجاع من عميل</option>
                  <option value="damage">❌ تالف / منتهي</option>
                </select>
              </div>

              <div className="form-field">
                <label>الكمية:</label>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder="أدخل الكمية"
                />
              </div>

              <button
                className="btn-submit"
                onClick={handleAdjustStock}
                disabled={loading || quantity === 0}
              >
                {loading ? 'جاري التحديث...' : '✓ تحديث المخزون'}
              </button>

              <button
                className="btn-cancel"
                onClick={() => {
                  setSelectedItem(null);
                  setQuantity(0);
                }}
              >
                إلغاء
              </button>
            </>
          ) : (
            <div className="empty-state">
              <Package size={64} />
              <p>اختر منتجاً من القائمة<br />لتعديل مخزونه</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
      </main>
    </div>
  );
};

export default InventoryPage;
