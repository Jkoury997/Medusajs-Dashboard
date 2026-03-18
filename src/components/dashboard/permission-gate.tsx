"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { usePermissions } from "@/providers/permissions-provider"
import { ShieldAlert } from "lucide-react"
import type { Permission } from "@/lib/permissions"

interface PermissionGateProps {
  /** Permiso requerido para ver este contenido */
  permission: Permission
  children: React.ReactNode
  /** Si es true, redirige al dashboard en vez de mostrar mensaje de acceso denegado */
  redirect?: boolean
}

/**
 * Componente que protege contenido basándose en permisos del usuario.
 * Si el usuario no tiene el permiso requerido, muestra un mensaje de acceso denegado
 * o redirige al dashboard.
 */
export function PermissionGate({
  permission,
  children,
  redirect = false,
}: PermissionGateProps) {
  const { hasPermission, isLoadingRole } = usePermissions()
  const router = useRouter()

  const allowed = hasPermission(permission)

  useEffect(() => {
    if (!isLoadingRole && !allowed && redirect) {
      router.replace("/dashboard")
    }
  }, [isLoadingRole, allowed, redirect, router])

  if (isLoadingRole) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Verificando permisos...</p>
      </div>
    )
  }

  if (!allowed) {
    if (redirect) return null
    return <AccessDenied />
  }

  return <>{children}</>
}

/**
 * Componente wrapper que protege una página automáticamente
 * basándose en la ruta actual.
 */
export function RoutePermissionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { canAccessRoute, isLoadingRole } = usePermissions()
  const router = useRouter()

  const allowed = canAccessRoute(pathname)

  useEffect(() => {
    if (!isLoadingRole && !allowed) {
      router.replace("/dashboard")
    }
  }, [isLoadingRole, allowed, router])

  if (isLoadingRole) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Verificando permisos...</p>
      </div>
    )
  }

  if (!allowed) {
    return <AccessDenied />
  }

  return <>{children}</>
}

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center p-8">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <ShieldAlert className="w-8 h-8 text-red-500" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Acceso Denegado
        </h2>
        <p className="text-gray-500 max-w-md">
          No tenés permisos para acceder a esta sección.
          Contactá a un administrador si necesitás acceso.
        </p>
      </div>
    </div>
  )
}
