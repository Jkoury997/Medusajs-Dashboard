"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  useDistributorDetail,
  useApproveDistributor,
  useRejectDistributor,
  useMarkBranchReception,
} from "@/hooks/use-distributors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Store,
  MapPin,
  Building2,
  Eye,
  MessageCircle,
  Share2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react"

type TabId = "info" | "sucursales" | "metricas"

const STATUS_COLORS: Record<string, string> = {
  aprobada: "bg-green-100 text-green-700",
  pendiente: "bg-yellow-100 text-yellow-700",
  rechazada: "bg-red-100 text-red-700",
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function DistributorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<TabId>("info")
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading, error } = useDistributorDetail(id)
  const approve = useApproveDistributor()
  const reject = useRejectDistributor()
  const markReception = useMarkBranchReception()
  const isActioning = approve.isPending || reject.isPending

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar distribuidor
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mb-6" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { distributor, branches, metrics } = data

  async function handleApprove() {
    setActionError(null)
    try {
      await approve.mutateAsync(id)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al aprobar")
    }
  }

  async function handleReject() {
    setActionError(null)
    try {
      await reject.mutateAsync(id)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al rechazar")
    }
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "info", label: "Info", icon: <Store className="w-4 h-4" /> },
    { id: "sucursales", label: `Sucursales (${branches.length})`, icon: <Building2 className="w-4 h-4" /> },
    { id: "metricas", label: "Métricas", icon: <Eye className="w-4 h-4" /> },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/resellers-fisicas/distribuidores"
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{distributor.business_name}</h1>
            <span
              className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[distributor.status]}`}
            >
              {distributor.status.charAt(0).toUpperCase() + distributor.status.slice(1)}
            </span>
          </div>
        </div>
        {distributor.status === "pendiente" && (
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-md disabled:opacity-50 hover:bg-green-700"
              disabled={isActioning}
              onClick={handleApprove}
            >
              <CheckCircle className="w-4 h-4" />
              Aprobar
            </button>
            <button
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-500 text-white rounded-md disabled:opacity-50 hover:bg-gray-600"
              disabled={isActioning}
              onClick={handleReject}
            >
              <XCircle className="w-4 h-4" />
              Rechazar
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {actionError}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Sucursales</p>
          <p className="text-lg font-bold">{branches.filter((b) => b.active).length}</p>
        </div>
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Vistas (30d)</p>
          <p className="text-lg font-bold">{metrics.card_views}</p>
        </div>
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">WhatsApp Clicks (30d)</p>
          <p className="text-lg font-bold">{metrics.whatsapp_clicks}</p>
        </div>
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Social Clicks (30d)</p>
          <p className="text-lg font-bold">{metrics.social_clicks}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-mk-pink text-mk-pink"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "info" && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{distributor.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">CUIT</p>
                  <p className="font-medium font-mono">{distributor.cuit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">WhatsApp</p>
                  <p className="font-medium">{distributor.whatsapp}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pedido Mínimo</p>
                  <p className="font-medium">
                    {distributor.minimum_order
                      ? `$${distributor.minimum_order.toLocaleString("es-AR")}`
                      : "Sin mínimo"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {distributor.logo_url && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Logo</p>
                    <img
                      src={distributor.logo_url}
                      alt={distributor.business_name}
                      className="w-20 h-20 object-contain rounded border"
                    />
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Redes Sociales</p>
                  <div className="space-y-1 mt-1">
                    {distributor.social_media?.instagram && (
                      <p className="text-sm">Instagram: {distributor.social_media.instagram}</p>
                    )}
                    {distributor.social_media?.facebook && (
                      <p className="text-sm">Facebook: {distributor.social_media.facebook}</p>
                    )}
                    {distributor.social_media?.tiktok && (
                      <p className="text-sm">TikTok: {distributor.social_media.tiktok}</p>
                    )}
                    {!distributor.social_media?.instagram &&
                      !distributor.social_media?.facebook &&
                      !distributor.social_media?.tiktok && (
                        <p className="text-sm text-gray-400">Sin redes configuradas</p>
                      )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha de registro</p>
                  <p className="text-sm">{formatDate(distributor.created_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "sucursales" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Última Recepción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Sin sucursales registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    branches.map((branch) => (
                      <TableRow key={branch._id} className={!branch.active ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{branch.name}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span>{branch.address}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {branch.approximate_zone || "-"}
                        </TableCell>
                        <TableCell className="text-sm">{branch.whatsapp}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {branch.business_hours || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {branch.last_reception_date
                            ? formatDate(branch.last_reception_date)
                            : "Nunca"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              branch.active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {branch.active ? "Activa" : "Inactiva"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {branch.active && (
                            <button
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-50"
                              disabled={markReception.isPending}
                              onClick={() =>
                                markReception.mutate({
                                  distributorId: id,
                                  branchId: branch._id,
                                })
                              }
                            >
                              <Package className="w-3 h-3" />
                              Marcar Recepción
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "metricas" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Eye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{metrics.card_views}</p>
              <p className="text-sm text-gray-500 mt-1">Vistas de Tarjeta</p>
              <p className="text-xs text-gray-400">Últimos 30 días</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{metrics.whatsapp_clicks}</p>
              <p className="text-sm text-gray-500 mt-1">Clicks en WhatsApp</p>
              <p className="text-xs text-gray-400">Últimos 30 días</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Share2 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{metrics.social_clicks}</p>
              <p className="text-sm text-gray-500 mt-1">Clicks en Redes</p>
              <p className="text-xs text-gray-400">Últimos 30 días</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
