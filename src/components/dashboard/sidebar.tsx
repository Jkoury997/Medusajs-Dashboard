"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  TrendingUp,
  Mail,
  Megaphone,
  Palette,
  BarChart3,
  Settings,
  Bot,
  Satellite,
  PackageCheck,
  ClipboardList,
  Boxes,
  LogOut,
  ChevronDown,
  PackageX,
  Layers,
  DollarSign,
  ShoppingCart,
  UserCheck,
  Wallet,
  ShieldAlert,
  Ticket,
  KeyRound,
  FileCheck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// ============================================================
// NAVIGATION STRUCTURE
// ============================================================

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

type NavGroup = {
  label: string
  icon: LucideIcon
  children: NavItem[]
}

type NavEntry = NavItem | NavGroup

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry
}

const navEntries: NavEntry[] = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Órdenes", icon: Package },
  {
    label: "Productos",
    icon: Tag,
    children: [
      { href: "/dashboard/products/sin-stock", label: "Sin Stock", icon: PackageX },
      { href: "/dashboard/products/variantes-sin-stock", label: "Variantes sin Stock", icon: Layers },
      { href: "/dashboard/products/facturacion", label: "Facturación", icon: DollarSign },
      { href: "/dashboard/products/unidades", label: "Unidades Compradas", icon: ShoppingCart },
      { href: "/dashboard/products/promedio", label: "Promedio por Compra", icon: BarChart3 },
    ],
  },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/marketing", label: "Marketing", icon: TrendingUp },
  {
    label: "Email Marketing",
    icon: Mail,
    children: [
      { href: "/dashboard/campaigns", label: "Campañas", icon: Megaphone },
      { href: "/dashboard/templates", label: "Plantillas", icon: Palette },
      { href: "/dashboard/email-stats", label: "Estadísticas", icon: BarChart3 },
      { href: "/dashboard/email-marketing", label: "Configuración", icon: Settings },
    ],
  },
  {
    label: "Picking",
    icon: PackageCheck,
    children: [
      { href: "/dashboard/picking", label: "Estadísticas", icon: BarChart3 },
      { href: "/dashboard/picking/audit", label: "Auditoría", icon: ClipboardList },
      { href: "/dashboard/picking/users", label: "Usuarios", icon: Users },
      { href: "/dashboard/picking/gestion", label: "Gestión", icon: Boxes },
    ],
  },
  {
    label: "Revendedoras",
    icon: UserCheck,
    children: [
      { href: "/dashboard/resellers", label: "Resumen", icon: BarChart3 },
      { href: "/dashboard/resellers/lista", label: "Lista", icon: Users },
      { href: "/dashboard/resellers/retiros", label: "Retiros", icon: Wallet },
      { href: "/dashboard/resellers/alertas", label: "Alertas de Fraude", icon: ShieldAlert },
      { href: "/dashboard/resellers/vouchers", label: "Vouchers", icon: Ticket },
      { href: "/dashboard/resellers/documentos", label: "Documentos", icon: FileCheck },
      { href: "/dashboard/resellers/invitaciones", label: "Invitaciones", icon: KeyRound },
      { href: "/dashboard/resellers/config", label: "Configuración", icon: Settings },
    ],
  },
  { href: "/dashboard/analytics", label: "Analítica", icon: Satellite },
  { href: "/dashboard/ai", label: "IA Insights", icon: Bot },
]

// ============================================================
// SIDEBAR COMPONENT
// ============================================================

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  // Auto-expand groups whose children match the current route
  useEffect(() => {
    for (const entry of navEntries) {
      if (isNavGroup(entry)) {
        const hasActiveChild = entry.children.some((child) =>
          child.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(child.href)
        )
        if (hasActiveChild) {
          setOpenGroups((prev) => ({ ...prev, [entry.label]: true }))
        }
      }
    }
  }, [pathname])

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      {/* Brand header */}
      <div className="p-6 border-b border-mk-pink-border shrink-0">
        <h1 className="text-lg font-bold text-mk-pink">Marcela Koury</h1>
        <p className="text-sm text-gray-500">Dashboard de Ventas</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navEntries.map((entry) => {
          if (isNavGroup(entry)) {
            return (
              <NavGroupItem
                key={entry.label}
                group={entry}
                isOpen={openGroups[entry.label] ?? false}
                onToggle={() => toggleGroup(entry.label)}
                pathname={pathname}
              />
            )
          }

          return (
            <NavLink
              key={entry.href}
              item={entry}
              pathname={pathname}
            />
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)

  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-mk-pink-light text-mk-pink-dark"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <Icon className={cn("w-4 h-4", isActive && "text-mk-pink")} />
      {item.label}
    </Link>
  )
}

function NavGroupItem({
  group,
  isOpen,
  onToggle,
  pathname,
}: {
  group: NavGroup
  isOpen: boolean
  onToggle: () => void
  pathname: string
}) {
  const hasActiveChild = group.children.some((child) =>
    child.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(child.href)
  )

  const Icon = group.icon

  return (
    <div>
      {/* Parent toggle button */}
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
          hasActiveChild
            ? "bg-mk-pink-light text-mk-pink-dark"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("w-4 h-4", hasActiveChild && "text-mk-pink")} />
          {group.label}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Children with smooth expand/collapse */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-3">
          {group.children.map((child) => {
            const isActive = pathname.startsWith(child.href)
            const ChildIcon = child.icon

            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-mk-pink-light text-mk-pink-dark font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <ChildIcon className={cn("w-3.5 h-3.5", isActive && "text-mk-pink")} />
                {child.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
