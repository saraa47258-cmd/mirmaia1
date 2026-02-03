import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  DollarSign, ShoppingCart, TrendingUp, CreditCard, 
  Calendar, Package, Activity 
} from 'lucide-react';
import '../styles/reports.css';

const formatCurrency = (amount: number) => {
  return `${Number(amount || 0).toFixed(3)} OMR`;
};

interface DailyClosure {
  id: number;
  closure_date: string;
  closed_by_user_id: number;
  cashier_name: string;
  total_orders: number;
  total_sales: number;
  total_tax: number;
  total_discount: number;
  cash_sales: number;
  card_sales: number;
  opening_balance: number | null;
  closing_balance: number | null;
  notes: string | null;
  closed_at: string;
  created_at: string;
}

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'closures'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [dailyClosures, setDailyClosures] = useState<DailyClosure[]>([]);
  const [selectedClosure, setSelectedClosure] = useState<DailyClosure | null>(null);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reportType === 'daily') {
      fetchDailyReport();
    } else if (reportType === 'monthly') {
      fetchMonthlyReport();
    } else if (reportType === 'closures') {
      fetchDailyClosures();
    }
  }, [reportType, selectedDate, selectedMonth, selectedYear, dateFrom, dateTo]);

  const fetchDailyClosures = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/daily-closure/list', {
        params: { date_from: dateFrom, date_to: dateTo },
      });
      setDailyClosures(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching daily closures:', error);
      setDailyClosures([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/reports/daily', {
        params: { date: selectedDate },
      });
      setDailyReport(response.data);
      
      // Fetch sales by category
      const categoryResponse = await axios.get('/api/reports/sales/by-category', {
        params: {
          start_date: selectedDate,
          end_date: selectedDate,
        },
      });
      setSalesByCategory(categoryResponse.data);
    } catch (error) {
      console.error('Error fetching daily report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/reports/monthly', {
        params: { month: selectedMonth, year: selectedYear },
      });
      setMonthlyReport(response.data);

      // Fetch sales by category for the month
      const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      
      const categoryResponse = await axios.get('/api/reports/sales/by-category', {
        params: { start_date: startDate, end_date: endDate },
      });
      setSalesByCategory(categoryResponse.data);
    } catch (error) {
      console.error('Error fetching monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const getSummaryData = () => {
    if (reportType === 'daily' && dailyReport?.summary) {
      return dailyReport.summary;
    } else if (reportType === 'monthly' && monthlyReport?.summary) {
      return monthlyReport.summary;
    }
    return { total_sales: 0, total_orders: 0, total_tax: 0, total_discount: 0 };
  };

  const summary = getSummaryData();

  return (
    <div className="reports-container">
      <Navigation />
      
      <div className="reports-header">
        <h1>لوحة القيادة والتقارير</h1>
      </div>

      <div className="reports-controls">
        <div className="control-group">
          <Activity size={20} />
          <label>نوع التقرير:</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value as any)}>
            <option value="daily">تقرير يومي</option>
            <option value="monthly">تقرير شهري</option>
            <option value="closures">الإغلاقات اليومية</option>
          </select>
        </div>

        {reportType === 'closures' ? (
          <>
            <div className="control-group">
              <Calendar size={20} />
              <label>من تاريخ:</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="control-group">
              <label>إلى تاريخ:</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </>
        ) : reportType === 'daily' ? (
          <div className="control-group">
            <Calendar size={20} />
            <label>التاريخ:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        ) : (
          <>
            <div className="control-group">
              <label>الشهر:</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="control-group">
              <label>السنة:</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {reportType !== 'closures' && (
      <div className="stats-grid">
        <div className="stat-card sales">
          <div className="stat-info">
            <h3>إجمالي المبيعات</h3>
            <p className="stat-value">{formatCurrency(summary.total_sales)}</p>
          </div>
          <div className="stat-icon">
            <DollarSign />
          </div>
        </div>

        <div className="stat-card orders">
          <div className="stat-info">
            <h3>عدد الطلبات</h3>
            <p className="stat-value">{summary.total_orders || 0}</p>
          </div>
          <div className="stat-icon">
            <ShoppingCart />
          </div>
        </div>

        <div className="stat-card avg">
          <div className="stat-info">
            <h3>متوسط الطلب</h3>
            <p className="stat-value">
              {formatCurrency((summary.total_sales / summary.total_orders) || 0)}
            </p>
          </div>
          <div className="stat-icon">
            <TrendingUp />
          </div>
        </div>

        <div className="stat-card products">
          <div className="stat-info">
            <h3>إجمالي الخصومات</h3>
            <p className="stat-value">{formatCurrency(summary.total_discount)}</p>
          </div>
          <div className="stat-icon">
            <Package />
          </div>
        </div>
      </div>
      )}

      {reportType === 'closures' && (
        <div className="closures-section">
          <h3>سجل الإغلاقات اليومية</h3>
          {loading ? (
            <p>جاري التحميل...</p>
          ) : dailyClosures.length === 0 ? (
            <p className="no-data">لا توجد إغلاقات في الفترة المحددة</p>
          ) : (
            <div className="table-responsive">
              <table className="reports-table closures-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>أغلق بواسطة</th>
                    <th>عدد الطلبات</th>
                    <th>إجمالي المبيعات</th>
                    <th>نقدي</th>
                    <th>بطاقة</th>
                    <th>رصيد الافتتاح</th>
                    <th>رصيد الإغلاق</th>
                    <th>وقت الإغلاق</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dailyClosures.map((c) => (
                    <tr key={c.id} onClick={() => setSelectedClosure(selectedClosure?.id === c.id ? null : c)} className={selectedClosure?.id === c.id ? 'selected' : ''}>
                      <td>{c.closure_date}</td>
                      <td>{c.cashier_name}</td>
                      <td>{c.total_orders}</td>
                      <td>{formatCurrency(c.total_sales)}</td>
                      <td>{formatCurrency(c.cash_sales)}</td>
                      <td>{formatCurrency(c.card_sales)}</td>
                      <td>{c.opening_balance != null ? formatCurrency(c.opening_balance) : '—'}</td>
                      <td>{c.closing_balance != null ? formatCurrency(c.closing_balance) : '—'}</td>
                      <td>{new Date(c.closed_at).toLocaleString('ar')}</td>
                      <td onClick={e => e.stopPropagation()}><button type="button" className="btn-view-detail" onClick={() => setSelectedClosure(c)}>تفاصيل</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selectedClosure && (
            <div className="closure-detail-panel">
              <h4>تفاصيل إغلاق {selectedClosure.closure_date}</h4>
              <div className="closure-detail-grid">
                <div className="detail-row"><span className="label">أغلق بواسطة</span><span>{selectedClosure.cashier_name}</span></div>
                <div className="detail-row"><span className="label">عدد الطلبات</span><span>{selectedClosure.total_orders}</span></div>
                <div className="detail-row"><span className="label">إجمالي المبيعات</span><span>{formatCurrency(selectedClosure.total_sales)}</span></div>
                <div className="detail-row"><span className="label">نقدي</span><span>{formatCurrency(selectedClosure.cash_sales)}</span></div>
                <div className="detail-row"><span className="label">بطاقة</span><span>{formatCurrency(selectedClosure.card_sales)}</span></div>
                <div className="detail-row"><span className="label">الضريبة</span><span>{formatCurrency(selectedClosure.total_tax)}</span></div>
                <div className="detail-row"><span className="label">الخصم</span><span>{formatCurrency(selectedClosure.total_discount)}</span></div>
                <div className="detail-row"><span className="label">رصيد الافتتاح</span><span>{selectedClosure.opening_balance != null ? formatCurrency(selectedClosure.opening_balance) : '—'}</span></div>
                <div className="detail-row"><span className="label">رصيد الإغلاق</span><span>{selectedClosure.closing_balance != null ? formatCurrency(selectedClosure.closing_balance) : '—'}</span></div>
                <div className="detail-row"><span className="label">وقت الإغلاق</span><span>{new Date(selectedClosure.closed_at).toLocaleString('ar')}</span></div>
                {selectedClosure.notes && (
                  <div className="detail-row full"><span className="label">ملاحظات</span><span>{selectedClosure.notes}</span></div>
                )}
              </div>
              <button type="button" className="btn-close-detail" onClick={() => setSelectedClosure(null)}>إغلاق</button>
            </div>
          )}
        </div>
      )}

      {reportType !== 'closures' && (
      <div className="charts-grid">
        {/* Sales Chart */}
        <div className="chart-card">
          <h3>
            {reportType === 'monthly' ? 'تحليل المبيعات اليومي' : 'المبيعات حسب الفئة'}
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            {reportType === 'monthly' && monthlyReport?.dailyBreakdown ? (
              <BarChart data={monthlyReport.dailyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="sales" name="المبيعات" fill="#0088FE" />
              </BarChart>
            ) : (
              <BarChart data={salesByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="total_revenue" name="المبيعات" fill="#82CA9D" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Chart */}
        <div className="chart-card">
           <h3>طرق الدفع المستخدمة</h3>
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={dailyReport?.paymentBreakdown || []}
                 cx="50%"
                 cy="50%"
                 labelLine={false}
                 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                 outerRadius={120}
                 fill="#8884d8"
                 dataKey="amount"
                 nameKey="payment_method"
               >
                 {(dailyReport?.paymentBreakdown || []).map((entry: any, index: number) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Pie>
               <Tooltip formatter={(value) => formatCurrency(Number(value))} />
             </PieChart>
           </ResponsiveContainer>
        </div>
      </div>
      )}

      {reportType === 'monthly' && monthlyReport?.topProducts && (
        <div className="data-section">
          <h3>أكثر المنتجات مبيعاً - {selectedMonth}/{selectedYear}</h3>
          <div className="table-responsive">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>الترتيب</th>
                  <th>المنتج</th>
                  <th>الكمية المباعة</th>
                  <th>الإيرادات</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReport.topProducts.map((product: any, index: number) => (
                  <tr key={index}>
                    <td>#{index + 1}</td>
                    <td>{product.name}</td>
                    <td>{product.total_sold}</td>
                    <td>{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {reportType === 'closures' && (
        <div style={{ marginTop: '1rem' }} />
      )}
    </div>
  );
};

export default ReportsPage;
