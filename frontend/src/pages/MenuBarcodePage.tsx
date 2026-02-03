import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import '../styles/menu-barcode.css';

/**
 * تصدير رمز QR كصورة PNG
 */
function exportQrAsPng(qrWrapRef: React.RefObject<HTMLDivElement | null>, filename: string = 'mirmaia-menu-qr.png') {
  const wrap = qrWrapRef.current;
  if (!wrap) return;
  const svg = wrap.querySelector('svg');
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  const size = 512;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(url);
      return;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    const png = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = png;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

/**
 * صفحة إنشاء باركود/رمز QR لفتح منيو الزبائن فقط.
 * عند مسح الرمز يفتح المتصفح صفحة المنيو.
 */
const MenuBarcodePage: React.FC = () => {
  const qrWrapRef = useRef<HTMLDivElement>(null);
  const menuUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/menu/view`
    : '/menu/view';

  return (
    <div className="page-container" dir="rtl">
      <Navigation />
      <main className="main-content">
        <div className="menu-barcode-page">
          <header className="menu-barcode-header">
            <h1 className="menu-barcode-title">باركود فتح المنيو</h1>
            <p className="menu-barcode-subtitle">
              امسح الرمز بالجوال لفتح منيو الزبائن فقط
            </p>
          </header>

          <section className="menu-barcode-card">
            <div className="menu-barcode-qr-wrap" ref={qrWrapRef}>
              <QRCodeSVG
                value={menuUrl}
                size={240}
                level="M"
                bgColor="#ffffff"
                fgColor="#2c1810"
                marginSize={2}
                includeMargin
                role="img"
                aria-label="رمز QR لفتح منيو الزبائن"
              />
            </div>
            <p className="menu-barcode-url">{menuUrl}</p>
            <p className="menu-barcode-hint">
              ضع هذا الرمز على الطاولات أو عند المدخل ليفتح الزبائن المنيو على جوالهم
            </p>
            <div className="menu-barcode-buttons">
              <button
                type="button"
                className="menu-barcode-btn menu-barcode-btn-export"
                onClick={() => exportQrAsPng(qrWrapRef, 'mirmaia-menu-qr.png')}
              >
                📥 تصدير كصورة
              </button>
              <Link to="/menu/view" className="menu-barcode-btn">
                فتح المنيو الآن
              </Link>
            </div>
          </section>

          <section className="menu-barcode-actions">
            <p className="menu-barcode-print-hint">
              للطباعة: استخدم طباعة الصفحة (Ctrl+P) لطباعة الرمز ووضعه في المحل
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default MenuBarcodePage;
