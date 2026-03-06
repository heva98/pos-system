import { useEffect, useState } from 'react'
import { ShoppingCart, TrendingUp, Package, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { dashboardAPI, reportsAPI } from '../../services/api'
import { StatCard, PageLoader, PageHeader } from '../../components/ui'
import { formatCurrency, today } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const [stats, setStats]       = useState(null)
  const [topProducts, setTop]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, topRes] = await Promise.all([
          dashboardAPI.summary(),
          reportsAPI.topProducts({ from_date: today(), to_date: today(), limit: 5 }),
        ])
        setStats(dashRes.data)
        setTop(topRes.data)
      } catch {
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" subtitle={`Today — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Today's Transactions"
          value={stats?.today?.transactions ?? 0}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats?.today?.revenue)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.this_month?.revenue)}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.inventory?.low_stock_items ?? 0}
          icon={AlertTriangle}
          color={stats?.inventory?.low_stock_items > 0 ? 'red' : 'green'}
          subtitle={`${stats?.inventory?.total_products} total products`}
        />
      </div>

      {/* Top Products Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Top Products Today</h2>
        {topProducts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">No sales today yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProducts} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}