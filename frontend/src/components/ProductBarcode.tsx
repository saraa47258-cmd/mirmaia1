import React from 'react';
import Barcode from 'react-barcode';
import '../styles/product-barcode.css';

/** تنسيق رقم الباركود للمنتج: M = mirmaia منيو، ثم 5 أرقام (معرف المنتج) */
export const formatProductBarcode = (productId: number): string => {
  return `M${String(productId).padStart(5, '0')}`;
};

interface ProductBarcodeProps {
  productId: number;
  productName?: string;
  /** عرض صغير للبطاقة أو كبير للطباعة */
  size?: 'small' | 'medium' | 'large';
  /** إظهار النص تحت الباركود */
  showValue?: boolean;
}

const ProductBarcode: React.FC<ProductBarcodeProps> = ({
  productId,
  productName,
  size = 'small',
  showValue = true,
}) => {
  const value = formatProductBarcode(productId);
  const height = size === 'small' ? 40 : size === 'medium' ? 48 : 56;
  const width = size === 'small' ? 1.5 : size === 'medium' ? 1.8 : 2.2;
  const fontSize = size === 'small' ? 11 : size === 'medium' ? 12 : 14;

  return (
    <div className={`product-barcode product-barcode--${size}`} dir="ltr">
      <div className="product-barcode-inner">
        <Barcode
          value={value}
          format="CODE128"
          renderer="svg"
          width={width}
          height={height}
          displayValue={showValue}
          fontSize={fontSize}
          margin={4}
          marginTop={2}
          marginBottom={2}
          background="#ffffff"
          lineColor="#2c1810"
        />
      </div>
      <span className="product-barcode-code" aria-hidden="true">{value}</span>
      {productName && (
        <span className="product-barcode-label" title={productName}>
          {productName}
        </span>
      )}
    </div>
  );
};

export default ProductBarcode;
