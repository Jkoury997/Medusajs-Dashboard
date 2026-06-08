"use client"

import { useMemo, useState } from "react"
import { Header } from "@/components/dashboard/header"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/format"
import {
  useEmailTemplates,
  useTemplatePreview,
  useCampaignStats,
  useCampaignRecent,
  useAbandonedCartStats,
  useAbandonedCartList,
  campaignEmailPreviewUrl,
  abandonedCartPreviewUrl,
  TEMPLATE_TYPES,
  TEMPLATE_LABELS,
} from "@/hooks/use-email"
import { Eye, FileText, Send, ShoppingCart, Sparkles } from "lucide-react"

const AI_CAMPAIGN_TYPES = [
  "post_purchase",
  "welcome_1",
  "welcome_2",
  "welcome_3",
  "browse_abandonment",
  "newsletter",
  "win_back",
] as const

type Preview = { title: string; src?: string; html?: string } | null

function StatusBadge({ opened, clicked }: { opened?: boolean; clicked?: boolean }) {
  if (clicked) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Clickeó</Badge>
  if (opened) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Abrió</Badge>
  return <Badge variant="secondary" className="text-gray-500">Enviado</Badge>
}

export default function EmailsPage() {
  const [preview, setPreview] = useState<Preview>(null)
  const [campaignType, setCampaignType] = useState<string>("post_purchase")

  return (
    <div>
      <Header
        title="Emails"
        description="Plantillas, campañas automáticas y carritos abandonados"
      />
      <div className="p-6">
        <Tabs defaultValue="plantillas">
          <TabsList>
            <TabsTrigger value="plantillas" className="gap-1.5"><FileText className="w-4 h-4" />Plantillas</TabsTrigger>
            <TabsTrigger value="campanas" className="gap-1.5"><Sparkles className="w-4 h-4" />Campañas IA</TabsTrigger>
            <TabsTrigger value="carritos" className="gap-1.5"><ShoppingCart className="w-4 h-4" />Carritos abandonados</TabsTrigger>
          </TabsList>

          <TabsContent value="plantillas" className="mt-4">
            <PlantillasTab onPreview={setPreview} />
          </TabsContent>
          <TabsContent value="campanas" className="mt-4 space-y-6">
            <CampanasTab
              type={campaignType}
              onTypeChange={setCampaignType}
              onPreview={setPreview}
            />
          </TabsContent>
          <TabsContent value="carritos" className="mt-4 space-y-6">
            <CarritosTab onPreview={setPreview} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview dialog */}
      <Dialog open={preview !== null} onOpenChange={(o) => { if (!o) setPreview(null) }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-mk-pink" />
              {preview?.title ?? "Vista previa"}
            </DialogTitle>
          </DialogHeader>
          <iframe
            title="email-preview"
            sandbox=""
            className="w-full h-[70vh] rounded-md border border-gray-200 bg-white"
            src={preview?.src}
            srcDoc={preview?.html}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// TAB: PLANTILLAS
// ============================================================

function PlantillasTab({ onPreview }: { onPreview: (p: Preview) => void }) {
  const { data, isLoading } = useEmailTemplates()
  const previewMut = useTemplatePreview()
  const [loadingType, setLoadingType] = useState<string | null>(null)

  // Tipos con override en DB (personalizados) — group_name vacío = default DB
  const customized = useMemo(() => {
    const set = new Set<string>()
    for (const t of data?.templates ?? []) set.add(t.template_type)
    return set
  }, [data])

  async function handlePreview(type: string) {
    setLoadingType(type)
    try {
      const html = await previewMut.mutateAsync(type)
      onPreview({ title: TEMPLATE_LABELS[type] ?? type, html })
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plantilla</TableHead>
              <TableHead>Asunto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Vista previa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-32" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              TEMPLATE_TYPES.map((type) => {
                const def = data?.defaults?.[type]
                const dbT = data?.templates?.find((t) => t.template_type === type)
                const subject = dbT?.subject ?? def?.subject ?? "—"
                const isCustom = customized.has(type)
                return (
                  <TableRow key={type}>
                    <TableCell className="font-medium">{TEMPLATE_LABELS[type] ?? type}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-md truncate">{subject}</TableCell>
                    <TableCell>
                      {isCustom ? (
                        <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">Personalizada</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-gray-500">Por defecto</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={loadingType === type}
                        onClick={() => handlePreview(type)}
                      >
                        <Eye className="w-4 h-4" />
                        {loadingType === type ? "Cargando…" : "Ver"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ============================================================
// TAB: CAMPAÑAS IA
// ============================================================

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  )
}

function CampanasTab({
  type,
  onTypeChange,
  onPreview,
}: {
  type: string
  onTypeChange: (t: string) => void
  onPreview: (p: Preview) => void
}) {
  const { data: stats, isLoading: statsLoading } = useCampaignStats()
  const { data: recent, isLoading: recentLoading } = useCampaignRecent(type)

  return (
    <>
      {/* Totales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statsLoading || !stats ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)
        ) : (
          <>
            <MiniStat label="Enviados" value={formatNumber(stats.totals.sent)} />
            <MiniStat label="Entregados" value={formatNumber(stats.totals.delivered)} />
            <MiniStat label="Aperturas" value={formatNumber(stats.totals.opened)} />
            <MiniStat label="Clicks" value={formatNumber(stats.totals.clicked)} />
            <MiniStat label="Open rate" value={stats.totals.open_rate} />
          </>
        )}
      </div>

      {/* Selector de tipo + recientes */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Send className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Emails recientes de:</span>
            <Select value={type} onValueChange={onTypeChange}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AI_CAMPAIGN_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{TEMPLATE_LABELS[t] ?? t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !recent || recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                    Sin emails de esta campaña
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(r.sent_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium text-gray-900">{r.customer_name || "—"}</div>
                      <div className="text-xs text-gray-400">{r.email}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                      {r.ai_subject || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge opened={!!r.opened_at} clicked={!!r.clicked_at} />
                    </TableCell>
                    <TableCell className="text-right">
                      {r.has_preview ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => onPreview({ title: r.ai_subject || "Email", src: campaignEmailPreviewUrl(r._id) })}
                        >
                          <Eye className="w-4 h-4" />Ver
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

// ============================================================
// TAB: CARRITOS ABANDONADOS
// ============================================================

function CarritosTab({ onPreview }: { onPreview: (p: Preview) => void }) {
  const { data: stats, isLoading: statsLoading } = useAbandonedCartStats()
  const { data: list, isLoading: listLoading } = useAbandonedCartList(50)

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statsLoading || !stats ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)
        ) : (
          <>
            <MiniStat label="Trackeados" value={formatNumber(stats.total_tracked)} />
            <MiniStat label="Recuperados" value={formatNumber(stats.total_recovered)} />
            <MiniStat label="Tasa recup." value={stats.recovery_rate} />
            <MiniStat label="Email 1 enviados" value={formatNumber(stats.email_1_sent)} />
            <MiniStat label="Email 2 enviados" value={formatNumber(stats.email_2_sent)} />
          </>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Abandonado</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Emails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !list || list.records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                    No hay carritos abandonados registrados
                  </TableCell>
                </TableRow>
              ) : (
                list.records.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(c.abandoned_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium text-gray-900">{c.customer_name || "—"}</div>
                      <div className="text-xs text-gray-400">{c.email}</div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {c.cart_total != null ? formatCurrency(c.cart_total) : "—"}
                    </TableCell>
                    <TableCell>
                      {c.recovered ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Recuperado</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-gray-500">Pendiente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.has_preview_1 && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                            onClick={() => onPreview({ title: "Carrito — Email 1", src: abandonedCartPreviewUrl(c.cart_id, 1) })}>
                            Email 1
                          </Button>
                        )}
                        {c.has_preview_2 && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                            onClick={() => onPreview({ title: "Carrito — Email 2", src: abandonedCartPreviewUrl(c.cart_id, 2) })}>
                            Email 2
                          </Button>
                        )}
                        {!c.has_preview_1 && !c.has_preview_2 && <span className="text-xs text-gray-300">—</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
