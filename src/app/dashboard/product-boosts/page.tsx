"use client"

import { useState } from "react"
import {
  useProductBoosts,
  useProductBoostStats,
  useDetectStagnant,
  useCreateProductBoost,
  useUpdateProductBoost,
  useDeleteProductBoost,
} from "@/hooks/use-product-boosts"
import type { ProductBoost, ProductBoostReason } from "@/types/reseller"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Rocket,
  TrendingUp,
  TrendingDown,
  Zap,
  Hand,
  Search,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  X,
  Power,
  AlertCircle,
} from "lucide-react"

// ============================================================
// HELPERS
// ============================================================

type FilterTab = "all" | "active" | "inactive" | "stagnant" | "manual"

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}

const reasonLabels: Record<ProductBoostReason, string> = {
  stagnant: "Estancado",
  manual: "Manual",
}

const reasonColors: Record<ProductBoostReason, string> = {
  stagnant: "bg-orange-100 text-orange-700",
  manual: "bg-blue-100 text-blue-700",
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ProductBoostsPage() {
  const [tab, setTab] = useState<FilterTab>("all")
  const [page, setPage] = useState(1)
  const [editBoost, setEditBoost] = useState<ProductBoost | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filters = {
    ...(tab === "active" && { is_active: true }),
    ...(tab === "inactive" && { is_active: false }),
    ...(tab === "stagnant" && { is_active: true, reason: "stagnant" as const }),
    ...(tab === "manual" && { is_active: true, reason: "manual" as const }),
    page,
    limit: 25,
  }

  const { data: statsData, isLoading: loadingStats } = useProductBoostStats()
  const { data: listData, isLoading: loadingList } = useProductBoosts(filters)
  const detectMutation = useDetectStagnant()
  const deleteMutation = useDeleteProductBoost()

  const boosts = listData?.product_boosts ?? []
  const totalCount = listData?.count ?? 0
  const totalPages = Math.ceil(totalCount / 25) || 1

  const handleDetect = () => detectMutation.mutate()

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, { onSuccess: () => setDeleteId(null) })
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Activos" },
    { key: "inactive", label: "Inactivos" },
    { key: "stagnant", label: "Estancados" },
    { key: "manual", label: "Manuales" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Boosts</h1>
          <p className="text-sm text-gray-500">
            Gestión de bonus de comisión para productos estancados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDetect}
            disabled={detectMutation.isPending}
          >
            {detectMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Detectar Estancados
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Boost
          </Button>
        </div>
      </div>

      {/* Detection result */}
      {detectMutation.isSuccess && detectMutation.data && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-3 text-sm text-green-800">
            Detección completada: {detectMutation.data.created ?? 0} nuevos
            boosts creados, {detectMutation.data.already_boosted ?? 0} ya
            tenían boost.
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {loadingStats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded mb-2" />
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : statsData ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total"
            value={statsData.total}
            icon={<Rocket className="w-5 h-5 text-gray-500" />}
          />
          <StatCard
            label="Activos"
            value={statsData.total_active}
            icon={<Zap className="w-5 h-5 text-green-500" />}
          />
          <StatCard
            label="Estancados"
            value={statsData.active_stagnant}
            icon={<TrendingDown className="w-5 h-5 text-orange-500" />}
          />
          <StatCard
            label="Manuales"
            value={statsData.active_manual}
            icon={<Hand className="w-5 h-5 text-blue-500" />}
          />
          <StatCard
            label="Inactivos"
            value={statsData.inactive}
            icon={<Power className="w-5 h-5 text-gray-400" />}
          />
          <StatCard
            label="Bonus Promedio"
            value={`${statsData.avg_bonus_percentage.toFixed(1)}%`}
            icon={<TrendingUp className="w-5 h-5 text-mk-pink" />}
          />
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key)
              setPage(1)
            }}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              tab === t.key
                ? "bg-white border border-b-white border-gray-200 text-mk-pink -mb-px"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14" />
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Bonus %</TableHead>
                <TableHead className="text-center">Motivo</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Última Venta</TableHead>
                <TableHead className="text-center">Ventas 30d</TableHead>
                <TableHead className="text-center">Expira</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : boosts.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-gray-500">
                        No se encontraron boosts
                      </TableCell>
                    </TableRow>
                  )
                  : boosts.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        {b.thumbnail ? (
                          <img
                            src={b.thumbnail}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                            <Rocket className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {b.product_title}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-mk-pink">
                        +{b.bonus_percentage}%
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${reasonColors[b.reason]}`}
                        >
                          {reasonLabels[b.reason]}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            b.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {b.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600">
                        {formatDate(b.last_sale_at)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {b.total_sales_30d}
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600">
                        {formatDate(b.expires_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setEditBoost(b)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(b.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Página {page} de {totalPages} ({totalCount} resultados)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editBoost && (
        <EditBoostModal
          boost={editBoost}
          onClose={() => setEditBoost(null)}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateBoostModal onClose={() => setShowCreate(false)} />
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Confirmar eliminación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                ¿Estás seguro de que querés eliminar este boost? Esta acción
                no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteId(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => handleDelete(deleteId)}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// EDIT MODAL
// ============================================================

function EditBoostModal({
  boost,
  onClose,
}: {
  boost: ProductBoost
  onClose: () => void
}) {
  const mutation = useUpdateProductBoost()
  const [bonus, setBonus] = useState(String(boost.bonus_percentage))
  const [active, setActive] = useState(boost.is_active)
  const [expiresAt, setExpiresAt] = useState(
    boost.expires_at ? boost.expires_at.slice(0, 10) : ""
  )

  const handleSave = () => {
    mutation.mutate(
      {
        id: boost.id,
        data: {
          bonus_percentage: Number(bonus),
          is_active: active,
          expires_at: expiresAt || null,
        },
      },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Editar Boost</CardTitle>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              {boost.product_title}
            </p>
            <p className="text-xs text-gray-400">ID: {boost.product_id}</p>
          </div>

          <div className="space-y-1">
            <Label>Bonus %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Label>Activo</Label>
            <button
              onClick={() => setActive(!active)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                active ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  active ? "translate-x-4" : ""
                }`}
              />
            </button>
          </div>

          <div className="space-y-1">
            <Label>Fecha de expiración</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-gray-400">Dejar vacío para sin expiración</p>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600">
              {(mutation.error as Error).message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// CREATE MODAL
// ============================================================

function CreateBoostModal({ onClose }: { onClose: () => void }) {
  const mutation = useCreateProductBoost()
  const [productId, setProductId] = useState("")
  const [productTitle, setProductTitle] = useState("")
  const [productHandle, setProductHandle] = useState("")
  const [thumbnail, setThumbnail] = useState("")
  const [bonus, setBonus] = useState("5")

  const handleCreate = () => {
    if (!productId || !productTitle || !productHandle) return
    mutation.mutate(
      {
        product_id: productId,
        product_title: productTitle,
        product_handle: productHandle,
        thumbnail: thumbnail || null,
        bonus_percentage: Number(bonus),
      },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Crear Boost Manual</CardTitle>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Product ID *</Label>
            <Input
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="prod_01J..."
            />
          </div>

          <div className="space-y-1">
            <Label>Título del Producto *</Label>
            <Input
              value={productTitle}
              onChange={(e) => setProductTitle(e.target.value)}
              placeholder="Nombre del producto"
            />
          </div>

          <div className="space-y-1">
            <Label>Handle *</Label>
            <Input
              value={productHandle}
              onChange={(e) => setProductHandle(e.target.value)}
              placeholder="producto-handle"
            />
          </div>

          <div className="space-y-1">
            <Label>Thumbnail URL</Label>
            <Input
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1">
            <Label>Bonus %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600">
              {(mutation.error as Error).message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={mutation.isPending || !productId || !productTitle || !productHandle}
            >
              {mutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Crear Boost
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
