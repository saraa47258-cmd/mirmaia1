import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/customer-menu.css';

interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available?: boolean;
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
  'المشروبات الساخنة': '☕',
  'أخرى': '📦',
};

const CustomerMenuPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryApi[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [loading, setLoading] = useState(true);

  const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '') || 'http://localhost:3000';
  const getImageSrc = (imageUrl: string) => {
    if (!imageUrl || !imageUrl.trim()) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    const filename = imageUrl.replace(/^\/uploads\/products\//, '').replace(/^\/api\/uploads\/products\//, '');
    return filename ? `${apiBase}/api/uploads/products/${filename}` : '';
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get('/api/products'),
          axios.get('/api/categories'),
        ]);
        const list = Array.isArray(productsRes.data) ? productsRes.data : [];
        setProducts(list.filter((p: any) => p && typeof p === 'object'));
        setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      } catch (e) {
        console.error(e);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const categoryList = [{ id: 0, name: 'الكل' }, ...categories];
  const displayCategories = selectedCategory === 'الكل'
    ? categoryList.filter(c => c.name !== 'الكل').map(c => c.name)
    : [selectedCategory].filter(Boolean);

  const productsByCategory = displayCategories.length
    ? displayCategories.map(catName => ({
        name: catName,
        icon: categoryIcons[catName] || '📦',
        products: products.filter(p => p.category === catName && p.is_available !== false),
      })).filter(g => g.products.length > 0)
    : [];

  if (loading) {
    return (
      <div className="customer-menu-page customer-menu-loading">
        <div className="customer-menu-loading-spinner" />
        <p>جاري تحميل القائمة...</p>
      </div>
    );
  }

  return (
    <div className="customer-menu-page customer-menu-mobile-first" dir="rtl">
      <header className="customer-menu-header">
        <div className="customer-menu-header-inner">
          <div className="customer-menu-brand">
            <span className="customer-menu-logo" aria-hidden>☕</span>
            <div>
              <h1 className="customer-menu-title">منيو mirmaia</h1>
              <p className="customer-menu-subtitle">قائمتنا للزبائن</p>
            </div>
          </div>
          <Link to="/cashier" className="customer-menu-back" aria-label="العودة للنظام">
            ← العودة
          </Link>
        </div>
      </header>

      <nav className="customer-menu-tabs-wrap" aria-label="تصنيفات المنيو">
        <div className="customer-menu-tabs">
          {categoryList.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`customer-menu-tab ${selectedCategory === cat.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.name)}
              aria-pressed={selectedCategory === cat.name}
            >
              <span className="customer-menu-tab-icon">{categoryIcons[cat.name] || '📦'}</span>
              <span className="customer-menu-tab-label">{cat.name}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="customer-menu-main">
        {productsByCategory.length === 0 ? (
          <div className="customer-menu-empty">
            <p>لا توجد منتجات في هذه الفئة.</p>
          </div>
        ) : (
          productsByCategory.map(section => (
            <section key={section.name} className="customer-menu-section">
              <h2 className="customer-menu-section-title">
                <span className="customer-menu-section-icon">{section.icon}</span>
                {section.name}
              </h2>
              <div className="customer-menu-grid">
                {section.products.map(product => {
                  const imgSrc = getImageSrc(product.image_url || '');
                  return (
                    <article key={product.id} className="customer-menu-card">
                      <div className="customer-menu-card-image-wrap">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={product.name}
                            className="customer-menu-card-image"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="customer-menu-card-placeholder">
                            <span>{categoryIcons[product.category] || '☕'}</span>
                          </div>
                        )}
                      </div>
                      <div className="customer-menu-card-body">
                        <h3 className="customer-menu-card-name">{product.name}</h3>
                        {product.description && (
                          <p className="customer-menu-card-desc">{product.description}</p>
                        )}
                        <p className="customer-menu-card-price">
                          {(Number(product.price) || 0).toFixed(3)} <span className="currency">ر.ع</span>
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      <footer className="customer-menu-footer">
        <p>mirmaia — نظام نقاط البيع</p>
      </footer>
    </div>
  );
};

export default CustomerMenuPage;
