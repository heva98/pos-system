import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { reportsAPI } from '../../services/api'
import { PageHeader, StatCard } from '../../components/ui'
import { formatCurrency, today } from '../../utils/helpers'
import { TrendingUp, Package, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [fromDate, setFrom]       = useState(today())
  const [toDate, setTo]           = useState(today())
  const [summary, setSummary]     = useState(null)
  const [topProducts, setTop]     = useState([])
  const [lowStock, setLowStock]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [tab, setTab]             = useState('sales')

  const loadSales = async () => {
    setLoading(true)
    try {
      const [sumRes, topRes] = await Promise.all([
        reportsAPI.salesSummary({ from_date: fromDate, to_date: toDate }),
        reportsAPI.topProducts({ from_date: fromDate, to_date: toDate, limit: 10 }),
      ])
      setSummary(sumRes.data)
      setTop(topRes.data)
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }

  const loadLowStock = async () => {
    setLoading(true)
    try {
      const res = await reportsAPI.lowStock()
      setLowStock(res.data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6">
      <PageHeader title="Reports" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {['sales', 'inventory'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'sales' ? 'Sales Report' : 'Inventory / Low Stock'}
          </button>
        ))}
      </div>

      {tab === 'sales' && (
        <div className="space-y-6">
          {/* Date range */}
          <div className="flex gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFrom(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input type="date" value={toDate} onChange={(e) => setTo(e.target.value)} className="input" />
            </div>
            <button onClick={loadSales} disabled={loading} className="btn-primary px-6">
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </div>

          {summary && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Transactions"   value={summary.total_transactions} icon={TrendingUp} color="blue" />
                <StatCard title="Revenue"        value={formatCurrency(summary.revenue)}   icon={TrendingUp} color="green" />
                <StatCard title="Tax Collected"  value={formatCurrency(summary.tax)}       icon={TrendingUp} color="purple" />
                <StatCard title="Discounts Given" value={formatCurrency(summary.discounts)} icon={TrendingUp} color="yellow" />
              </div>

              {topProducts.length > 0 && (
                <div className="card">
                  <h2 className="font-semibold mb-4">Top Selling Products</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topProducts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>

                  <table className="w-full text-sm mt-4">
                    <thead className="text-gray-500 text-xs border-b">
                      <tr>
                        <th className="text-left py-2">#</th>
                        <th className="text-left py-2">Product</th>
                        <th className="text-right py-2">Qty Sold</th>
                        <th className="text-right py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {topProducts.map((p, i) => (
                        <tr key={p.product_id}>
                          <td className="py-2 text-gray-400">{i + 1}</td>
                          <td className="py-2 font-medium">{p.name}</td>
                          <td className="py-2 text-right">{p.qty_sold}</td>
                          <td className="py-2 text-right font-semibold text-blue-600">{formatCurrency(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'inventory' && (
        <div className="space-y-4">
          <button onClick={loadLowStock} disabled={loading} className="btn-primary">
            {loading ? 'Loading...' : 'Load Low Stock Report'}
          </button>

          {lowStock.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b bg-red-50 flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium text-sm">{lowStock.length} items below reorder level</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Product', 'Barcode', 'Current Stock', 'Reorder Level', 'Unit'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lowStock.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.barcode || '—'}</td>
                      <td className="px-4 py-3 text-red-600 font-bold">{p.current_stock}</td>
                      <td className="px-4 py-3 text-gray-500">{p.reorder_level}</td>
                      <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}