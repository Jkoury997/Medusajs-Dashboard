"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useProductSearch,
  useRegenerateSeo,
  useCategorySearch,
  useRegenerateCategorySeo,
} from "@/hooks/use-seo-agent"
import { EntityToggle } from "./entity-toggle"
import { SeoBulkRegenerateDialog } from "./seo-bulk-regenerate-dialog"
import type { EntityKind } from "@/types/seo-agent"
import { Search, Sparkles, Loader2, CheckCircle2, Layers } from "lucide-react"

type AiStatus = "none" | "pending_review" | "approved"

const AI_STATUS_BADGE: Record<
  AiStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  approved: { label: "Con SEO", variant: "secondary" },
  pending_review: { label: "Pendiente", variant: "default" },
  none: { label: "Sin SEO", variant: "outline" },
}

interface SearchRow {
  id: string
  title: string
  handle: string
  ai_status: AiStatus
  subtitle: string | null
}

export function SeoRegenerateTab({ salesChannelId }: { salesChannelId?: string }) {
  const [entity, setEntity] = useState<EntityKind>("product")
  const [query, setQuery] = useState("")
  const [lastDone, setLastDone] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const productSearch = useProductSearch(entity === "product" ? query : "")
  const categorySearch = useCategorySearch(entity === "category" ? query : "")
  const regenerateProduct = useRegenerateSeo()
  const regenerateCategory = useRegenerateCategorySeo()

  const isLoading = entity === "product" ? productSearch.isLoading : categorySearch.isLoading
  const regenerate = entity === "product" ? regenerateProduct : regenerateCategory
  const pendingId =
    entity === "product"
      ? regenerateProduct.variables?.productId
      : regenerateCategory.variables?.categoryId

  const rows: SearchRow[] =
    entity === "product"
      ? (productSearch.data ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          handle: p.handle,
          ai_status: p.ai_status,
          subtitle: p.sales_channel_name,
        }))
      : (categorySearch.data ?? []).map((c) => ({
          id: c.id,
          title: c.name,
          handle: c.handle,
          ai_status: c.ai_status,
          subtitle: `${c.products_count} productos`,
        }))

  const handleRegenerate = (id: string, hasAi: boolean) => {
    setLastDone(null)
    const onSuccess = () => setLastDone(id)
    if (entity === "product") {
      regenerateProduct.mutate(
        { productId: id, mode: hasAi ? "regenerate" : "create", force: true },
        { onSuccess },
      )
    } else {
      regenerateCategory.mutate(
        {
          categoryId: id,
          mode: hasAi ? "regenerate" : "create",
          force: true,
          salesChannelId,
        },
        { onSuccess },
      )
    }
  }

  const noun = entity === "category" ? "categoría" : "producto"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <EntityToggle
          value={entity}
          onChange={(v) => {
            setEntity(v)
            setQuery("")
            setLastDone(null)
          }}
        />
        <Button variant="outline" onClick={() => setBulkOpen(true)}>
          <Layers className="h-4 w-4" /> Regenerar todo lo que falta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Regenerar SEO de {entity === "category" ? "una categoría" : "un producto"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Buscá {entity === "category" ? "una categoría" : "un producto"} y dispará la
            generación de SEO por IA. Se crea una propuesta que vas a poder revisar en la
            pestaña “Propuestas”.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o handle (mín. 2 caracteres)…"
              className="pl-9"
            />
          </div>

          {query.trim().length < 2 ? (
            <p className="text-xs text-gray-400">Escribí al menos 2 caracteres para buscar.</p>
          ) : isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">Sin resultados para “{query}”.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => {
                const hasAi = r.ai_status !== "none"
                const justDone = lastDone === r.id
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{r.title}</span>
                        <Badge variant={AI_STATUS_BADGE[r.ai_status].variant}>
                          {AI_STATUS_BADGE[r.ai_status].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {r.handle}
                        {r.subtitle ? ` · ${r.subtitle}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={justDone ? "secondary" : "default"}
                      disabled={regenerate.isPending}
                      onClick={() => handleRegenerate(r.id, hasAi)}
                    >
                      {regenerate.isPending && pendingId === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : justDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {justDone ? "En cola (~1 min)" : "Regenerar"}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {regenerate.isError && (
            <p className="text-sm text-red-600">{(regenerate.error as Error).message}</p>
          )}
          <p className="text-[11px] text-gray-400">
            La generación corre en segundo plano (≈1 min): la propuesta de cada {noun} aparece
            en la pestaña “Propuestas” al terminar. La generación masiva respeta el presupuesto
            mensual configurado en “Configuración”.
          </p>
        </CardContent>
      </Card>

      <SeoBulkRegenerateDialog
        entity={entity}
        salesChannelId={salesChannelId}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
      />
    </div>
  )
}
