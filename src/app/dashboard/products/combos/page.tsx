"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useComboConfig,
  useUpdateComboConfig,
  useStoreCombos,
  useComboStats,
  useComboData,
} from "@/hooks/use-combos"
import { formatCurrency, formatNumber } from "@/lib/format"
import type { ComboConfig } from "@/types/combos"
import {
  Boxes,
  Bot,
  Cpu,
  Settings,
  Save,
  Loader2,
  Eye,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Package,
  BarChart3,
  Zap,
  AlertTriangle,
} from "lucide-react"

// ============================================================
// HELPERS
// ============================================================

function getDefaultDateRange(): { from: Date; to: Date } {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return { from, to }
}

function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================
// CONFIG SECTION
// ============================================================

function ComboConfigSection() {
  const { data: config, isLoading, error } = useComboConfig()
  const updateConfig = useUpdateComboConfig()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<ComboConfig>>({})
  const [saveMsg, setSaveMsg] = useState("")

  const startEditing = () => {
    if (!config) return
    setForm({
      max_discount: config.max_discount,
      size_proportion: { ...config.size_proportion },
      allowed_categories: [...config.allowed_categories],
      must_include_category: config.must_include_category,
      enabled_customer_groups: [...config.enabled_customer_groups],
      ai_enabled: config.ai_enabled,
    })
    setEditing(true)
    setSaveMsg("")
  }

  const handleSave = () => {
    setSaveMsg("")
    updateConfig.mutate(form, {
      onSuccess: () => {
        setSaveMsg("Configuración guardada correctamente")
        setEditing(false)
      },
      onError: () => {
        setSaveMsg("Error al guardar la configuración")
      },
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Error al cargar configuración de combos</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!config) return null

  const display = editing ? form : config

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Combos
        </CardTitle>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={startEditing}>
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(false)
                setSaveMsg("")
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-mk-pink hover:bg-mk-pink-dark text-white"
              onClick={handleSave}
              disabled={updateConfig.isPending}
            >
              {updateConfig.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Guardar
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {saveMsg && (
          <p
            className={`text-sm ${
              saveMsg.includes("Error") ? "text-red-600" : "text-green-600"
            }`}
          >
            {saveMsg}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Max Discount */}
          <div className="space-y-2">
            <Label>Descuento Máximo (%)</Label>
            {editing ? (
              <Input
                type="number"
                min={0}
                max={100}
                value={form.max_discount ?? 0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, max_discount: Number(e.target.value) }))
                }
              />
            ) : (
              <p className="text-lg font-semibold">{display.max_discount}%</p>
            )}
          </div>

          {/* Must Include Category */}
          <div className="space-y-2">
            <Label>Categoría Obligatoria</Label>
            {editing ? (
              <Input
                value={form.must_include_category ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, must_include_category: e.target.value }))
                }
              />
            ) : (
              <p className="text-lg font-semibold">{display.must_include_category || "—"}</p>
            )}
          </div>

          {/* AI Enabled */}
          <div className="space-y-2">
            <Label>Generación con IA</Label>
            {editing ? (
              <div className="flex items-center gap-2 pt-1">
                <Switch
                  checked={form.ai_enabled ?? false}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, ai_enabled: checked }))
                  }
                />
                <span className="text-sm text-gray-500">
                  {form.ai_enabled ? "Activada" : "Desactivada"}
                </span>
              </div>
            ) : (
              <Badge variant={display.ai_enabled ? "default" : "secondary"}>
                {display.ai_enabled ? "Activada" : "Desactivada"}
              </Badge>
            )}
          </div>
        </div>

        {/* Size Proportion */}
        <div className="space-y-2">
          <Label>Proporción de Talles</Label>
          <div className="flex flex-wrap gap-3">
            {Object.entries(display.size_proportion ?? {}).map(([size, value]) => (
              <div key={size} className="flex items-center gap-1">
                <Badge variant="outline">{size}</Badge>
                {editing ? (
                  <Input
                    type="number"
                    min={0}
                    className="w-16 h-8"
                    value={value}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        size_proportion: {
                          ...(f.size_proportion as any),
                          [size]: Number(e.target.value),
                        },
                      }))
                    }
                  />
                ) : (
                  <span className="text-sm font-medium">{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Allowed Categories */}
        <div className="space-y-2">
          <Label>Categorías Permitidas</Label>
          {editing ? (
            <Input
              value={(form.allowed_categories ?? []).join(", ")}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  allowed_categories: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="medias, ropa-interior, bombachas"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {(display.allowed_categories ?? []).map((cat) => (
                <Badge key={cat} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Enabled Customer Groups */}
        <div className="space-y-2">
          <Label>Grupos de Clientes Habilitados</Label>
          {editing ? (
            <Input
              value={(form.enabled_customer_groups ?? []).join(", ")}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  enabled_customer_groups: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="group_id_1, group_id_2"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {(display.enabled_customer_groups ?? []).length > 0 ? (
                (display.enabled_customer_groups ?? []).map((g) => (
                  <Badge key={g} variant="secondary">
                    {g}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-400">Ninguno</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// COMBOS PREVIEW SECTION
// ============================================================

function CombosPreviewSection() {
  const { data, isLoading, error } = useStoreCombos()
  const [expanded, setExpanded] = useState<string | null>(null)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span>No se pudieron cargar los combos. Verificá que el endpoint /store/combos esté disponible.</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const combos = data?.combos ?? []

  if (combos.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No hay combos generados actualmente.
        </CardContent>
      </Card>
    )
  }

  const aiCombos = combos.filter((c) => c.generation_method === "ai")
  const algCombos = combos.filter((c) => c.generation_method === "algorithmic")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Boxes className="h-5 w-5" />
          Combos Generados ({combos.length})
        </h3>
        <div className="flex gap-2">
          <Badge className="bg-purple-100 text-purple-800">
            <Bot className="h-3 w-3 mr-1" />
            IA: {aiCombos.length}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">
            <Cpu className="h-3 w-3 mr-1" />
            Algorítmico: {algCombos.length}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {combos.map((combo) => (
          <Card
            key={combo.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setExpanded(expanded === combo.id ? null : combo.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{combo.name}</span>
                    <Badge
                      variant="outline"
                      className={
                        combo.generation_method === "ai"
                          ? "border-purple-300 text-purple-700"
                          : "border-blue-300 text-blue-700"
                      }
                    >
                      {combo.generation_method === "ai" ? (
                        <Bot className="h-3 w-3 mr-1" />
                      ) : (
                        <Cpu className="h-3 w-3 mr-1" />
                      )}
                      {combo.generation_method === "ai" ? "IA" : "Algorítmico"}
                    </Badge>
                  </div>
                  {combo.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {combo.description}
                    </p>
                  )}
                </div>
                {expanded === combo.id ? (
                  <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-4 mt-3">
                <div>
                  <span className="text-xs text-gray-400">Precio</span>
                  <p className="text-sm">
                    <span className="line-through text-gray-400 mr-1">
                      {formatCurrency(combo.total_price)}
                    </span>
                    <span className="font-bold text-green-700">
                      {formatCurrency(combo.combo_price)}
                    </span>
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  -{combo.discount_percentage}%
                </Badge>
                <span className="text-xs text-gray-500">
                  {combo.products.length} productos
                </span>
              </div>

              {expanded === combo.id && (
                <div className="mt-4 border-t pt-3 space-y-2">
                  {combo.products.map((p, idx) => (
                    <div
                      key={`${p.variant_id}-${idx}`}
                      className="flex items-center gap-3 text-sm"
                    >
                      {p.thumbnail && (
                        <img
                          src={p.thumbnail}
                          alt={p.title}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{p.title}</p>
                        <p className="text-xs text-gray-400">
                          Talle {p.size} · {p.color} · {p.category_handle}
                        </p>
                      </div>
                      <span className="text-gray-600 shrink-0">
                        {formatCurrency(p.original_price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// PERFORMANCE / A-B TESTING SECTION
// ============================================================

function ComboPerformanceSection() {
  const { from, to } = getDefaultDateRange()
  const { data, isLoading, error } = useComboStats(from, to)

  if (isLoading) return <SkeletonCards count={5} />

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span>No se pudieron cargar las estadísticas de performance.</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const { combos, summary } = data

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        Performance de Combos (últimos 30 días)
      </h3>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Vistas"
          value={formatNumber(summary.total_views)}
          icon={<Eye className="h-5 w-5 text-gray-400" />}
        />
        <MetricCard
          title="Agregados al Carrito"
          value={formatNumber(summary.total_added_to_cart)}
          icon={<ShoppingCart className="h-5 w-5 text-gray-400" />}
        />
        <MetricCard
          title="Convertidos"
          value={formatNumber(summary.total_converted)}
          icon={<TrendingUp className="h-5 w-5 text-gray-400" />}
        />
        <MetricCard
          title="Conversión IA"
          value={summary.ai_conversion_rate}
          icon={<Bot className="h-5 w-5 text-purple-500" />}
        />
        <MetricCard
          title="Conversión Algorítmica"
          value={summary.algorithmic_conversion_rate}
          icon={<Cpu className="h-5 w-5 text-blue-500" />}
        />
      </div>

      {/* Per-combo table */}
      {combos.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Combo</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Vistas</TableHead>
                  <TableHead className="text-right">Carrito</TableHead>
                  <TableHead className="text-right">Convertidos</TableHead>
                  <TableHead className="text-right">Tasa Conv.</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combos.map((c) => (
                  <TableRow key={c.combo_id}>
                    <TableCell className="font-medium">{c.combo_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          c.generation_method === "ai"
                            ? "border-purple-300 text-purple-700"
                            : "border-blue-300 text-blue-700"
                        }
                      >
                        {c.generation_method === "ai" ? "IA" : "Algorítmico"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(c.views)}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(c.added_to_cart)}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(c.converted)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {c.conversion_rate}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(c.revenue)}
                    </TableCell>
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

// ============================================================
// PRODUCT SCORING SECTION
// ============================================================

function ComboScoringSection() {
  const { from, to } = getDefaultDateRange()
  const { data, isLoading, error } = useComboData(from, to)
  const [tab, setTab] = useState<"popular" | "slow">("popular")

  if (isLoading) return <SkeletonCards count={4} />

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span>No se pudieron cargar los datos de scoring.</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const items = tab === "popular" ? data.popular_products : data.slow_movers

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Scoring de Productos
        </h3>
        <div className="flex gap-2">
          <Button
            variant={tab === "popular" ? "default" : "outline"}
            size="sm"
            className={tab === "popular" ? "bg-mk-pink hover:bg-mk-pink-dark text-white" : ""}
            onClick={() => setTab("popular")}
          >
            Populares ({data.popular_products.length})
          </Button>
          <Button
            variant={tab === "slow" ? "default" : "outline"}
            size="sm"
            className={tab === "slow" ? "bg-mk-pink hover:bg-mk-pink-dark text-white" : ""}
            onClick={() => setTab("slow")}
          >
            Slow Movers ({data.slow_movers.length})
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No hay datos para este período.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  {tab === "popular" && <TableHead className="text-right">Score</TableHead>}
                  <TableHead className="text-right">Vistas</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Carrito</TableHead>
                  <TableHead className="text-right">Compras</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell className="font-medium max-w-[240px] truncate">
                      {item.title}
                    </TableCell>
                    {tab === "popular" && "score" in item && (
                      <TableCell className="text-right">
                        <Badge
                          className={
                            item.score >= 0.7
                              ? "bg-green-100 text-green-800"
                              : item.score >= 0.4
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {item.score.toFixed(2)}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-right">{formatNumber(item.views)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.clicks)}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.added_to_cart)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.purchased)}
                    </TableCell>
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

// ============================================================
// MAIN PAGE
// ============================================================

export default function CombosPage() {
  return (
    <>
      <Header
        title="Combos"
        description="Gestión de combos, configuración, vista previa y performance (A/B testing IA vs Algorítmico)"
      />
      <div className="p-6 space-y-8">
        {/* Config */}
        <ComboConfigSection />

        {/* Generated Combos Preview */}
        <CombosPreviewSection />

        {/* Performance / A-B Testing */}
        <ComboPerformanceSection />

        {/* Product Scoring */}
        <ComboScoringSection />
      </div>
    </>
  )
}
