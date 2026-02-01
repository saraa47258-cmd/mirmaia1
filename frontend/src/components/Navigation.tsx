import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import '../styles/navigation.css';

const Navigation: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/admin', icon: '🏠', label: 'لوحة التحكم', roles: ['admin'] },
    { path: '/cashier', icon: '💳', label: 'الكاشير', roles: ['admin', 'staff', 'cashier'] },
    { path: '/menu/view', icon: '📖', label: 'منيو الزبائن', roles: ['admin', 'staff', 'cashier'] },
    { path: '/menu/barcode', icon: '📱', label: 'باركود المنيو', roles: ['admin', 'staff', 'cashier'] },
    { path: '/orders', icon: '🧾', label: 'الطلبات', roles: ['admin'] },
    { path: '/tables', icon: '🪑', label: 'الطاولات', roles: ['admin'] },
    { path: '/categories', icon: '📁', label: 'الأقسام', roles: ['admin'] },
    { path: '/menu', icon: '📋', label: 'القائمة', roles: ['admin'] },
    { path: '/inventory', icon: '📦', label: 'المخزن', roles: ['admin'] },
    { path: '/inventory-items', icon: '🔗', label: 'مواد المخزون', roles: ['admin'] },
    { path: '/reports', icon: '📊', label: 'التقارير', roles: ['admin'] },
    { path: '/users', icon: '👥', label: 'المستخدمين', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

  const getUserInitial = () => user?.name?.charAt(0)?.toUpperCase() || 'م';
  
  const getRoleDisplay = () => {
    switch (user?.role) {
      case 'admin': return 'مسؤول النظام';
      case 'staff': return 'موظف';
      case 'cashier': return 'كاشير';
      default: return '';
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-logo">
          <span className="mobile-logo-icon">☕</span>
          <span className="mobile-logo-text">mirmaia</span>
        </div>
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="فتح القائمة"
        >
          ☰
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Sidebar */}
      <aside className={`mobile-sidebar ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-sidebar-header">
          <div className="mobile-logo">
            <span className="mobile-logo-icon">☕</span>
            <span className="mobile-logo-text">mirmaia</span>
          </div>
          <button 
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="إغلاق القائمة"
          >
            ✕
          </button>
        </div>

        <nav className="mobile-sidebar-nav">
          {filteredMenuItems.map(item => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          🚪 <span>تسجيل الخروج</span>
        </button>
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`nav-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">☕</span>
            <div className="sidebar-logo-text">
              <span className="brand">mirmaia</span>
              <span className="tagline">نظام نقاط البيع</span>
            </div>
          </div>
          <button 
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d={collapsed ? "M6 12l4-4-4-4" : "M10 12l-4-4 4-4"} 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    fill="none"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">القائمة الرئيسية</span>
            <ul className="nav-menu">
              {filteredMenuItems.map(item => (
                <li key={item.path} className="nav-item">
                  <Link 
                    to={item.path} 
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-text">{item.label}</span>
                    {collapsed && <span className="nav-tooltip">{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="sidebar-user">
          <button className="logout-btn" onClick={handleLogout}>
            🚪 <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Navigation;
