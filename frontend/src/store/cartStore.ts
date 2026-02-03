import { create } from 'zustand';
import { 
  calculateItemSubtotal, 
  sumItems, 
  preciseSubtract,
  round 
} from '../utils/calculations';

interface CartItem {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface CartStore {
  items: CartItem[];
  discount: number;
  addItem: (item: CartItem) => void;
  removeItem: (product_id: number) => void;
  updateQuantity: (product_id: number, quantity: number) => void;
  setDiscount: (discount: number) => void;
  clear: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discount: 0,

  addItem: (item: CartItem) => {
    set((state) => {
      const existing = state.items.find(i => i.product_id === item.product_id);
      if (existing) {
        const newQuantity = existing.quantity + item.quantity;
        const newSubtotal = calculateItemSubtotal(existing.unit_price, newQuantity);
        return {
          items: state.items.map(i =>
            i.product_id === item.product_id
              ? { ...i, quantity: newQuantity, subtotal: newSubtotal }
              : i
          ),
        };
      }
      // حساب subtotal بدقة للعنصر الجديد
      const subtotal = calculateItemSubtotal(item.unit_price, item.quantity);
      return { items: [...state.items, { ...item, subtotal }] };
    });
  },

  removeItem: (product_id: number) => {
    set((state) => ({
      items: state.items.filter(i => i.product_id !== product_id),
    }));
  },

  updateQuantity: (product_id: number, quantity: number) => {
    set((state) => ({
      items: state.items.map(i =>
        i.product_id === product_id
          ? { ...i, quantity, subtotal: calculateItemSubtotal(i.unit_price, quantity) }
          : i
      ),
    }));
  },

  setDiscount: (discount: number) => {
    set({ discount: round(discount) });
  },

  clear: () => {
    set({ items: [], discount: 0 });
  },

  getSubtotal: () => {
    const state = get();
    return sumItems(state.items);
  },

  getTotal: () => {
    const state = get();
    const subtotal = sumItems(state.items);
    return preciseSubtract(subtotal, state.discount);
  },
}));

export default useCartStore;
