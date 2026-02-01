import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import '../styles/users.css';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  permissions?: string[];
}

const allPermissions: Permission[] = [
  // صلاحيات الكاشير
  { id: 'pos_access', name: 'الوصول للكاشير', description: 'استخدام نظام نقاط البيع', category: 'كاشير' },
  { id: 'pos_discount', name: 'تطبيق الخصومات', description: 'إمكانية تطبيق خصومات على الطلبات', category: 'كاشير' },
  { id: 'pos_void', name: 'إلغاء الطلبات', description: 'إلغاء الطلبات قبل الدفع', category: 'كاشير' },
  { id: 'pos_refund', name: 'استرجاع المبالغ', description: 'إجراء عمليات الاسترجاع', category: 'كاشير' },
  
  // صلاحيات المنتجات
  { id: 'products_view', name: 'عرض المنتجات', description: 'عرض قائمة المنتجات', category: 'المنتجات' },
  { id: 'products_add', name: 'إضافة منتجات', description: 'إضافة منتجات جديدة', category: 'المنتجات' },
  { id: 'products_edit', name: 'تعديل المنتجات', description: 'تعديل بيانات المنتجات', category: 'المنتجات' },
  { id: 'products_delete', name: 'حذف المنتجات', description: 'حذف المنتجات من النظام', category: 'المنتجات' },
  { id: 'products_price', name: 'تغيير الأسعار', description: 'تعديل أسعار المنتجات', category: 'المنتجات' },
  
  // صلاحيات المخزون
  { id: 'inventory_view', name: 'عرض المخزون', description: 'عرض كميات المخزون', category: 'المخزون' },
  { id: 'inventory_adjust', name: 'تعديل المخزون', description: 'تعديل كميات المخزون', category: 'المخزون' },
  { id: 'inventory_transfer', name: 'نقل المخزون', description: 'نقل المخزون بين المواقع', category: 'المخزون' },
  
  // صلاحيات الطلبات
  { id: 'orders_view', name: 'عرض الطلبات', description: 'عرض سجل الطلبات', category: 'الطلبات' },
  { id: 'orders_edit', name: 'تعديل الطلبات', description: 'تعديل الطلبات المكتملة', category: 'الطلبات' },
  { id: 'orders_delete', name: 'حذف الطلبات', description: 'حذف الطلبات من السجل', category: 'الطلبات' },
  
  // صلاحيات التقارير
  { id: 'reports_daily', name: 'التقارير اليومية', description: 'عرض التقارير اليومية', category: 'التقارير' },
  { id: 'reports_monthly', name: 'التقارير الشهرية', description: 'عرض التقارير الشهرية', category: 'التقارير' },
  { id: 'reports_sales', name: 'تقارير المبيعات', description: 'عرض تقارير المبيعات التفصيلية', category: 'التقارير' },
  { id: 'reports_export', name: 'تصدير التقارير', description: 'تصدير التقارير لملفات Excel', category: 'التقارير' },
  
  // صلاحيات المستخدمين
  { id: 'users_view', name: 'عرض المستخدمين', description: 'عرض قائمة المستخدمين', category: 'المستخدمين' },
  { id: 'users_add', name: 'إضافة مستخدمين', description: 'إضافة مستخدمين جدد', category: 'المستخدمين' },
  { id: 'users_edit', name: 'تعديل المستخدمين', description: 'تعديل بيانات المستخدمين', category: 'المستخدمين' },
  { id: 'users_delete', name: 'حذف المستخدمين', description: 'حذف المستخدمين من النظام', category: 'المستخدمين' },
  { id: 'users_permissions', name: 'إدارة الصلاحيات', description: 'تعديل صلاحيات المستخدمين', category: 'المستخدمين' },
  
  // صلاحيات الإعدادات
  { id: 'settings_general', name: 'الإعدادات العامة', description: 'تعديل إعدادات النظام', category: 'الإعدادات' },
  { id: 'settings_payment', name: 'إعدادات الدفع', description: 'تعديل طرق الدفع', category: 'الإعدادات' },
  { id: 'settings_tax', name: 'إعدادات الضريبة', description: 'تعديل نسب الضريبة', category: 'الإعدادات' },
];

// صلاحيات افتراضية حسب الدور
const defaultPermissions: { [key: string]: string[] } = {
  admin: allPermissions.map(p => p.id),
  staff: [
    'pos_access', 'pos_discount', 'pos_void',
    'products_view', 'products_add', 'products_edit',
    'inventory_view', 'inventory_adjust',
    'orders_view',
    'reports_daily'
  ],
  cashier: [
    'pos_access', 'pos_discount',
    'products_view',
    'orders_view'
  ]
};

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'permissions'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'cashier',
    permissions: [] as string[]
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'cashier',
      permissions: [...defaultPermissions['cashier']]
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role,
      permissions: user.permissions || [...defaultPermissions[user.role]]
    });
    setShowModal(true);
  };

  const handleOpenPermissionsModal = (user: User) => {
    setModalMode('permissions');
    setSelectedUser(user);
    setFormData({
      ...formData,
      permissions: user.permissions || [...defaultPermissions[user.role]]
    });
    setShowModal(true);
  };

  const handleRoleChange = (role: string) => {
    setFormData({
      ...formData,
      role,
      permissions: [...defaultPermissions[role]]
    });
  };

  const togglePermission = (permissionId: string) => {
    const newPermissions = formData.permissions.includes(permissionId)
      ? formData.permissions.filter(p => p !== permissionId)
      : [...formData.permissions, permissionId];
    setFormData({ ...formData, permissions: newPermissions });
  };

  const toggleCategoryPermissions = (category: string) => {
    const categoryPermissions = allPermissions
      .filter(p => p.category === category)
      .map(p => p.id);
    
    const allSelected = categoryPermissions.every(p => formData.permissions.includes(p));
    
    if (allSelected) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => !categoryPermissions.includes(p))
      });
    } else {
      const newPermissions = [...new Set([...formData.permissions, ...categoryPermissions])];
      setFormData({ ...formData, permissions: newPermissions });
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (modalMode === 'add') {
        await axios.post('/api/users', formData);
        alert('تم إضافة المستخدم بنجاح ✅');
      } else if (modalMode === 'edit' && selectedUser) {
        await axios.put(`/api/users/${selectedUser.id}`, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        });
        alert('تم تحديث المستخدم بنجاح ✅');
      }
      
      setShowModal(false);
      fetchUsers();
    } catch (error: any) {
      alert('خطأ: ' + (error.response?.data?.error || 'حدث خطأ'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const action = user.is_active ? 'تعطيل' : 'تفعيل';
    if (!window.confirm(`هل تريد ${action} هذا المستخدم؟`)) return;
    
    try {
      if (user.is_active) {
        await axios.post(`/api/users/${user.id}/deactivate`);
      } else {
        await axios.put(`/api/users/${user.id}`, { ...user, is_active: true });
      }
      fetchUsers();
      alert(`تم ${action} المستخدم ✅`);
    } catch (error: any) {
      alert('خطأ: ' + (error.response?.data?.error || 'حدث خطأ'));
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return { name: 'مسؤول النظام', icon: '👑', color: '#8b5cf6' };
      case 'staff':
        return { name: 'موظف', icon: '👨‍💼', color: '#3b82f6' };
      case 'cashier':
        return { name: 'كاشير', icon: '💳', color: '#10b981' };
      default:
        return { name: role, icon: '👤', color: '#6b7280' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const staffCount = users.filter(u => u.role === 'staff').length;
  const cashierCount = users.filter(u => u.role === 'cashier').length;

  // Group permissions by category
  const permissionsByCategory = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as { [key: string]: Permission[] });

  return (
    <div className="users-page">
      <Navigation />
      
      <main className="users-main">
        {/* Header */}
        <div className="users-header">
          <div className="users-title-section">
            <h1>👥 إدارة المستخدمين</h1>
            <p>إدارة المستخدمين والصلاحيات في النظام</p>
          </div>
          <button className="btn-add-user" onClick={handleOpenAddModal}>
            <span className="icon">+</span>
            إضافة مستخدم جديد
          </button>
        </div>

        {/* Stats */}
        <div className="users-stats">
          <div className="user-stat-card total">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <span className="stat-value">{totalUsers}</span>
              <span className="stat-label">إجمالي المستخدمين</span>
            </div>
          </div>
          <div className="user-stat-card active">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <span className="stat-value">{activeUsers}</span>
              <span className="stat-label">المستخدمين النشطين</span>
            </div>
          </div>
          <div className="user-stat-card admin">
            <div className="stat-icon">👑</div>
            <div className="stat-content">
              <span className="stat-value">{adminCount}</span>
              <span className="stat-label">المسؤولين</span>
            </div>
          </div>
          <div className="user-stat-card staff">
            <div className="stat-icon">👨‍💼</div>
            <div className="stat-content">
              <span className="stat-value">{staffCount}</span>
              <span className="stat-label">الموظفين</span>
            </div>
          </div>
          <div className="user-stat-card cashier">
            <div className="stat-icon">💳</div>
            <div className="stat-content">
              <span className="stat-value">{cashierCount}</span>
              <span className="stat-label">الكاشير</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="users-filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">جميع الأدوار</option>
            <option value="admin">مسؤول</option>
            <option value="staff">موظف</option>
            <option value="cashier">كاشير</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">معطل</option>
          </select>
        </div>

        {/* Users Grid */}
        <div className="users-grid">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>جاري تحميل المستخدمين...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <h3>لا يوجد مستخدمين</h3>
              <p>لم يتم العثور على مستخدمين مطابقين للبحث</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const roleInfo = getRoleInfo(user.role);
              return (
                <div key={user.id} className={`user-card ${!user.is_active ? 'inactive' : ''}`}>
                  <div className="user-card-header">
                    <div className="user-avatar" style={{ background: roleInfo.color }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-status-indicator" style={{ 
                      background: user.is_active ? '#10b981' : '#ef4444' 
                    }} />
                  </div>
                  
                  <div className="user-card-body">
                    <h3 className="user-name">{user.name}</h3>
                    <span className="user-email">{user.email}</span>
                    
                    <div className="user-role-badge" style={{ 
                      background: `${roleInfo.color}15`,
                      color: roleInfo.color
                    }}>
                      <span>{roleInfo.icon}</span>
                      <span>{roleInfo.name}</span>
                    </div>
                    
                    {user.phone && (
                      <div className="user-phone">
                        <span>📱</span>
                        <span>{user.phone}</span>
                      </div>
                    )}
                    
                    <div className="user-meta">
                      <span className="user-date">
                        📅 انضم في {formatDate(user.created_at)}
                      </span>
                      <span className={`user-status ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? '● نشط' : '● معطل'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="user-card-actions">
                    <button 
                      className="btn-action edit"
                      onClick={() => handleOpenEditModal(user)}
                      title="تعديل"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-action permissions"
                      onClick={() => handleOpenPermissionsModal(user)}
                      title="الصلاحيات"
                    >
                      🔐
                    </button>
                    <button 
                      className="btn-action toggle"
                      onClick={() => handleToggleStatus(user)}
                      title={user.is_active ? 'تعطيل' : 'تفعيل'}
                    >
                      {user.is_active ? '🚫' : '✅'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === 'add' && '➕ إضافة مستخدم جديد'}
                {modalMode === 'edit' && '✏️ تعديل المستخدم'}
                {modalMode === 'permissions' && '🔐 إدارة الصلاحيات'}
              </h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              {(modalMode === 'add' || modalMode === 'edit') && (
                <div className="user-form">
                  <div className="form-section">
                    <h3>📋 المعلومات الأساسية</h3>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>الاسم الكامل *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="أدخل الاسم الكامل"
                        />
                      </div>
                      <div className="form-group">
                        <label>البريد الإلكتروني *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="example@email.com"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      {modalMode === 'add' && (
                        <div className="form-group">
                          <label>كلمة المرور *</label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="أدخل كلمة المرور"
                          />
                        </div>
                      )}
                      <div className="form-group">
                        <label>رقم الهاتف</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+968 XXXX XXXX"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-section">
                    <h3>👤 الدور والصلاحيات</h3>
                    
                    <div className="role-selector">
                      {['admin', 'staff', 'cashier'].map(role => {
                        const info = getRoleInfo(role);
                        return (
                          <div
                            key={role}
                            className={`role-option ${formData.role === role ? 'selected' : ''}`}
                            onClick={() => handleRoleChange(role)}
                            style={{ 
                              borderColor: formData.role === role ? info.color : 'transparent',
                              background: formData.role === role ? `${info.color}10` : ''
                            }}
                          >
                            <span className="role-icon" style={{ background: info.color }}>
                              {info.icon}
                            </span>
                            <div className="role-info">
                              <span className="role-name">{info.name}</span>
                              <span className="role-desc">
                                {role === 'admin' && 'صلاحيات كاملة للنظام'}
                                {role === 'staff' && 'صلاحيات محدودة للموظفين'}
                                {role === 'cashier' && 'صلاحيات الكاشير فقط'}
                              </span>
                            </div>
                            {formData.role === role && (
                              <span className="role-check">✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="form-section permissions-section">
                    <h3>🔐 الصلاحيات المخصصة</h3>
                    <p className="section-hint">يمكنك تخصيص الصلاحيات حسب احتياجاتك</p>
                    
                    <div className="permissions-grid">
                      {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                        const categorySelected = permissions.every(p => 
                          formData.permissions.includes(p.id)
                        );
                        const someSelected = permissions.some(p => 
                          formData.permissions.includes(p.id)
                        );
                        
                        return (
                          <div key={category} className="permission-category">
                            <div 
                              className="category-header"
                              onClick={() => toggleCategoryPermissions(category)}
                            >
                              <div className={`category-checkbox ${categorySelected ? 'checked' : someSelected ? 'partial' : ''}`}>
                                {categorySelected ? '✓' : someSelected ? '−' : ''}
                              </div>
                              <span className="category-name">{category}</span>
                              <span className="category-count">
                                {permissions.filter(p => formData.permissions.includes(p.id)).length}/{permissions.length}
                              </span>
                            </div>
                            <div className="category-permissions">
                              {permissions.map(permission => (
                                <label key={permission.id} className="permission-item">
                                  <input
                                    type="checkbox"
                                    checked={formData.permissions.includes(permission.id)}
                                    onChange={() => togglePermission(permission.id)}
                                  />
                                  <span className="permission-checkbox"></span>
                                  <div className="permission-info">
                                    <span className="permission-name">{permission.name}</span>
                                    <span className="permission-desc">{permission.description}</span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              {modalMode === 'permissions' && selectedUser && (
                <div className="permissions-modal">
                  <div className="user-info-header">
                    <div className="user-avatar large" style={{ 
                      background: getRoleInfo(selectedUser.role).color 
                    }}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <h3>{selectedUser.name}</h3>
                      <span>{selectedUser.email}</span>
                      <span className="role-badge" style={{ 
                        background: `${getRoleInfo(selectedUser.role).color}20`,
                        color: getRoleInfo(selectedUser.role).color
                      }}>
                        {getRoleInfo(selectedUser.role).icon} {getRoleInfo(selectedUser.role).name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="permissions-grid">
                    {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                      const categorySelected = permissions.every(p => 
                        formData.permissions.includes(p.id)
                      );
                      const someSelected = permissions.some(p => 
                        formData.permissions.includes(p.id)
                      );
                      
                      return (
                        <div key={category} className="permission-category">
                          <div 
                            className="category-header"
                            onClick={() => toggleCategoryPermissions(category)}
                          >
                            <div className={`category-checkbox ${categorySelected ? 'checked' : someSelected ? 'partial' : ''}`}>
                              {categorySelected ? '✓' : someSelected ? '−' : ''}
                            </div>
                            <span className="category-name">{category}</span>
                            <span className="category-count">
                              {permissions.filter(p => formData.permissions.includes(p.id)).length}/{permissions.length}
                            </span>
                          </div>
                          <div className="category-permissions">
                            {permissions.map(permission => (
                              <label key={permission.id} className="permission-item">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.includes(permission.id)}
                                  onChange={() => togglePermission(permission.id)}
                                />
                                <span className="permission-checkbox"></span>
                                <div className="permission-info">
                                  <span className="permission-name">{permission.name}</span>
                                  <span className="permission-desc">{permission.description}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                إلغاء
              </button>
              <button 
                className="btn-submit" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'جاري الحفظ...' : (
                  modalMode === 'add' ? 'إضافة المستخدم' :
                  modalMode === 'edit' ? 'حفظ التغييرات' :
                  'حفظ الصلاحيات'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
