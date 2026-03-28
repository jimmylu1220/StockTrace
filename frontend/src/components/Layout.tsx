import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Globe, Star, LineChart, BookOpen, BarChart2, Network, Newspaper } from 'lucide-react'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: '總覽' },
  { to: '/tw-stocks', icon: TrendingUp,      label: '台股 AI/科技' },
  { to: '/industry',  icon: Network,         label: '產業版圖' },
  { to: '/us-stocks', icon: Globe,           label: '美股' },
  { to: '/potential', icon: Star,            label: '潛力股' },
  { to: '/signals',   icon: LineChart,       label: '統計買入信號' },
  { to: '/news',      icon: Newspaper,       label: '財經新聞' },
  { to: '/education', icon: BookOpen,        label: '投資學堂' },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-400" />
            <span className="text-lg font-bold text-white">StockTrace</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">台美股趨勢追蹤</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-600 text-center">資料來自 Yahoo Finance</p>
          <p className="text-xs text-gray-600 text-center mt-1">僅供參考，不構成投資建議</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-950">
        <Outlet />
      </main>
    </div>
  )
}
