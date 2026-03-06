import { create } from 'zustand'

const useCartStore = create((set, get) => ({
  items: [],
  customer: null,
  discount: 0,
  paymentMethod: 'cash',
  amountTendered: 0,

  addItem: (product, quantity = 1) => {
    const { items } = get()
    const existing = items.find((i) => i.product.id === product.id)
    if (existing) {
      set({
        items: items.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        ),
      })
    } else {
      set({ items: [...items, { product, quantity, discount: 0 }] })
    }
  },

  removeItem: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) })),

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set((s) => ({
      items: s.items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    }))
  },

  updateItemDiscount: (productId, discount) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.product.id === productId ? { ...i, discount } : i
      ),
    })),

  setCustomer:       (customer)       => set({ customer }),
  setDiscount:       (discount)       => set({ discount }),
  setPaymentMethod:  (paymentMethod)  => set({ paymentMethod }),
  setAmountTendered: (amountTendered) => set({ amountTendered }),

  clearCart: () =>
    set({ items: [], customer: null, discount: 0, paymentMethod: 'cash', amountTendered: 0 }),

  // Computed totals
  getSubtotal: () => {
    const { items } = get()
    return items.reduce((sum, i) => sum + i.product.selling_price * i.quantity - i.discount, 0)
  },
  getTax: () => {
    const { items } = get()
    return items.reduce(
      (sum, i) => sum + (i.product.selling_price * i.quantity * i.product.tax_rate) / 100,
      0
    )
  },
  getTotal: () => {
    const { discount } = get()
    return get().getSubtotal() + get().getTax() - discount
  },
  getChange: () => {
    const { amountTendered } = get()
    return Math.max(amountTendered - get().getTotal(), 0)
  },
}))

export default useCartStore