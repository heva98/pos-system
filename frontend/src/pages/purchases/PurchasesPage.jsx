import { useEffect, useState } from 'react'
import { Plus, CheckCircle, Eye, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import { purchasesAPI, suppliersAPI, productsAPI } from '../../services/api'
import { Modal, PageLoader, PageHeader, EmptyState } from '../../components/ui'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function PurchasesPage() {
  const [orders, setOrders]       = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [showCreate, setCreate]   = useState(false)

  // New PO form state
  const [supplierId, setSupplierId]   = useState('')
  const [notes, setNotes]             = useState('')
  const [poItems, setPoItems]         = useState([{ product_id: '', quantity_ordered: 1, unit_cost: 0 }])

  const load = async () => {
    try {
      const [oRes, sRes, pRes] = await Promise.all([
        purchasesAPI.list(),
        suppliersAPI.list(),
        productsAPI.list({}),
      ])
      setOrders(oRes.data); setSuppliers(sRes.data); setProducts(pRes.data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const addRow    = () => setPoItems([...poItems, { product_id: '', quantity_ordered: 1, unit_cost: 0 }])
  const removeRow = (i) => setPoItems(poItems.filter((_, idx) => idx !== i))
  const updateRow = (i, field, value) => {
    const updated = [...poItems]
    updated[i][field] = value
    // Auto-fill cost price
    if (field === 'product_id') {
      const p = products.find((p) => p.id === Number(value))
      if (p) updated[i].unit_cost = p.cost_price
    }
    setPoItems(updated)
  }

  const handleCreate = async () => {
    if (!supplierId) { toast.error('Select a supplier'); return }
    try {
      await purchasesAPI.create({
        supplier_id: Number(supplierId),
        notes,
        items: poItems.map((i) => ({
          product_id: Number(i.product_id),
          quantity_ordered: Number(i.quantity_ordered),
          unit_cost: Number(i.unit_cost),
        })),
      })
      toast.success('Purchase order created')
      setCreate(false); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const handleReceive = async (id) => {
    if (!confirm('Mark as received and update stock?')) return
    try { await purchasesAPI.receive(id); toast.success('Stock updated'); load() }
    catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const statusBadge = (s) => {
    const map = { draft: 'badge-yellow', sent: 'badge-blue', received: 'badge-green', cancelled: 'badge-red', partial: 'badge-yellow' }
    return <span className={map[s] || 'badge-blue'}>{s}</span>
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-6">
      <PageHeader
        title="Purchase Orders"
        subtitle={`${orders.length} orders`}
        action={
          <button onClick={() => setCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Order
          </button>
        }
      />

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['PO Number', 'Supplier', 'Items', 'Total', 'Status', 'Date', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.length === 0 ? (
              <tr><td colSpan={7}><EmptyState icon={Truck} message="No purchase orders yet" /></td></tr>
            ) : orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{o.po_number}</td>
                <td className="px-4 py-3">{suppliers.find(s => s.id === o.supplier_id)?.name || '—'}</td>
                <td className="px-4 py-3">{o.items.length}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(o.total_amount)}</td>
                <td className="px-4 py-3">{statusBadge(o.status)}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(o.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(o)} className="text-gray-400 hover:text-blue-600"><Eye className="w-4 h-4" /></button>
                    {o.status !== 'received' && o.status !== 'cancelled' && (
                      <button onClick={() => handleReceive(o.id)} className="text-gray-400 hover:text-green-600" title="Mark Received">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <Modal title={`PO — ${selected.po_number}`} onClose={() => setSelected(null)} size="lg">
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <div><span className="text-gray-500">Status:</span> {statusBadge(selected.status)}</div>
              <div><span className="text-gray-500">Total:</span> <strong>{formatCurrency(selected.total_amount)}</strong></div>
            </div>
            {selected.notes && <p className="text-sm text-gray-600 italic">{selected.notes}</p>}
            <table className="w-full text-sm border-t pt-2">
              <thead className="text-gray-500 text-xs border-b">
                <tr>
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2">Ordered</th>
                  <th className="text-right py-2">Received</th>
                  <th className="text-right py-2">Unit Cost</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selected.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2">{products.find(p => p.id === item.product_id)?.name || `#${item.product_id}`}</td>
                    <td className="text-right">{item.quantity_ordered}</td>
                    <td className="text-right">{item.quantity_received}</td>
                    <td className="text-right">{formatCurrency(item.unit_cost)}</td>
                    <td className="text-right font-medium">{formatCurrency(item.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* Create PO Modal */}
      {showCreate && (
        <Modal title="New Purchase Order" onClose={() => setCreate(false)} size="xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Supplier *</label>
                <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input">
                  <option value="">— Select —</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs border-b">
                <tr>
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2 w-24">Qty</th>
                  <th className="text-right py-2 w-32">Unit Cost</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {poItems.map((row, i) => (
                  <tr key={i}>
                    <td className="py-1 pr-2">
                      <select value={row.product_id} onChange={(e) => updateRow(i, 'product_id', e.target.value)} className="input text-xs">
                        <option value="">— Product —</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="py-1 px-1">
                      <input type="number" min="1" value={row.quantity_ordered} onChange={(e) => updateRow(i, 'quantity_ordered', e.target.value)} className="input text-xs text-right" />
                    </td>
                    <td className="py-1 pl-1">
                      <input type="number" min="0" step="0.01" value={row.unit_cost} onChange={(e) => updateRow(i, 'unit_cost', e.target.value)} className="input text-xs text-right" />
                    </td>
                    <td className="py-1 pl-2">
                      <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={addRow} className="btn-secondary text-sm">+ Add Row</button>

            <div className="text-right font-semibold">
              Total: {formatCurrency(poItems.reduce((s, i) => s + Number(i.quantity_ordered) * Number(i.unit_cost), 0))}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleCreate} className="btn-primary flex-1">Create Purchase Order</button>
              <button onClick={() => setCreate(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}