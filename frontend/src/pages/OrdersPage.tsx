import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { formatCurrency } from '../utils/calculations';
import '../styles/orders.css';

interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: number;
  order_number: string;
  cashier_id: number;
  cashier_name?: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: string;
  order_status: string;
  created_at: string;
  table_id?: number | null;
  table_name?: string | null;
  items?: OrderItem[];
}

const OrdersPage: React.FC = () => {
  const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '');
  const withApiBase = (path: string) => (apiBase ? `${apiBase}${path}` : path);

  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterTableId, setFilterTableId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filterDate, filterTableId]);

  useEffect(() => {
    const f = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(withApiBase('/api/tables'), { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setTables(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        setTables([]);
      }
    };
    f();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = withApiBase(`/api/orders?date=${filterDate}`);
      if (filterTableId && filterTableId !== 'all') url += `&table_id=${filterTableId}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setOrders(list.map((o: any) => ({
          id: o.id,
          order_number: o.order_number ?? o.orderNumber ?? '',
          cashier_id: o.cashier_id,
          total_amount: Number(o.total_amount) || 0,
          tax_amount: Number(o.tax_amount) || 0,
          discount_amount: Number(o.discount_amount) || 0,
          payment_method: o.payment_method ?? 'cash',
          order_status: o.order_status ?? 'pending',
          created_at: o.created_at ?? o.createdAt ?? '',
          table_id: o.table_id != null ? o.table_id : null,
          table_name: o.table_name ?? o.tableName ?? null,
        })));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(withApiBase(`/api/orders/${orderId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const order = data.order || {};
        const items = Array.isArray(data.items) ? data.items : [];
        setSelectedOrder({
          id: Number(order.id),
          order_number: order.order_number ?? order.orderNumber ?? '',
          cashier_id: Number(order.cashier_id),
          total_amount: Number(order.total_amount) || 0,
          tax_amount: Number(order.tax_amount) || 0,
          discount_amount: Number(order.discount_amount) || 0,
          payment_method: order.payment_method ?? order.paymentMethod ?? 'cash',
          order_status: order.order_status ?? order.orderStatus ?? 'pending',
          created_at: order.created_at ?? order.createdAt ?? '',
          table_id: order.table_id != null ? Number(order.table_id) : null,
          table_name: order.table_name ?? order.tableName ?? null,
          items: items.map((it: any) => ({
            id: it.id,
            product_id: it.product_id,
            name: it.name ?? '',
            quantity: Number(it.quantity) || 0,
            unit_price: Number(it.unit_price) || 0,
            subtotal: Number(it.subtotal) || 0,
          })),
        });
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'visa':
      case 'card':
        return '💳';
      case 'cash':
        return '💵';
      default:
        return '💰';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'visa':
      case 'card':
        return 'بطاقة';
      case 'cash':
        return 'نقدي';
      default:
        return method;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'pending':
        return 'قيد الانتظار';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const formatDateTime = (dateString: string | undefined | null) => {
    if (dateString == null || dateString === '') return { date: '—', time: '—' };
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return { date: '—', time: '—' };
    return {
      date: date.toLocaleDateString('ar-SA'),
      time: date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Filter orders (client-side for status/payment/search; table_id already applied in API)
  const filteredOrders = (orders || []).filter(order => {
    if (!order) return false;
    const matchesStatus = filterStatus === 'all' || (order.order_status ?? '') === filterStatus;
    const matchesPayment = filterPayment === 'all' || (order.payment_method ?? '') === filterPayment;
    const matchesSearch = searchTerm === '' || 
      (order.order_number ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPayment && matchesSearch;
  });

  // Calculate totals
  const totalSales = filteredOrders.reduce((sum, order) => sum + (Number(order?.total_amount) || 0), 0);
  const totalCash = filteredOrders
    .filter(o => (o?.payment_method ?? '') === 'cash')
    .reduce((sum, order) => sum + (Number(order?.total_amount) || 0), 0);
  const totalCard = filteredOrders
    .filter(o => (o?.payment_method ?? '') === 'visa' || (o?.payment_method ?? '') === 'card')
    .reduce((sum, order) => sum + (Number(order?.total_amount) || 0), 0);

  return (
    <div className="orders-page">
      <Navigation />
      
      <main className="orders-main">
        {/* Header */}
        <div className="orders-header">
          <div className="orders-title-section">
            <h1>📋 سجل الطلبات</h1>
            <p>عرض وإدارة جميع الطلبات</p>
          </div>
          <div className="orders-date-picker">
            <label>التاريخ:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="orders-stats">
          <div className="order-stat-card total">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <span className="stat-value">{filteredOrders.length}</span>
              <span className="stat-label">إجمالي الطلبات</span>
            </div>
          </div>
          <div className="order-stat-card sales">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="stat-value">{formatCurrency(totalSales)}</span>
              <span className="stat-label">إجمالي المبيعات</span>
            </div>
          </div>
          <div className="order-stat-card cash">
            <div className="stat-icon">💵</div>
            <div className="stat-content">
              <span className="stat-value">{formatCurrency(totalCash)}</span>
              <span className="stat-label">نقدي</span>
            </div>
          </div>
          <div className="order-stat-card card">
            <div className="stat-icon">💳</div>
            <div className="stat-content">
              <span className="stat-value">{formatCurrency(totalCard)}</span>
              <span className="stat-label">بطاقة</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="orders-filters">
          <div className="filter-group">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="بحث برقم الطلب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="filter-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">جميع الحالات</option>
              <option value="completed">مكتمل</option>
              <option value="pending">قيد الانتظار</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
            >
              <option value="all">جميع طرق الدفع</option>
              <option value="cash">نقدي</option>
              <option value="visa">بطاقة</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterTableId}
              onChange={(e) => setFilterTableId(e.target.value)}
            >
              <option value="all">جميع الطاولات</option>
              <option value="0">بدون طاولة</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button className="btn-refresh" onClick={fetchOrders}>
            🔄 تحديث
          </button>
        </div>

        {/* Orders Content */}
        <div className="orders-content">
          {/* Orders Table */}
          <div className="orders-table-container">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>جاري تحميل الطلبات...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>لا توجد طلبات</h3>
                <p>لا توجد طلبات في هذا التاريخ</p>
              </div>
            ) : (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>الطاولة</th>
                    <th>الوقت</th>
                    <th>المبلغ</th>
                    <th>الخصم</th>
                    <th>الضريبة</th>
                    <th>طريقة الدفع</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => {
                    const { date, time } = formatDateTime(order?.created_at);
                    return (
                      <tr 
                        key={order?.id ?? order?.order_number ?? `order-${index}`}
                        className={selectedOrder?.id === order?.id ? 'selected' : ''}
                        onClick={() => order?.id != null && fetchOrderDetails(order.id)}
                      >
                        <td className="order-number">
                          <span className="order-id">#{order?.id ?? '—'}</span>
                          <span className="order-ref">{order?.order_number ?? '—'}</span>
                        </td>
                        <td className="order-table">
                          {order?.table_name ?? '—'}
                        </td>
                        <td className="order-time">
                          <span className="time">{time}</span>
                          <span className="date">{date}</span>
                        </td>
                        <td className="order-amount">
                          <strong>{formatCurrency(Number(order?.total_amount) + Number(order?.tax_amount))} ر.ع</strong>
                        </td>
                        <td className="order-discount">
                          {(Number(order?.discount_amount) || 0) > 0 ? (
                            <span className="discount-badge">
                              -{formatCurrency(Number(order?.discount_amount))}
                            </span>
                          ) : (
                            <span className="no-discount">-</span>
                          )}
                        </td>
                        <td className="order-tax">
                          {formatCurrency(Number(order?.tax_amount))} ر.ع
                        </td>
                        <td className="order-payment">
                          <span className={`payment-badge ${order?.payment_method ?? 'cash'}`}>
                            {getPaymentMethodIcon(order?.payment_method ?? '')}
                            {getPaymentMethodLabel(order?.payment_method ?? '')}
                          </span>
                        </td>
                        <td className="order-status">
                          <span className={`status-badge ${getStatusClass(order?.order_status ?? '')}`}>
                            {getStatusLabel(order?.order_status ?? '')}
                          </span>
                        </td>
                        <td className="order-actions">
                          <button 
                            className="btn-view"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (order?.id != null) fetchOrderDetails(order.id);
                            }}
                          >
                            👁️ عرض
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Order Details Panel */}
          {selectedOrder && (
            <div className="order-details-panel">
              <div className="panel-header">
                <h3>تفاصيل الطلب</h3>
                <button 
                  className="btn-close"
                  onClick={() => setSelectedOrder(null)}
                >
                  ✕
                </button>
              </div>
              
              <div className="panel-content">
                {/* Order Info */}
                <div className="order-info-section">
                  <div className="order-info-header">
                    <span className="order-number-large">#{selectedOrder.id}</span>
                    <span className={`status-badge ${getStatusClass(selectedOrder.order_status)}`}>
                      {getStatusLabel(selectedOrder.order_status)}
                    </span>
                  </div>
                  <div className="order-info-row">
                    <span className="info-label">رقم الطلب:</span>
                    <span className="info-value">{selectedOrder.order_number || (selectedOrder.id != null ? `#${selectedOrder.id}` : '—')}</span>
                  </div>
                  <div className="order-info-row">
                    <span className="info-label">التاريخ والوقت:</span>
                    <span className="info-value">
                      {selectedOrder.created_at ? `${formatDateTime(selectedOrder.created_at).date} - ${formatDateTime(selectedOrder.created_at).time}` : '—'}
                    </span>
                  </div>
                  <div className="order-info-row">
                    <span className="info-label">طريقة الدفع:</span>
                    <span className={`payment-badge ${selectedOrder.payment_method}`}>
                      {getPaymentMethodIcon(selectedOrder.payment_method)}
                      {getPaymentMethodLabel(selectedOrder.payment_method)}
                    </span>
                  </div>
                  <div className="order-info-row">
                    <span className="info-label">الطاولة:</span>
                    <span className="info-value">{selectedOrder.table_name || '—'}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="order-items-section">
                  <h4>المنتجات</h4>
                  {selectedOrder?.items && selectedOrder.items.length > 0 ? (
                    <div className="order-items-list">
                      {selectedOrder.items.map((item: OrderItem, index: number) => (
                        <div key={index} className="order-item-row">
                          <div className="item-info">
                            <span className="item-name">{item.name}</span>
                            <span className="item-qty">×{item.quantity}</span>
                          </div>
                          <div className="item-prices">
                            <span className="item-unit-price">{formatCurrency(Number(item.unit_price))} ر.ع</span>
                            <span className="item-subtotal">{formatCurrency(Number(item.subtotal))} ر.ع</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-items">لا توجد تفاصيل للمنتجات</p>
                  )}
                </div>

                {/* Order Summary */}
                <div className="order-summary-section">
                  <div className="summary-row">
                    <span>المجموع الفرعي:</span>
                    <span>{formatCurrency(Number(selectedOrder.total_amount) + Number(selectedOrder.discount_amount))} ر.ع</span>
                  </div>
                  {(Number(selectedOrder.discount_amount) || 0) > 0 && (
                    <div className="summary-row discount">
                      <span>الخصم:</span>
                      <span>-{formatCurrency(Number(selectedOrder.discount_amount))} ر.ع</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>الضريبة (5%):</span>
                    <span>{formatCurrency(Number(selectedOrder.tax_amount))} ر.ع</span>
                  </div>
                  <div className="summary-row total">
                    <span>الإجمالي:</span>
                    <span>{formatCurrency(Number(selectedOrder.total_amount) + Number(selectedOrder.tax_amount))} ر.ع</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="panel-actions">
                  <button className="btn-print">
                    🖨️ طباعة الفاتورة
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrdersPage;
