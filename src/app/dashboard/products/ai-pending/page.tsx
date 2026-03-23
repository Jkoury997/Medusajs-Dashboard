"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useAiPendingProducts,
  useApproveDescription,
  useRegenerateDescription,
  useGenerateAll,
  type AiPendingProduct,
} from "@/hooks/use-ai-pending"
import {
  Bot,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Search,
  FileText,
  XCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react"

// ============================================================
// VARIANT LABELS
// ============================================================

const VARIANT_OPTIONS = [
  { key: "corta" as const, label: "Corta" },
  { key: "media" as const, label: "Media" },
  { key: "larga" as const, label: "Larga" },
]

// ============================================================
// PRODUCT CARD
// ============================================================

function PendingProductCard({ product }: { product: AiPendingProduct }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<"corta" | "media" | "larga" | null>(null)
  const approveMutation = useApproveDescription()
  const regenerateMutation = useRegenerateDescription()

  const desc = product.ai_description
  const isApproving = approveMutation.isPending
  const isRegenerating = regenerateMutation.isPending
  const isBusy = isApproving || isRegenerating

  const handleApprove = (variant: "corta" | "media" | "larga") => {
    setSelectedVariant(variant)
    approveMutation.mutate({ productId: product.id, variant })
  }

  const handleRegenerate = () => {
    regenerateMutation.mutate(product.id)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-16 h-16 object-cover rounded-lg shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{product.title}</CardTitle>
            <p className="text-xs text-gray-400 mt-1 font-mono">{product.id}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                <Bot className="w-3 h-3 mr-1" />
                Pendiente de revisión
              </Badge>
              <span className="text-xs text-gray-400">
                {new Date(product.ai_generated_at).toLocaleString("es-AR")}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Meta info */}
        {desc.meta_title && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-gray-500">Meta Title</p>
            <p className="text-sm text-gray-800">{desc.meta_title}</p>
            {desc.meta_description && (
              <>
                <p className="text-xs font-medium text-gray-500 mt-2">Meta Description</p>
                <p className="text-sm text-gray-600">{desc.meta_description}</p>
              </>
            )}
          </div>
        )}

        {/* Keywords */}
        {desc.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {desc.keywords.map((kw) => (
              <Badge key={kw} variant="secondary" className="text-xs">
                {kw}
              </Badge>
            ))}
          </div>
        )}

        {/* Variant descriptions */}
        <div className="space-y-3">
          {VARIANT_OPTIONS.map(({ key, label }) => {
            const text = desc[key]
            if (!text) return null
            const isSelected = selectedVariant === key
            return (
              <div
                key={key}
                className={`border rounded-lg p-3 transition-colors ${
                  isSelected && approveMutation.isSuccess
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant="outline"
                    className={
                      key === "corta"
                        ? "bg-blue-50 text-blue-700"
                        : key === "media"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-orange-50 text-orange-700"
                    }
                  >
                    {label}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(key)}
                    disabled={isBusy}
                    className="bg-mk-pink hover:bg-mk-pink-dark text-white text-xs h-7"
                  >
                    {isApproving && isSelected ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    Aprobar
                  </Button>
                </div>
                <p className={`text-sm text-gray-700 ${expanded ? "" : "line-clamp-3"}`}>
                  {text}
                </p>
              </div>
            )
          })}
        </div>

        {/* Regenerate button */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            ¿No te convence ninguna? Regenerá las descripciones.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isBusy}
            className="text-xs"
          >
            {isRegenerating ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Regenerar
          </Button>
        </div>

        {/* Error messages */}
        {approveMutation.isError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            {approveMutation.error?.message}
          </p>
        )}
        {regenerateMutation.isError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            {regenerateMutation.error?.message}
          </p>
        )}
        {approveMutation.isSuccess && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Descripción aprobada ({selectedVariant})
          </p>
        )}
        {regenerateMutation.isSuccess && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Regeneración encolada. Aparecerá de nuevo en unos segundos.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function AiPendingPage() {
  const { data: products, isLoading, isError, refetch } = useAiPendingProducts()
  const generateAll = useGenerateAll()
  const [search, setSearch] = useState("")

  const filtered = (products ?? []).filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
  })

  return (
    <div>
      <Header
        title="Descripciones IA Pendientes"
        description="Revisá y aprobá las descripciones generadas por IA para tus productos"
      />

      <div className="p-6 space-y-6">
        {/* Search & count bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && (
              <Badge variant="outline" className="text-sm">
                {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
              </Badge>
            )}
            <Button
              size="sm"
              onClick={() => generateAll.mutate()}
              disabled={generateAll.isPending}
              className="bg-mk-pink hover:bg-mk-pink-dark text-white"
            >
              {generateAll.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-1" />
              )}
              Generar Todos
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Generate all feedback */}
        {generateAll.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-700">
              Se encolaron <strong>{generateAll.data.queued}</strong> productos para generación de descripciones IA.
              Aparecerán en esta lista a medida que se procesen.
            </p>
          </div>
        )}
        {generateAll.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{generateAll.error?.message}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[300px] rounded-lg" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-gray-600">Error al cargar los productos pendientes.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                {search
                  ? "No se encontraron productos con ese filtro"
                  : "No hay productos pendientes de revisión"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {search
                  ? "Probá con otro término de búsqueda"
                  : "Todas las descripciones IA fueron revisadas"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Product cards */}
        {!isLoading &&
          !isError &&
          filtered.map((product) => (
            <PendingProductCard key={product.id} product={product} />
          ))}
      </div>
    </div>
  )
}
