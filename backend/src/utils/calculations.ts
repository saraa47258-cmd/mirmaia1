/**
 * وحدة الحسابات الدقيقة للـ Backend
 * تستخدم الأعداد الصحيحة (بالبيسة) لتجنب أخطاء الأرقام العشرية
 * 1 ريال عماني = 1000 بيسة
 */

const DECIMAL_PLACES = 3;
const MULTIPLIER = 1000; // للريال العماني (3 خانات عشرية)

/**
 * تحويل من رقم عشري إلى عدد صحيح (بيسة)
 */
export function toInteger(decimal: number): number {
  return Math.round(decimal * MULTIPLIER);
}

/**
 * تحويل من عدد صحيح (بيسة) إلى رقم عشري
 */
export function toDecimal(integer: number): number {
  return integer / MULTIPLIER;
}

/**
 * جمع دقيق
 */
export function preciseAdd(...numbers: number[]): number {
  const sum = numbers.reduce((acc, num) => acc + toInteger(num), 0);
  return toDecimal(sum);
}

/**
 * طرح دقيق
 */
export function preciseSubtract(a: number, b: number): number {
  return toDecimal(toInteger(a) - toInteger(b));
}

/**
 * ضرب دقيق
 */
export function preciseMultiply(a: number, b: number): number {
  // للضرب: نحول الأول إلى integer، نضرب، ثم نقسم
  return toDecimal(Math.round(toInteger(a) * b));
}

/**
 * حساب النسبة المئوية
 */
export function precisePercentage(amount: number, percentage: number): number {
  const intAmount = toInteger(amount);
  const result = Math.round(intAmount * percentage / 100);
  return toDecimal(result);
}

/**
 * حساب الضريبة
 */
export function calculateTax(amount: number, taxRate: number = 5): number {
  return precisePercentage(amount, taxRate);
}

/**
 * حساب مبلغ الخصم
 */
export function calculateDiscountAmount(subtotal: number, discountPercent: number): number {
  return precisePercentage(subtotal, discountPercent);
}

/**
 * حساب المجموع النهائي
 */
export function calculateTotal(
  subtotal: number,
  discount: number = 0,
  taxRate: number = 0
): { subtotal: number; discount: number; tax: number; total: number } {
  const afterDiscount = preciseSubtract(subtotal, discount);
  const tax = calculateTax(afterDiscount, taxRate);
  const total = preciseAdd(afterDiscount, tax);
  
  return {
    subtotal: round(subtotal),
    discount: round(discount),
    tax: round(tax),
    total: round(total)
  };
}

/**
 * جمع عناصر السلة
 */
export function sumItems(items: Array<{ subtotal: number }>): number {
  const sum = items.reduce((acc, item) => acc + toInteger(item.subtotal), 0);
  return toDecimal(sum);
}

/**
 * حساب المجموع الفرعي للعنصر
 */
export function calculateItemSubtotal(unitPrice: number, quantity: number): number {
  return preciseMultiply(unitPrice, quantity);
}

/**
 * تقريب إلى 3 خانات عشرية
 */
export function round(value: number): number {
  return toDecimal(toInteger(value));
}

/**
 * تنسيق العملة
 */
export function formatCurrency(amount: number): string {
  return round(amount).toFixed(DECIMAL_PLACES);
}

/**
 * مقارنة رقمين بدقة
 */
export function areEqual(a: number, b: number): boolean {
  return toInteger(a) === toInteger(b);
}

/**
 * التحقق من أن الرقم موجب
 */
export function isPositive(value: number): boolean {
  return toInteger(value) > 0;
}
