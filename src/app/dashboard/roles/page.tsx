"use client"

import { useState, useEffect, useCallback } from "react"
import { usePermissions } from "@/providers/permissions-provider"
import { PermissionGate } from "@/components/dashboard/permission-gate"
import { Header } from "@/components/dashboard/header"
import {
  PERMISSIONS,
  ROLES,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  type Role,
  type Permission,
} from "@/lib/permissions"
import { Users, Shield, Check, X, Save, Loader2 } from "lucide-react"

interface UserWithRole {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: Role
}

export default function RolesPage() {
  return (
    <PermissionGate permission={PERMISSIONS.ROLES_MANAGE}>
      <RolesContent />
    </PermissionGate>
  )
}

function RolesContent() {
  const { refreshRole } = usePermissions()
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("medusa_auth_token")
      const res = await fetch("/api/admin/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      } else {
        setError("Error al cargar usuarios")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const updateRole = async (userId: string, newRole: Role) => {
    setSaving(userId)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem("medusa_auth_token")
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      })

      if (res.ok) {
        setUsers((prev: UserWithRole[]) =>
          prev.map((u: UserWithRole) => (u.id === userId ? { ...u, role: newRole } : u))
        )
        setSuccess(`Rol actualizado correctamente`)
        // Refrescar el rol propio por si se cambió
        await refreshRole()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || "Error al actualizar rol")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Header
        title="Gestión de Roles"
        description="Administrá los permisos de acceso de cada usuario al dashboard"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <Users className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Usuarios del Dashboard
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Cargando usuarios...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No se encontraron usuarios
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol Actual
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cambiar Rol
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isSaving={saving === user.id}
                    onUpdateRole={updateRole}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Roles reference */}
      <RolesReference />
    </div>
  )
}

function UserRow({
  user,
  isSaving,
  onUpdateRole,
}: {
  user: UserWithRole
  isSaving: boolean
  onUpdateRole: (userId: string, role: Role) => void
}) {
  const [selectedRole, setSelectedRole] = useState<Role>(user.role)
  const hasChanged = selectedRole !== user.role

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-mk-pink-light flex items-center justify-center">
            <span className="text-sm font-medium text-mk-pink">
              {(user.first_name?.[0] || user.email[0]).toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-gray-900">
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.email.split("@")[0]}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-mk-pink-light text-mk-pink-dark">
          <Shield className="w-3 h-3" />
          {ROLE_LABELS[user.role] || user.role}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as Role)}
            disabled={isSaving}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-mk-pink focus:border-mk-pink outline-none disabled:opacity-50"
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {hasChanged && (
            <button
              onClick={() => onUpdateRole(user.id, selectedRole)}
              disabled={isSaving}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-mk-pink hover:bg-mk-pink-dark rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Guardar
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function RolesReference() {
  const allPermissions = Object.entries(PERMISSIONS) as [string, Permission][]
  const roles = Object.entries(ROLE_LABELS) as [Role, string][]

  const permissionLabels: Record<Permission, string> = {
    "dashboard:view": "Dashboard",
    "orders:view": "Órdenes",
    "products:view": "Productos",
    "customers:view": "Clientes",
    "marketing:view": "Marketing",
    "email_marketing:view": "Email Marketing",
    "picking:view": "Picking",
    "resellers:view": "Revendedoras",
    "resellers_fisicas:view": "Revendedoras Físicas",
    "admin:view": "Administración",
    "analytics:view": "Analítica",
    "ai:view": "IA Insights",
    "roles:manage": "Gestión de Roles",
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
        <Shield className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          Referencia de Permisos por Rol
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                Permiso
              </th>
              {roles.map(([role, label]) => (
                <th
                  key={role}
                  className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allPermissions.map(([, permission]) => (
              <tr key={permission} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-sm font-medium text-gray-700 sticky left-0 bg-white">
                  {permissionLabels[permission] || permission}
                </td>
                {roles.map(([role]) => {
                  const has = ROLE_PERMISSIONS[role]?.includes(permission)
                  return (
                    <td key={role} className="px-4 py-2.5 text-center">
                      {has ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
