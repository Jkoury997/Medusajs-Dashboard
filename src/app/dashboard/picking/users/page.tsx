"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/format"
import {
  usePickingUsers,
  usePickingUserDetail,
  useCreatePickingUser,
  useUpdatePickingUser,
  useDeletePickingUser,
  usePickingStores,
} from "@/hooks/use-picking"
import type { PickingUser, PickingUserRole } from "@/types/picking"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<PickingUserRole, string> = {
  picker: "Picker",
  store: "Tienda",
  admin: "Admin",
}

function roleBadge(role: PickingUserRole) {
  const styles: Record<PickingUserRole, string> = {
    picker: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    store: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    admin: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  }
  return (
    <Badge variant="secondary" className={styles[role]}>
      {ROLE_LABELS[role]}
    </Badge>
  )
}

function statusBadge(active: boolean) {
  return active ? (
    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
      Activo
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
      Inactivo
    </Badge>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PickingUsersPage() {
  // ---- filter state ----
  const [showInactive, setShowInactive] = useState(false)

  // ---- editor dialog state ----
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<PickingUser | null>(null)

  // ---- form fields ----
  const [formName, setFormName] = useState("")
  const [formPin, setFormPin] = useState("")
  const [formRole, setFormRole] = useState<PickingUserRole>("picker")
  const [formStoreId, setFormStoreId] = useState("")
  const [formActive, setFormActive] = useState(true)

  // ---- stats dialog ----
  const [statsUserId, setStatsUserId] = useState<string | null>(null)

  // ---- delete confirm ----
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // ---- error display ----
  const [mutationError, setMutationError] = useState<string | null>(null)

  // ---- queries ----
  const { data: users, isLoading: usersLoading } = usePickingUsers(showInactive)
  const { data: userDetail, isLoading: detailLoading } = usePickingUserDetail(statsUserId)
  const { data: stores } = usePickingStores()

  // ---- mutations ----
  const createUser = useCreatePickingUser()
  const updateUser = useUpdatePickingUser()
  const deleteUser = useDeletePickingUser()

  // ---- editor helpers ----
  function openNewUser() {
    setEditingUser(null)
    setFormName("")
    setFormPin("")
    setFormRole("picker")
    setFormStoreId("")
    setFormActive(true)
    setMutationError(null)
    setEditorOpen(true)
  }

  function openEditUser(user: PickingUser) {
    setEditingUser(user)
    setFormName(user.name)
    setFormPin(user.pin ?? "")
    setFormRole(user.role)
    setFormStoreId(user.store_id ?? "")
    setFormActive(user.active)
    setMutationError(null)
    setEditorOpen(true)
  }

  async function handleSave() {
    setMutationError(null)
    try {
      const storeName = stores?.find((s) => s._id === formStoreId)?.name
      if (editingUser) {
        await updateUser.mutateAsync({
          id: editingUser._id,
          data: {
            name: formName,
            pin: formPin,
            role: formRole,
            active: formActive,
            storeId: formRole === "store" ? formStoreId || undefined : undefined,
            storeName: formRole === "store" ? storeName : undefined,
          },
        })
      } else {
        await createUser.mutateAsync({
          name: formName,
          pin: formPin,
          role: formRole,
          storeId: formRole === "store" ? formStoreId || undefined : undefined,
          storeName: formRole === "store" ? storeName : undefined,
        })
      }
      setEditorOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido"
      setMutationError(message)
    }
  }

  async function handleToggleActive(user: PickingUser) {
    setMutationError(null)
    try {
      await updateUser.mutateAsync({
        id: user._id,
        data: { active: !user.active },
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido"
      setMutationError(message)
    }
  }

  async function handleDelete(id: string) {
    setMutationError(null)
    try {
      await deleteUser.mutateAsync(id)
      setDeleteConfirmId(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido"
      setMutationError(message)
    }
  }

  // ---- derived ----
  const totalUsers = users?.length ?? 0

  return (
    <div className="flex flex-col h-full">
      <Header title="Usuarios de Picking" description="Gestion de pickers y administradores" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* ---- Mutation error banner ---- */}
        {mutationError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {mutationError}
            <button
              className="ml-3 font-medium underline"
              onClick={() => setMutationError(null)}
            >
              Cerrar
            </button>
          </div>
        )}

        {/* ---- Top bar ---- */}
        <div className="flex items-center justify-between">
          <div>
            {usersLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <Badge variant="secondary" className="text-sm">
                {formatNumber(totalUsers)} usuario{totalUsers !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive" className="text-sm cursor-pointer">
                Mostrar inactivos
              </Label>
            </div>
            <Button onClick={openNewUser}>Nuevo Usuario</Button>
          </div>
        </div>

        {/* ---- Users table ---- */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : !users || users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{roleBadge(user.role)}</TableCell>
                      <TableCell className="text-gray-500">
                        {user.store_name ?? "-"}
                      </TableCell>
                      <TableCell>{statusBadge(user.active)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              ...
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setStatsUserId(user._id)}>
                              Ver estadisticas
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditUser(user)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                              {user.active ? "Desactivar" : "Activar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeleteConfirmId(user._id)}
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================ */}
      {/* Dialog 1 — Create / Edit user                                    */}
      {/* ================================================================ */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="user-name">Nombre</Label>
              <Input
                id="user-name"
                placeholder="Nombre del usuario"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            {/* PIN */}
            <div className="space-y-2">
              <Label htmlFor="user-pin">PIN</Label>
              <Input
                id="user-pin"
                type="password"
                placeholder="PIN de acceso"
                value={formPin}
                onChange={(e) => setFormPin(e.target.value)}
                required
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={formRole}
                onValueChange={(v) => setFormRole(v as PickingUserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="picker">Picker</SelectItem>
                  <SelectItem value="store">Tienda</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Store — only for role "store" */}
            {formRole === "store" && (
              <div className="space-y-2">
                <Label>Tienda</Label>
                <Select value={formStoreId} onValueChange={setFormStoreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tienda" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores?.map((store) => (
                      <SelectItem key={store._id} value={store._id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Active switch — only when editing */}
            {editingUser && (
              <div className="flex items-center gap-3">
                <Switch
                  id="user-active"
                  checked={formActive}
                  onCheckedChange={setFormActive}
                />
                <Label htmlFor="user-active" className="cursor-pointer">
                  Activo
                </Label>
              </div>
            )}

            {/* Inline error */}
            {(createUser.isError || updateUser.isError) && (
              <p className="text-sm text-red-600">
                {createUser.error?.message || updateUser.error?.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !formName.trim() ||
                !formPin.trim() ||
                createUser.isPending ||
                updateUser.isPending
              }
            >
              {createUser.isPending || updateUser.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* Dialog 2 — User Stats                                            */}
      {/* ================================================================ */}
      <Dialog
        open={statsUserId !== null}
        onOpenChange={(open) => {
          if (!open) setStatsUserId(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Estadisticas de {userDetail?.name ?? "usuario"}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="grid grid-cols-2 gap-4 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : userDetail?.stats ? (
            <div className="grid grid-cols-2 gap-4 py-4">
              <MetricCard
                title="Pedidos pickeados"
                value={formatNumber(userDetail.stats.orders_picked)}
              />
              <MetricCard
                title="Tiempo promedio"
                value={formatTime(userDetail.stats.avg_pick_time_seconds)}
              />
              <MetricCard
                title="Items pickeados"
                value={formatNumber(userDetail.stats.items_picked)}
              />
              <MetricCard
                title="Faltantes"
                value={formatNumber(userDetail.stats.faltantes)}
              />
            </div>
          ) : (
            <p className="text-gray-500 text-sm py-4 text-center">
              No hay estadisticas disponibles para este usuario.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* Dialog 3 — Delete confirm                                        */}
      {/* ================================================================ */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar eliminacion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Esta accion no se puede deshacer. El usuario sera eliminado permanentemente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteUser.isPending}
              onClick={() => {
                if (deleteConfirmId) handleDelete(deleteConfirmId)
              }}
            >
              {deleteUser.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
