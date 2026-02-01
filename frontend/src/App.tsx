import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import LoginPage from './pages/LoginPage';
import CashierPage from './pages/CashierPage';
import MenuPage from './pages/MenuPage';
import AdminDashboard from './pages/AdminDashboard';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import UsersManagement from './pages/UsersManagement';
import OrdersPage from './pages/OrdersPage';
import CategoriesPage from './pages/CategoriesPage';
import CustomerMenuPage from './pages/CustomerMenuPage';
import MenuBarcodePage from './pages/MenuBarcodePage';
import InventoryItemsPage from './pages/InventoryItemsPage';
import TablesPage from './pages/TablesPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { verifyToken } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await verifyToken();
      } catch (e) {
        console.log('Token verification failed');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '24px'
      }}>
        جاري التحميل...
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/menu/view" element={<CustomerMenuPage />} />
        <Route
          path="/menu/barcode"
          element={<ProtectedRoute><MenuBarcodePage /></ProtectedRoute>}
        />
        
        <Route
          path="/cashier"
          element={<ProtectedRoute><CashierPage /></ProtectedRoute>}
        />
        
        <Route
          path="/menu"
          element={<ProtectedRoute><MenuPage /></ProtectedRoute>}
        />
        <Route
          path="/categories"
          element={<ProtectedRoute requiredRole="admin"><CategoriesPage /></ProtectedRoute>}
        />
        <Route
          path="/inventory"
          element={<ProtectedRoute requiredRole="admin"><InventoryPage /></ProtectedRoute>}
        />
        <Route
          path="/inventory-items"
          element={<ProtectedRoute requiredRole="admin"><InventoryItemsPage /></ProtectedRoute>}
        />
        <Route
          path="/tables"
          element={<ProtectedRoute requiredRole="admin"><TablesPage /></ProtectedRoute>}
        />
        <Route
          path="/reports"
          element={<ProtectedRoute requiredRole="admin"><ReportsPage /></ProtectedRoute>}
        />
        
        <Route
          path="/admin"
          element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>}
        />
        
        <Route
          path="/users"
          element={<ProtectedRoute requiredRole="admin"><UsersManagement /></ProtectedRoute>}
        />
        
        <Route
          path="/orders"
          element={<ProtectedRoute requiredRole="admin"><OrdersPage /></ProtectedRoute>}
        />
        
        <Route path="/" element={<Navigate to="/cashier" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
