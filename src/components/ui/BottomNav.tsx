import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../../contexts/StoreContext'
import { useStorePath } from '../../lib/useStorePath'

export function BottomNav() {
  const { pathname } = useLocation()
  const { cartCount } = useStore()
  const sp = useStorePath()

  const links = [
    { to: sp('/'), label: 'Shop', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
      </svg>
    )},
    { to: sp('/cart'), label: 'Cart', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
    ), badge: cartCount },
    { to: sp('/orders'), label: 'Orders', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )},
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
      {links.map(({ to, label, icon, badge }) => {
        const active = pathname === to
        return (
          <Link key={to} to={to} className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${active ? 'text-green-600' : 'text-gray-500'}`}>
            <div className="relative">
              {icon}
              {badge != null && badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-green-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                  {badge}
                </span>
              )}
            </div>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
