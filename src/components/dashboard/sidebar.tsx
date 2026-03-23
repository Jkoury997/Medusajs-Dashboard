"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"
import { usePermissions } from "@/providers/permissions-provider"
import { useAdminPendingCounts } from "@/hooks/use-admin-counts"
import { PERMISSIONS } from "@/lib/permissions"
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
  ClipboardCheck,
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
  Rocket,
  BookUser,
  Filter,
  Trophy,
  ShieldCheck,
  CreditCard,
  MapPin,
  Store,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// ============================================================
// NAVIGATION STRUCTURE
// ============================================================

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

type NavGroup = {
  label: string
  icon: LucideIcon
  children: NavItem[]
  badge?: number
}

type NavEntry = NavItem | NavGroup

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry
}

/**
 * Determina si un href está activo para el pathname actual.
 * Usa exact match para "/dashboard" y boundary match (/ o fin) para el resto,
 * evitando que "/dashboard/resellers" matchee con "/dashboard/resellers-fisicas".
 */
function isHrefActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard"
  if (pathname === href) return true
  // Solo matchear si el pathname continúa con "/" después del href
  return pathname.startsWith(href + "/")
}

const staticNavEntries: NavEntry[] = [
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
      { href: "/dashboard/products/ranking", label: "Ranking", icon: Trophy },
      { href: "/dashboard/products/decisiones", label: "Decisiones Inventario", icon: ClipboardCheck },
      { href: "/dashboard/products/ai-pending", label: "Descripciones IA", icon: Bot },
    ],
  },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/marketing", label: "Marketing", icon: TrendingUp },
  {
    label: "Email Marketing",
    icon: Mail,
    children: [
      { href: "/dashboard/carritos-abandonados", label: "Carritos Abandonados", icon: ShoppingCart },
      { href: "/dashboard/campaigns", label: "Campañas", icon: Megaphone },
      { href: "/dashboard/email-marketing/campanas-ai", label: "Campañas AI", icon: Bot },
      { href: "/dashboard/contacts", label: "Contactos", icon: BookUser },
      { href: "/dashboard/segments", label: "Segmentos", icon: Filter },
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
      { href: "/dashboard/product-boosts", label: "Boosts", icon: Rocket },
      { href: "/dashboard/resellers/config", label: "Configuración", icon: Settings },
    ],
  },
  {
    label: "Revendedoras Físicas",
    icon: Store,
    children: [
      { href: "/dashboard/resellers-fisicas", label: "Resumen", icon: BarChart3 },
      { href: "/dashboard/resellers-fisicas/lista", label: "Lista", icon: Users },
      { href: "/dashboard/resellers-fisicas/pedidos", label: "Pedidos", icon: Package },
      { href: "/dashboard/resellers-fisicas/ventas", label: "Ventas", icon: ShoppingCart },
      { href: "/dashboard/resellers-fisicas/mapa", label: "Mapa", icon: MapPin },
    ],
  },
  // ← Administración se inserta dinámicamente aquí
  { href: "/dashboard/analytics", label: "Analítica", icon: Satellite },
  { href: "/dashboard/ai", label: "IA Insights", icon: Bot },
]

// ============================================================
// BADGE PILL
// ============================================================

function BadgePill({ count, size = "sm" }: { count: number; size?: "sm" | "xs" }) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        "bg-mk-pink text-white font-bold rounded-full text-center leading-none",
        size === "sm"
          ? "text-[10px] px-1.5 py-0.5 min-w-[18px]"
          : "text-[9px] px-1 py-0.5 min-w-[16px]"
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  )
}

/** Dot indicator for badges when sidebar is collapsed */
function BadgeDot({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-mk-pink rounded-full border-2 border-white" />
  )
}

// ============================================================
// LOCAL STORAGE
// ============================================================

const COLLAPSED_KEY = "sidebar-collapsed"

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1"
  } catch {
    return false
  }
}

function writeCollapsed(v: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, v ? "1" : "0")
  } catch {
    /* SSR / incognito */
  }
}

// ============================================================
// SIDEBAR COMPONENT
// ============================================================

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { canViewSection, hasPermission } = usePermissions()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const { data: adminCounts } = useAdminPendingCounts()

  // Restore collapsed state from localStorage
  useEffect(() => {
    setCollapsed(readCollapsed())
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      writeCollapsed(next)
      return next
    })
  }, [])

  // Build nav entries with dynamic Administración group
  const navEntries = useMemo(() => {
    const adminGroup: NavGroup = {
      label: "Administración",
      icon: ShieldCheck,
      badge: adminCounts?.total || undefined,
      children: [
        {
          href: "/dashboard/administracion/pagos",
          label: "Pagos Pendientes",
          icon: CreditCard,
          badge: adminCounts?.authorizedOrders || undefined,
        },
        {
          href: "/dashboard/administracion/documentos",
          label: "Documentos",
          icon: FileCheck,
          badge: adminCounts?.pendingDocuments || undefined,
        },
        {
          href: "/dashboard/administracion/retiros",
          label: "Retiros",
          icon: Wallet,
          badge: adminCounts?.pendingWithdrawals || undefined,
        },
      ],
    }

    // Insertar Administración después de Revendedoras Físicas
    const revendedorasFisicasIndex = staticNavEntries.findIndex(
      (e) => isNavGroup(e) && e.label === "Revendedoras Físicas"
    )
    const insertAt = revendedorasFisicasIndex >= 0 ? revendedorasFisicasIndex + 1 : staticNavEntries.length - 2

    const allEntries: NavEntry[] = [
      ...staticNavEntries.slice(0, insertAt),
      adminGroup,
      ...staticNavEntries.slice(insertAt),
    ]

    // Agregar link a gestión de roles si tiene permiso
    if (hasPermission(PERMISSIONS.ROLES_MANAGE)) {
      allEntries.push({
        href: "/dashboard/roles",
        label: "Gestión de Roles",
        icon: KeyRound,
      })
    }

    // Filtrar por permisos del usuario
    return allEntries.filter((entry) => canViewSection(isNavGroup(entry) ? entry.label : entry.label))
  }, [adminCounts, canViewSection, hasPermission])

  // Auto-expand groups whose children match the current route
  useEffect(() => {
    for (const entry of navEntries) {
      if (isNavGroup(entry)) {
        const hasActiveChild = entry.children.some((child) =>
          isHrefActive(child.href, pathname)
        )
        if (hasActiveChild) {
          setOpenGroups((prev) => ({ ...prev, [entry.label]: true }))
        }
      }
    }
  }, [pathname, navEntries])

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out shrink-0",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Brand header */}
      <div
        className={cn(
          "border-b border-mk-pink-border shrink-0 flex items-center",
          collapsed ? "px-3 py-4 justify-center" : "p-6 justify-between"
        )}
      >
        <div className={cn("overflow-hidden", collapsed && "flex justify-center")}>
          {collapsed ? (
            <span className="text-lg font-bold text-mk-pink">MK</span>
          ) : (
            <>
              <h1 className="text-lg font-bold text-mk-pink whitespace-nowrap">Marcela Koury</h1>
              <p className="text-sm text-gray-500 whitespace-nowrap">Dashboard de Ventas</p>
            </>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Minimizar sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center py-2 shrink-0">
          <button
            onClick={toggleCollapsed}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Expandir sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 space-y-1 overflow-y-auto overflow-x-hidden",
          collapsed ? "px-2 py-2" : "p-4"
        )}
      >
        {navEntries.map((entry) => {
          if (isNavGroup(entry)) {
            return collapsed ? (
              <CollapsedNavGroup
                key={entry.label}
                group={entry}
                pathname={pathname}
              />
            ) : (
              <NavGroupItem
                key={entry.label}
                group={entry}
                isOpen={openGroups[entry.label] ?? false}
                onToggle={() => toggleGroup(entry.label)}
                pathname={pathname}
              />
            )
          }

          return collapsed ? (
            <CollapsedNavLink
              key={entry.href}
              item={entry}
              pathname={pathname}
            />
          ) : (
            <NavLink
              key={entry.href}
              item={entry}
              pathname={pathname}
            />
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-gray-200 shrink-0">
        {collapsed ? (
          <button
            onClick={logout}
            className="relative group flex items-center justify-center w-full p-2 rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
              Cerrar sesión
            </div>
          </button>
        ) : (
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        )}
      </div>
    </aside>
  )
}

// ============================================================
// EXPANDED SUB-COMPONENTS
// ============================================================

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = isHrefActive(item.href, pathname)

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
      <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-mk-pink")} />
      <span className="truncate">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="ml-auto">
          <BadgePill count={item.badge} />
        </span>
      )}
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
        <div className="flex items-center gap-1.5">
          {group.badge != null && group.badge > 0 && (
            <BadgePill count={group.badge} />
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Children with smooth expand/collapse */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-3">
          {group.children.map((child) => {
            const active = isHrefActive(child.href, pathname)
            const ChildIcon = child.icon

            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  active
                    ? "bg-mk-pink-light text-mk-pink-dark font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <ChildIcon className={cn("w-3.5 h-3.5 shrink-0", active && "text-mk-pink")} />
                <span className="truncate">{child.label}</span>
                {child.badge != null && child.badge > 0 && (
                  <span className="ml-auto">
                    <BadgePill count={child.badge} size="xs" />
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COLLAPSED SUB-COMPONENTS (icon-only with flyout menus)
// ============================================================

function CollapsedNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = isHrefActive(item.href, pathname)

  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        "relative group flex items-center justify-center w-full p-2 rounded-md transition-colors",
        isActive
          ? "bg-mk-pink-light text-mk-pink"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      )}
      title={item.label}
    >
      <Icon className="w-5 h-5" />
      {item.badge != null && item.badge > 0 && <BadgeDot count={item.badge} />}

      {/* Tooltip */}
      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
        {item.label}
        {item.badge != null && item.badge > 0 && (
          <span className="ml-1.5 bg-mk-pink text-white text-[10px] px-1 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </div>
    </Link>
  )
}

function CollapsedNavGroup({
  group,
  pathname,
}: {
  group: NavGroup
  pathname: string
}) {
  const hasActiveChild = group.children.some((child) =>
    child.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(child.href)
  )

  const Icon = group.icon

  return (
    <div className="relative group">
      {/* Icon button */}
      <button
        className={cn(
          "relative flex items-center justify-center w-full p-2 rounded-md transition-colors",
          hasActiveChild
            ? "bg-mk-pink-light text-mk-pink"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <Icon className="w-5 h-5" />
        {group.badge != null && group.badge > 0 && <BadgeDot count={group.badge} />}
      </button>

      {/* Flyout menu on hover */}
      <div className="absolute left-full top-0 ml-2 py-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
        {/* Group header */}
        <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1 flex items-center gap-2">
          {group.label}
          {group.badge != null && group.badge > 0 && (
            <BadgePill count={group.badge} size="xs" />
          )}
        </div>

        {/* Children */}
        {group.children.map((child) => {
          const active = isHrefActive(child.href, pathname)
          const ChildIcon = child.icon

          return (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors mx-1 rounded-md",
                active
                  ? "bg-mk-pink-light text-mk-pink-dark font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <ChildIcon className={cn("w-3.5 h-3.5 shrink-0", active && "text-mk-pink")} />
              <span className="truncate">{child.label}</span>
              {child.badge != null && child.badge > 0 && (
                <span className="ml-auto">
                  <BadgePill count={child.badge} size="xs" />
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
