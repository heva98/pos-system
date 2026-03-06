import { useEffect, useState } from 'react'
import { Receipt, Eye, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { salesAPI } from '../../services/api'
import { Modal, PageLoader, PageHeader, EmptyState } from '../../components/ui'
import { formatCurrency, formatDate, today } from '../../utils/helpers'
import useAuthStore from '../../store/authStore'

export default function SalesPage() {
  const [sales, setSales]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [fromDate, setFrom]       = useState(today())
  const [toDate, setTo]           = useState(today())
  const { user } = useAuthStore()
  const canVoid = ['admin', 'manager'].includes(user?.role)

  const load = async () => {
    setLoading(true)
    try {
      const res = await salesAPI.list({ from_date: fromDate, to_date: toDate })
      setSales(res.data)
    } catch { toast.error('Failed to load sales') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [fromDate, toDate])

  const handleVoid = async (id) => {
    if (!confirm('Void this sale and restore stock?')) return
    try {
      await salesAPI.void(id)
      toast.success('Sale voided')
      load()
      setSelected(null)
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to void') }
  }

  const statusBadge = (status) => {
    if (status === 'completed') return <span className="badge-green">Completed</span>
    if (status === 'voided')    return <span className="badge-red">Voided</span>
    return <span className="badge-yellow">{status}</span>
  }

  if (loading) return <PageLoader />

  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.total_amount, 0)

  return (
    <div className="p-6">
      <PageHeader title="Sales History" subtitle={`${sales.length} transactions · ${formatCurrency(totalRevenue)} total`} />

      {/* Date filters */}
      <div className="flex gap-3 mb-6">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFrom(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={toDate} onChange={(e) => setTo(e.target.value)} className="input" />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Receipt #', 'Date', 'Items', 'Payment', 'Total', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {sales.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={Receipt} message="No sales found for this period" /></td></tr>
              ) : sales.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.receipt_number}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(s.created_at)}</td>
                  <td className="px-4 py-3">{s.items.length}</td>
                  <td className="px-4 py-3 capitalize">{s.payment_method.replace('_', ' ')}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(s.total_amount)}</td>
                  <td className="px-4 py-3">{statusBadge(s.status)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(s)} className="text-gray-400 hover:text-blue-600">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale detail modal */}
      {selected && (
        <Modal title={`Receipt — ${selected.receipt_number}`} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Date:</span> {formatDate(selected.created_at)}</div>
              <div><span className="text-gray-500">Payment:</span> <span className="capitalize">{selected.payment_method.replace('_',' ')}</span></div>
              <div><span className="text-gray-500">Status:</span> {statusBadge(selected.status)}</div>
            </div>

            <table className="w-full text-sm border-t pt-2">
              <thead><tr className="text-gray-500 text-xs">
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Qty</th>
                <th className="text-right py-1">Price</th>
                <th className="text-right py-1">Total</th>
              </tr></thead>
              <tbody className="divide-y">
                {selected.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2">Product #{item.product_id}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right font-medium">{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(selected.subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax</span><span>{formatCurrency(selected.tax_amount)}</span></div>
              {selected.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(selected.discount_amount)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{formatCurrency(selected.total_amount)}</span></div>
              {selected.change_amount > 0 && <div className="flex justify-between text-gray-500"><span>Change</span><span>{formatCurrency(selected.change_amount)}</span></div>}
            </div>

            {canVoid && selected.status === 'completed' && (
              <button onClick={() => handleVoid(selected.id)} className="btn-danger w-full flex items-center justify-center gap-2 mt-2">
                <XCircle className="w-4 h-4" /> Void This Sale
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}