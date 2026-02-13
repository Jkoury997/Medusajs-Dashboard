"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"

const navItems = [
  { href: "/dashboard", label: "Resumen", icon: "📊" },
  { href: "/dashboard/orders", label: "Órdenes", icon: "📦" },
  { href: "/dashboard/products", label: "Productos", icon: "🏷️" },
  { href: "/dashboard/customers", label: "Clientes", icon: "👥" },
  { href: "/dashboard/marketing", label: "Marketing", icon: "📈" },
  { href: "/dashboard/analytics", label: "Analítica", icon: "📡" },
  { href: "/dashboard/ai", label: "IA Insights", icon: "🤖" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-mk-pink-border">
        <h1 className="text-lg font-bold text-mk-pink">Marcela Koury</h1>
        <p className="text-sm text-gray-500">Dashboard de Ventas</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-mk-pink-light text-mk-pink-dark border-l-2 border-mk-pink"
                  : "text-gray-600 hover:bg-mk-pink-light hover:text-mk-pink-dark"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-gray-600 hover:bg-mk-pink-light hover:text-mk-pink-dark transition-colors"
        >
          <span>🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
