"use client"

import { useState } from "react"
import Link from "next/link"
import { useInfluencerStats, useCreateInfluencer } from "@/hooks/use-influencers"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  UserPlus,
  Instagram,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

function formatCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "Twitter/X",
  facebook: "Facebook",
  other: "Otro",
  sin_plataforma: "Sin plataforma",
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

export default function InfluencersPage() {
  const { data, isLoading, error } = useInfluencerStats()
  const createInfluencer = useCreateInfluencer()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    instagram: "",
    tiktok: "",
    phone: "",
    fee: "",
    platform: "",
    campaign: "",
    content_type: "",
    followers: "",
    notes: "",
    referral_code: "",
  })

  const stats = data?.stats

  async function handleCreate() {
    try {
      await createInfluencer.mutateAsync({
        email: form.email,
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        instagram: form.instagram || undefined,
        tiktok: form.tiktok || undefined,
        phone: form.phone || undefined,
        fee: form.fee ? Number(form.fee) : 0,
        platform: form.platform || undefined,
        campaign: form.campaign || undefined,
        content_type: form.content_type || undefined,
        followers: form.followers ? Number(form.followers) : undefined,
        notes: form.notes || undefined,
        referral_code: form.referral_code || undefined,
      })
      setShowCreate(false)
      setForm({ email: "", first_name: "", last_name: "", instagram: "", tiktok: "", phone: "", fee: "", platform: "", campaign: "", content_type: "", followers: "", notes: "", referral_code: "" })
    } catch {}
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Influencers</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar datos de influencers.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Influencers</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Nuevo Influencer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Influencer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email *</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@ejemplo.com" />
                </div>
                <div>
                  <Label>Codigo referido</Label>
                  <Input value={form.referral_code} onChange={(e) => setForm({ ...form, referral_code: e.target.value })} placeholder="Auto-generado si vacio" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre</Label>
                  <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                </div>
                <div>
                  <Label>Apellido</Label>
                  <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Instagram</Label>
                  <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@usuario" />
                </div>
                <div>
                  <Label>TikTok</Label>
                  <Input value={form.tiktok} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} placeholder="@usuario" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Fee pagado (centavos)</Label>
                  <Input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label>Seguidores</Label>
                  <Input type="number" value={form.followers} onChange={(e) => setForm({ ...form, followers: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Plataforma</Label>
                  <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de contenido</Label>
                  <Select value={form.content_type} onValueChange={(v) => setForm({ ...form, content_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="multiple">Varios</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Campana</Label>
                <Input value={form.campaign} onChange={(e) => setForm({ ...form, campaign: e.target.value })} placeholder="Nombre de la campana" />
              </div>
              <div>
                <Label>Notas</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas internas" />
              </div>
              <Button onClick={handleCreate} disabled={!form.email || createInfluencer.isPending} className="w-full">
                {createInfluencer.isPending ? "Creando..." : "Crear Influencer"}
              </Button>
              {createInfluencer.isError && (
                <p className="text-sm text-red-500">{(createInfluencer.error as Error).message}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-3" />
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Influencers"
              value={stats.total_influencers}
              icon={Users}
              subtitle={`${stats.active_influencers} activos`}
            />
            <MetricCard
              title="Inversion Total"
              value={formatCentavos(stats.total_investment)}
              icon={DollarSign}
              subtitle="Fee pagado a influencers"
            />
            <MetricCard
              title="Ventas Atribuidas"
              value={formatCentavos(stats.total_attributed_sales)}
              icon={ShoppingCart}
              subtitle={`${stats.total_attributed_orders} ordenes`}
            />
            <MetricCard
              title="ROI Global"
              value={`${stats.global_roi}%`}
              icon={TrendingUp}
              subtitle={stats.global_roi > 0 ? "Rentable" : "No rentable aun"}
              className={stats.global_roi > 0 ? "border-green-200" : "border-red-200"}
            />
          </div>

          {/* Platform Breakdown */}
          {stats.by_platform && Object.keys(stats.by_platform).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(stats.by_platform).map(([platform, data]) => (
                    <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{PLATFORM_LABELS[platform] || platform}</p>
                        <p className="text-xs text-gray-500">{data.count} influencers</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCentavos(data.sales)}</p>
                        <p className="text-xs text-gray-500">{data.orders} ordenes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campaign Breakdown */}
          {stats.by_campaign && Object.keys(stats.by_campaign).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Campana</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campana</TableHead>
                      <TableHead className="text-right">Influencers</TableHead>
                      <TableHead className="text-right">Inversion</TableHead>
                      <TableHead className="text-right">Ventas</TableHead>
                      <TableHead className="text-right">Ordenes</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(stats.by_campaign).map(([campaign, data]) => (
                      <TableRow key={campaign}>
                        <TableCell className="font-medium">{campaign === "sin_campana" ? "Sin campana" : campaign}</TableCell>
                        <TableCell className="text-right">{data.count}</TableCell>
                        <TableCell className="text-right">{formatCentavos(data.investment)}</TableCell>
                        <TableCell className="text-right">{formatCentavos(data.sales)}</TableCell>
                        <TableCell className="text-right">{data.orders}</TableCell>
                        <TableCell className="text-right">
                          <span className={data.roi > 0 ? "text-green-600" : "text-red-600"}>
                            {data.roi > 0 ? "+" : ""}{data.roi}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Influencer List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Todos los Influencers</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.influencers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay influencers registrados. Crea uno con el boton de arriba.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Influencer</TableHead>
                      <TableHead>Plataforma</TableHead>
                      <TableHead>Campana</TableHead>
                      <TableHead>Codigo</TableHead>
                      <TableHead className="text-right">Fee</TableHead>
                      <TableHead className="text-right">Ventas</TableHead>
                      <TableHead className="text-right">Ordenes</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.influencers.map((inf) => (
                      <TableRow key={inf.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{inf.name}</p>
                            <p className="text-xs text-gray-500">{inf.email}</p>
                            {inf.instagram && (
                              <p className="text-xs text-pink-500 flex items-center gap-1">
                                <Instagram className="h-3 w-3" />{inf.instagram}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {inf.platform ? (
                            <Badge variant="outline">{PLATFORM_LABELS[inf.platform] || inf.platform}</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{inf.campaign || "-"}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{inf.referral_code}</code>
                        </TableCell>
                        <TableCell className="text-right">{formatCentavos(inf.fee)}</TableCell>
                        <TableCell className="text-right">{formatCentavos(inf.total_sales)}</TableCell>
                        <TableCell className="text-right">{inf.total_orders}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {inf.roi > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-green-500" />
                            ) : inf.roi < 0 ? (
                              <ArrowDownRight className="h-4 w-4 text-red-500" />
                            ) : null}
                            <span className={inf.roi > 0 ? "text-green-600 font-semibold" : inf.roi < 0 ? "text-red-600 font-semibold" : "text-gray-500"}>
                              {inf.roi > 0 ? "+" : ""}{inf.roi}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/resellers/influencers/${inf.id}`}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
