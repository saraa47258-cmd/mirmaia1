import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import '../styles/pages.css';

interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  is_available: boolean;
  image_url?: string;
}

interface CategoryApi {
  id: number;
  name: string;
  description: string | null;
}

const categoryIcons: { [key: string]: string } = {
  'الكل': '🏷️',
  'قهوة': '☕',
  'عصائر': '🧃',
  'وجبات خفيفة': '🍪',
  'مشروبات باردة': '🧊',
  'أخرى': '📦',
};

const MenuPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [apiCategories, setApiCategories] = useState<CategoryApi[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    category_id: 1,
    name: '',
    description: '',
    price: '',
    cost: '',
    is_available: true,
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '') || 'http://localhost:3000';
  const getImageSrc = (imageUrl: string) => {
    if (!imageUrl || !imageUrl.trim()) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    const filename = imageUrl.replace(/^\/uploads\/products\//, '').replace(/^\/api\/uploads\/products\//, '');
    return filename ? `${apiBase}/api/uploads/products/${filename}` : '';
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get<CategoryApi[]>('/api/categories');
      setApiCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setApiCategories([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      const raw = Array.isArray(response.data) ? response.data : [];
      setProducts(raw.filter((p: any) => p && typeof p === 'object'));
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const categoryList = Array.isArray(apiCategories) ? apiCategories : [];
  const filterCategories = [
    { id: 0, name: 'الكل', icon: categoryIcons['الكل'] || '🏷️' },
    ...categoryList.map(c => ({ id: c.id, name: c.name, icon: categoryIcons[c.name] || '📦' })),
  ];

  const productList = Array.isArray(products) ? products : [];
  const filteredProducts = productList.filter(p => {
    const matchCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
    const matchSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingProductId(null);
    setFormData({
      category_id: apiCategories[0]?.id || 1,
      name: '',
      description: '',
      price: '',
      cost: '',
      is_available: true,
    });
    setProductImage(null);
    setProductImagePreview(null);
    setShowForm(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProductId(product.id);
    setFormData({
      category_id: product.category_id,
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      cost: String(product.cost ?? ''),
      is_available: product.is_available,
    });
    setProductImage(null);
    setProductImagePreview(product.image_url ? getImageSrc(product.image_url) : null);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      setProductImagePreview(URL.createObjectURL(file));
    } else {
      setProductImage(null);
      setProductImagePreview(null);
    }
  };

  const buildProductFormData = (): FormData => {
    const data = new FormData();
    data.append('category_id', String(formData.category_id));
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price || '0');
    data.append('cost', formData.cost || '');
    if (editingProductId != null) {
      data.append('is_available', formData.is_available ? 'true' : 'false');
    }
    if (productImage) {
      data.append('image', productImage);
    }
    return data;
  };

  const handleAddProduct = async () => {
    setLoading(true);
    try {
      const data = buildProductFormData();
      await axios.post('/api/products', data);
      fetchProducts();
      setShowForm(false);
      setFormData({ category_id: 1, name: '', description: '', price: '', cost: '', is_available: true });
      setProductImage(null);
      setProductImagePreview(null);
      alert('تم إضافة المنتج بنجاح');
    } catch (error: any) {
      alert('خطأ: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProductId) return;
    setLoading(true);
    try {
      const data = buildProductFormData();
      await axios.put(`/api/products/${editingProductId}`, data);
      fetchProducts();
      setShowForm(false);
      setEditingProductId(null);
      setFormData({ category_id: 1, name: '', description: '', price: '', cost: '', is_available: true });
      setProductImage(null);
      setProductImagePreview(null);
      alert('تم تحديث المنتج');
    } catch (error: any) {
      alert('خطأ: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('هل تريد حذف هذا المنتج؟')) {
      try {
        await axios.delete(`/api/products/${productId}`);
        fetchProducts();
        alert('تم حذف المنتج');
      } catch (error: any) {
        alert('خطأ: ' + error.response?.data?.error);
      }
    }
  };

  return (
    <div className="page-container">
      <Navigation />
      
      <main className="main-content">
        <div className="menu-page">
          {/* Header */}
          <header className="menu-header">
            <div className="menu-title-wrap">
              <h1 className="menu-title">منيو الموظفين</h1>
              <p className="menu-subtitle">إدارة المنتجات وإرسال الطلبات</p>
            </div>
            <button
              className="menu-btn-add"
              onClick={handleOpenAdd}
            >
              <span className="menu-btn-add-icon">+</span>
              إضافة منتج جديد
            </button>
          </header>

          {/* Search & Filters */}
          <section className="menu-filters">
            <div className="menu-search-wrap">
              <span className="menu-search-icon">🔍</span>
              <input
                type="text"
                className="menu-search-input"
                placeholder="ابحث عن منتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="menu-categories-wrap">
              {filterCategories.map((cat) => (
                <button
                  key={cat.id}
                  className={`menu-filter-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  <span className="menu-filter-icon">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </section>

          {/* Add Product Form Card */}
          {showForm && (
            <section className="menu-form-card">
              <h2 className="menu-form-title">{editingProductId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
              
              <div className="menu-form-grid">
                <div className="menu-form-group">
                  <label className="menu-form-label">اسم المنتج</label>
                  <input
                    type="text"
                    className="menu-form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="اسم المنتج"
                  />
                </div>
                <div className="menu-form-group">
                  <label className="menu-form-label">القسم (الفئة)</label>
                  <select
                    className="menu-form-input"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                  >
                    {apiCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="menu-form-group">
                  <label className="menu-form-label">السعر (ر.ع)</label>
                  <input
                    type="number"
                    step="0.001"
                    className="menu-form-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.000"
                  />
                </div>
                <div className="menu-form-group">
                  <label className="menu-form-label">سعر التكلفة (ر.ع)</label>
                  <input
                    type="number"
                    step="0.001"
                    className="menu-form-input"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.000"
                  />
                </div>
              </div>

              <div className="menu-form-group menu-form-group-full">
                <label className="menu-form-label">الوصف</label>
                <textarea
                  className="menu-form-input menu-form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف المنتج"
                  rows={3}
                />
              </div>

              <div className="menu-form-group menu-form-group-full">
                <label className="menu-form-label">صورة المنتج</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="menu-form-input"
                  onChange={handleImageChange}
                />
                {productImagePreview && (
                  <div className="menu-form-image-preview">
                    <img src={productImagePreview} alt="معاينة" />
                  </div>
                )}
              </div>

              {editingProductId && (
                <div className="menu-form-group menu-form-group-full">
                  <label className="menu-form-label">
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    />
                    {' '}متوفر للبيع
                  </label>
                </div>
              )}

              <div className="menu-form-actions">
                <button
                  type="button"
                  className="menu-form-btn-submit"
                  onClick={editingProductId ? handleUpdateProduct : handleAddProduct}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="menu-form-spinner" />
                      جاري الحفظ...
                    </>
                  ) : editingProductId ? (
                    <>تحديث المنتج</>
                  ) : (
                    <>
                      <span>✓</span>
                      إضافة المنتج
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="menu-form-btn-cancel"
                  onClick={() => { setShowForm(false); setEditingProductId(null); }}
                >
                  إلغاء
                </button>
              </div>
            </section>
          )}

          {/* Products Grid */}
          <section className="menu-products" aria-label="قائمة المنتجات">
            {filteredProducts.map((product) => {
              const imgSrc = getImageSrc(product.image_url || '');
              return (
              <article key={product.id} className="menu-product-card">
                <div className="menu-product-image">
                  {imgSrc ? (
                    <img 
                      src={imgSrc} 
                      alt={product.name || ''}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="menu-product-placeholder">☕</span>
                  )}
                  {!product.is_available && (
                    <span className="menu-product-badge unavailable">غير متوفر</span>
                  )}
                </div>
                <div className="menu-product-body">
                  <h3 className="menu-product-name">{product.name}</h3>
                  <p className="menu-product-category">{product.category}</p>
                  <div className="menu-product-footer">
                    <span className="menu-product-price">{(Number(product.price) || 0).toFixed(3)} ر.ع</span>
                    <div className="menu-product-actions">
                      <button
                        type="button"
                        className="menu-action-btn edit"
                        title="تعديل"
                        onClick={() => handleOpenEdit(product)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="menu-action-btn delete"
                        title="حذف"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </article>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
};

export default MenuPage;
