/**
 * وحدة العمليات الحسابية الدقيقة
 * تستخدم تقنية التحويل للأعداد الصحيحة (بالبايسة) لتجنب أخطاء الأرقام العشرية
 * 1 ريال عماني = 1000 بايسة
 */

// عدد الخانات العشرية (3 للريال العماني)
const DECIMAL_PLACES = 3;
const MULTIPLIER = Math.pow(10, DECIMAL_PLACES); // 1000

/**
 * تحويل الرقم العشري إلى عدد صحيح (بايسة)
 */
export const toInteger = (value: number | string): number => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 0;
  // نستخدم Math.round لتجنب أخطاء التقريب
  return Math.round(num * MULTIPLIER);
};

/**
 * تحويل العدد الصحيح (بايسة) إلى رقم عشري
 */
export const toDecimal = (value: number): number => {
  return value / MULTIPLIER;
};

/**
 * جمع دقيق لمجموعة من الأرقام
 */
export const preciseAdd = (...values: number[]): number => {
  const sum = values.reduce((acc, val) => acc + toInteger(val), 0);
  return toDecimal(sum);
};

/**
 * طرح دقيق
 */
export const preciseSubtract = (a: number, b: number): number => {
  const result = toInteger(a) - toInteger(b);
  return toDecimal(result);
};

/**
 * ضرب دقيق (للكمية × السعر)
 */
export const preciseMultiply = (price: number, quantity: number): number => {
  // السعر × الكمية
  // نحول السعر فقط لأن الكمية عدد صحيح
  const priceInBaisa = toInteger(price);
  const result = priceInBaisa * quantity;
  return toDecimal(result);
};

/**
 * حساب النسبة المئوية بدقة
 */
export const precisePercentage = (amount: number, percentage: number): number => {
  const amountInBaisa = toInteger(amount);
  // percentage مثل 15 للـ 15%
  const result = Math.round((amountInBaisa * percentage) / 100);
  return toDecimal(result);
};

/**
 * حساب الخصم بالنسبة المئوية
 */
export const calculateDiscountAmount = (subtotal: number, discountPercent: number): number => {
  return precisePercentage(subtotal, discountPercent);
};

/**
 * حساب الضريبة
 */
export const calculateTax = (amount: number, taxRate: number = 0): number => {
  return precisePercentage(amount, taxRate);
};

/**
 * حساب الإجمالي النهائي
 */
export const calculateTotal = (
  subtotal: number,
  discount: number = 0,
  taxRate: number = 0
): { subtotal: number; discount: number; tax: number; total: number } => {
  const subtotalInt = toInteger(subtotal);
  const discountInt = toInteger(discount);
  
  // الإجمالي بعد الخصم
  const afterDiscount = subtotalInt - discountInt;
  
  // الضريبة على المبلغ بعد الخصم
  const taxInt = Math.round((afterDiscount * taxRate) / 100);
  
  // الإجمالي النهائي
  const totalInt = afterDiscount + taxInt;
  
  return {
    subtotal: toDecimal(subtotalInt),
    discount: toDecimal(discountInt),
    tax: toDecimal(taxInt),
    total: toDecimal(totalInt)
  };
};

/**
 * تنسيق الرقم للعرض بـ 3 خانات عشرية (يقبل number أو string من الـ API)
 */
export const formatCurrency = (value: number | string): string => {
  const num = Number(value);
  if (isNaN(num)) return '0.000';
  return num.toFixed(DECIMAL_PLACES);
};

/**
 * تنسيق الرقم مع العملة
 */
export const formatWithCurrency = (value: number, currency: string = 'ر.ع'): string => {
  return `${formatCurrency(value)} ${currency}`;
};

/**
 * جمع مجموعة من العناصر (subtotals)
 */
export const sumItems = (items: { subtotal: number }[]): number => {
  const totalInBaisa = items.reduce((sum, item) => sum + toInteger(item.subtotal), 0);
  return toDecimal(totalInBaisa);
};

/**
 * حساب subtotal لعنصر واحد
 */
export const calculateItemSubtotal = (unitPrice: number, quantity: number): number => {
  return preciseMultiply(unitPrice, quantity);
};

/**
 * مقارنة رقمين مع تحمل دقة محدودة
 */
export const areEqual = (a: number, b: number): boolean => {
  return toInteger(a) === toInteger(b);
};

/**
 * التحقق من أن الرقم أكبر من صفر
 */
export const isPositive = (value: number): boolean => {
  return toInteger(value) > 0;
};

/**
 * تقريب الرقم للخانات العشرية المحددة
 */
export const round = (value: number): number => {
  return toDecimal(toInteger(value));
};

export default {
  toInteger,
  toDecimal,
  preciseAdd,
  preciseSubtract,
  preciseMultiply,
  precisePercentage,
  calculateDiscountAmount,
  calculateTax,
  calculateTotal,
  formatCurrency,
  formatWithCurrency,
  sumItems,
  calculateItemSubtotal,
  areEqual,
  isPositive,
  round
};
