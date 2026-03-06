import { useState, useRef, useEffect } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, User, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import useCartStore from '../../store/cartStore'
import { productsAPI, customersAPI, salesAPI } from '../../services/api'
import { formatCurrency, PAYMENT_METHODS } from '../../utils/helpers'
import { Modal, Spinner } from '../../components/ui'

export default function POSPage() {
  const [search, setSearch]           = useState('')
  const [searchResults, setResults]   = useState([])
  const [searching, setSearching]     = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [customerSearch, setCSearch]  = useState('')
  const [customers, setCustomers]     = useState([])
  const searchRef = useRef()
  const cart = useCartStore()

  // Search products
  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await productsAPI.list({ search })
        setResults(res.data.slice(0, 8))
      } catch { /* silent */ }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Barcode: press Enter to add first result
  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      cart.addItem(searchResults[0])
      setSearch('')
      setResults([])
    }
  }

  // Search customers
  useEffect(() => {
    if (!customerSearch.trim()) { setCustomers([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await customersAPI.list({ search: customerSearch })
        setCustomers(res.data.slice(0, 5))
      } catch { /* silent */ }
    }, 300)
    return () => clearTimeout(t)
  }, [customerSearch])

  const handleCheckout = async () => {
    if (cart.items.length === 0) { toast.error('Cart is empty'); return }
    setSubmitting(true)
    try {
      await salesAPI.create({
        items: cart.items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          discount: i.discount,
        })),
        payment_method: cart.paymentMethod,
        customer_id: cart.customer?.id || null,
        amount_tendered: cart.amountTendered || cart.getTotal(),
        discount_amount: cart.discount,
      })
      toast.success('Sale completed!')
      cart.clearCart()
      setShowPayment(false)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Checkout failed')
    } finally {
      setSubmitting(false)
    }
  }

  const subtotal = cart.getSubtotal()
  const tax      = cart.getTax()
  const total    = cart.getTotal()
  const change   = cart.getChange()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT — Product Search */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <h1 className="text-xl font-bold mb-4">POS Checkout</h1>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            className="input pl-9"
            placeholder="Search product or scan barcode..."
            autoFocus
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size="sm" /></div>
          )}
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="bg-white border rounded-lg shadow-lg mb-4 divide-y max-h-64 overflow-y-auto">
            {searchResults.map((p) => (
              <button
                key={p.id}
                onClick={() => { cart.addItem(p); setSearch(''); setResults([]) }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 text-left"
              >
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.barcode || 'No barcode'} · Stock: {p.quantity_in_stock} {p.unit}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{formatCurrency(p.selling_price)}</p>
                  <Plus className="w-4 h-4 text-gray-400 ml-auto" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-300">
              <ShoppingCart className="w-12 h-12 mb-2" />
              <p className="text-sm">Cart is empty — search or scan a product</p>
            </div>
          ) : (
            cart.items.map(({ product, quantity, discount }) => (
              <div key={product.id} className="bg-white rounded-lg border p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(product.selling_price)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => cart.updateQuantity(product.id, quantity - 1)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                  <button onClick={() => cart.updateQuantity(product.id, quantity + 1)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="w-24 text-right font-semibold text-sm">
                  {formatCurrency(product.selling_price * quantity - discount)}
                </p>
                <button onClick={() => cart.removeItem(product.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT — Order Summary */}
      <div className="w-80 bg-white border-l flex flex-col p-4 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Order Summary</h2>

        {/* Customer */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-1 block">Customer (optional)</label>
          {cart.customer ? (
            <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">{cart.customer.full_name}</span>
              </div>
              <button onClick={() => cart.setCustomer(null)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={customerSearch}
                onChange={(e) => setCSearch(e.target.value)}
                className="input text-sm"
                placeholder="Search customer..."
              />
              {customers.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-lg shadow mt-1">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { cart.setCustomer(c); setCSearch(''); setCustomers([]) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {c.full_name} · {c.phone}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Discount */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-1 block">Overall Discount</label>
          <input
            type="number"
            min="0"
            value={cart.discount}
            onChange={(e) => cart.setDiscount(Number(e.target.value))}
            className="input text-sm"
            placeholder="0"
          />
        </div>

        {/* Totals */}
        <div className="border-t pt-4 space-y-2 text-sm mb-4">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span><span>{formatCurrency(tax)}</span>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span><span>-{formatCurrency(cart.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span><span className="text-blue-600">{formatCurrency(total)}</span>
          </div>
        </div>

        <button
          onClick={() => setShowPayment(true)}
          disabled={cart.items.length === 0}
          className="btn-primary w-full py-3 text-base mt-auto"
        >
          <CreditCard className="w-5 h-5 inline mr-2" />
          Charge {formatCurrency(total)}
        </button>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <Modal title="Complete Payment" onClose={() => setShowPayment(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => cart.setPaymentMethod(m.value)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      cart.paymentMethod === m.value
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {cart.paymentMethod === 'cash' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Amount Tendered</label>
                <input
                  type="number"
                  min={total}
                  value={cart.amountTendered || ''}
                  onChange={(e) => cart.setAmountTendered(Number(e.target.value))}
                  className="input"
                  placeholder={formatCurrency(total)}
                />
                {cart.amountTendered >= total && (
                  <p className="text-green-600 font-medium mt-2">
                    Change: {formatCurrency(change)}
                  </p>
                )}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
              <div className="flex justify-between"><span>Items</span><span>{cart.items.length}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total Due</span><span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <button onClick={handleCheckout} disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? 'Processing...' : 'Confirm & Complete Sale'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}