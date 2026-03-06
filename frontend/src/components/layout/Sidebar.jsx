import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Package, Receipt,
  BarChart2, Users, Truck, LogOut, Store,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos',        icon: ShoppingCart,    label: 'POS Checkout' },
  { to: '/products',   icon: Package,         label: 'Products' },
  { to: '/sales',      icon: Receipt,         label: 'Sales History' },
  { to: '/purchases',  icon: Truck,           label: 'Purchase Orders' },
  { to: '/reports',    icon: BarChart2,       label: 'Reports' },
  { to: '/users',      icon: Users,           label: 'Users',  adminOnly: true },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || ['admin', 'manager'].includes(user?.role)
  )

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-blue-800">
        <Store className="w-7 h-7 text-blue-300" />
        <div>
          <p className="font-bold text-lg leading-tight">POS System</p>
          <p className="text-blue-400 text-xs capitalize">{user?.role}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-blue-800">
        <p className="text-sm text-blue-200 truncate mb-3">{user?.full_name}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-blue-300 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  )
}