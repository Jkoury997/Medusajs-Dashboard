"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { useAuth } from "@/providers/auth-provider"
import {
  type Role,
  type Permission,
  ROLES,
  ROLE_PERMISSIONS,
  SIDEBAR_PERMISSIONS,
  getRequiredPermission,
} from "@/lib/permissions"

interface PermissionsContextType {
  /** Rol actual del usuario */
  role: Role
  /** True mientras se carga el rol desde el backend */
  isLoadingRole: boolean
  /** Verifica si el usuario tiene un permiso específico */
  hasPermission: (permission: Permission) => boolean
  /** Verifica si el usuario puede ver una sección del sidebar por su label */
  canViewSection: (sectionLabel: string) => boolean
  /** Verifica si el usuario puede acceder a una ruta */
  canAccessRoute: (pathname: string) => boolean
  /** Refresca el rol desde el backend */
  refreshRole: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType | null>(null)

const ROLE_STORAGE_KEY = "dashboard_user_role"

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth()
  const [role, setRole] = useState<Role>(ROLES.VIEWER)
  const [isLoadingRole, setIsLoadingRole] = useState(true)

  const fetchRole = useCallback(async () => {
    // Esperar a que AuthProvider termine de inicializar antes de decidir.
    // Si resolvemos acá con isAuthenticated=false (valor inicial), RoutePermissionGate
    // verá role=VIEWER + isLoadingRole=false y redirigirá al /dashboard cualquier
    // ruta que requiera permisos antes de que auth confirme la sesión real.
    if (isLoadingAuth) return

    if (!isAuthenticated) {
      setRole(ROLES.VIEWER)
      setIsLoadingRole(false)
      return
    }

    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("medusa_auth_token")
        : null
      const res = await fetch("/api/user/role", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        const userRole = data.role as Role
        if (userRole && ROLE_PERMISSIONS[userRole]) {
          setRole(userRole)
          try {
            localStorage.setItem(ROLE_STORAGE_KEY, userRole)
          } catch { /* SSR / incognito */ }
        }
      }
    } catch {
      // Si falla la API, intentar usar el rol cacheado
      try {
        const cached = localStorage.getItem(ROLE_STORAGE_KEY) as Role | null
        if (cached && ROLE_PERMISSIONS[cached]) {
          setRole(cached)
        }
      } catch { /* SSR / incognito */ }
    } finally {
      setIsLoadingRole(false)
    }
  }, [isAuthenticated, isLoadingAuth])

  useEffect(() => {
    fetchRole()
  }, [fetchRole])

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
    },
    [role]
  )

  const canViewSection = useCallback(
    (sectionLabel: string): boolean => {
      const permission = SIDEBAR_PERMISSIONS[sectionLabel]
      // Si no hay permiso mapeado, se muestra siempre
      if (!permission) return true
      return hasPermission(permission)
    },
    [hasPermission]
  )

  const canAccessRoute = useCallback(
    (pathname: string): boolean => {
      const required = getRequiredPermission(pathname)
      // Si no requiere permiso, acceso libre
      if (!required) return true
      return hasPermission(required)
    },
    [hasPermission]
  )

  return (
    <PermissionsContext.Provider
      value={{
        role,
        isLoadingRole,
        hasPermission,
        canViewSection,
        canAccessRoute,
        refreshRole: fetchRole,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider")
  }
  return context
}
