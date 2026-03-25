"use client"

import { use } from "react"
import Link from "next/link"
import { useInfluencerDetail, useUpdateInfluencer, useDeleteInfluencer } from "@/hooks/use-influencers"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  ArrowLeft,
  Instagram,
  Target,
  Receipt,
  BarChart3,
} from "lucide-react"
import { useRouter } from "next/navigation"

function formatCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatDate(date: string | null): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "Twitter/X",
  facebook: "Facebook",
  other: "Otro",
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  reel: "Reel",
  story: "Story",
  post: "Post",
  video: "Video",
  live: "Live",
  multiple: "Varios",
  other: "Otro",
}

export default function InfluencerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading, error } = useInfluencerDetail(id)
  const deleteInfluencer = useDeleteInfluencer()
  const router = useRouter()

  async function handleDelete() {
    if (!confirm("Estas seguro de eliminar este influencer?")) return
    try {
      await deleteInfluencer.mutateAsync(id)
      router.push("/dashboard/resellers/influencers")
    } catch {}
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar detalle del influencer.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-12 bg-gray-200 rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  const { influencer, metrics, monthly_breakdown, recent_orders, customers } = data
  const monthKeys = Object.keys(monthly_breakdown).sort()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/resellers/influencers">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{influencer.name}</h1>
            <p className="text-sm text-gray-500">{influencer.email}</p>
          </div>
          <Badge variant={influencer.status === "active" ? "default" : "secondary"}>
            {influencer.status}
          </Badge>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteInfluencer.isPending}>
          {deleteInfluencer.isPending ? "Eliminando..." : "Eliminar"}
        </Button>
      </div>

      {/* Influencer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informacion del Influencer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Codigo</span>
              <p className="font-mono font-semibold">{influencer.referral_code}</p>
            </div>
            <div>
              <span className="text-gray-500">Plataforma</span>
              <p>{influencer.platform ? PLATFORM_LABELS[influencer.platform] : "-"}</p>
            </div>
            <div>
              <span className="text-gray-500">Campana</span>
              <p>{influencer.campaign || "-"}</p>
            </div>
            <div>
              <span className="text-gray-500">Tipo contenido</span>
              <p>{influencer.content_type ? CONTENT_TYPE_LABELS[influencer.content_type] : "-"}</p>
            </div>
            {influencer.instagram && (
              <div>
                <span className="text-gray-500">Instagram</span>
                <p className="flex items-center gap-1 text-pink-500"><Instagram className="h-3 w-3" />{influencer.instagram}</p>
              </div>
            )}
            {influencer.tiktok && (
              <div>
                <span className="text-gray-500">TikTok</span>
                <p>{influencer.tiktok}</p>
              </div>
            )}
            {influencer.followers && (
              <div>
                <span className="text-gray-500">Seguidores</span>
                <p>{influencer.followers.toLocaleString("es-AR")}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500">Periodo</span>
              <p>{formatDate(influencer.start_date)} - {formatDate(influencer.end_date)}</p>
            </div>
            {influencer.notes && (
              <div className="col-span-2">
                <span className="text-gray-500">Notas</span>
                <p>{influencer.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Fee Pagado" value={formatCentavos(metrics.fee)} icon={DollarSign} subtitle="Costo del influencer" />
        <MetricCard title="Ventas Atribuidas" value={formatCentavos(metrics.total_sales)} icon={ShoppingCart} subtitle={`${metrics.total_orders} ordenes`} />
        <MetricCard
          title="ROI"
          value={`${metrics.roi > 0 ? "+" : ""}${metrics.roi}%`}
          icon={TrendingUp}
          subtitle={metrics.is_profitable ? "Rentable" : "No rentable"}
          className={metrics.is_profitable ? "border-green-200" : "border-red-200"}
        />
        <MetricCard title="Clientes" value={metrics.total_customers} icon={Users} subtitle={`${formatCentavos(metrics.cost_per_customer)} / cliente`} />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Costo por Orden" value={formatCentavos(metrics.cost_per_order)} icon={Receipt} />
        <MetricCard title="Ticket Promedio" value={formatCentavos(metrics.avg_order_value)} icon={Target} />
        <MetricCard
          title="Ganancia Neta"
          value={formatCentavos(metrics.total_sales - metrics.fee)}
          icon={BarChart3}
          className={(metrics.total_sales - metrics.fee) >= 0 ? "border-green-200" : "border-red-200"}
        />
      </div>

      {/* Monthly Breakdown */}
      {monthKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolucion Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Ordenes</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthKeys.map((key) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell className="text-right">{monthly_breakdown[key].orders}</TableCell>
                    <TableCell className="text-right">{formatCentavos(monthly_breakdown[key].sales)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      {recent_orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ordenes Recientes Atribuidas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent_orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.order_id}</TableCell>
                    <TableCell>
                      <div>
                        {order.customer_name && <p className="text-sm">{order.customer_name}</p>}
                        <p className="text-xs text-gray-500">{order.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCentavos(order.order_total)}</TableCell>
                    <TableCell className="text-sm">{formatDate(order.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Linked Customers */}
      {customers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clientes Vinculados ({customers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Vinculado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.customer_email}</TableCell>
                    <TableCell><Badge variant="outline">{c.link_source}</Badge></TableCell>
                    <TableCell className="text-sm">{formatDate(c.linked_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
