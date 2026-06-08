"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useProductSearch, useRegenerateSeo } from "@/hooks/use-seo-agent"
import type { ProductSearchItem } from "@/types/seo-agent"
import { Search, Sparkles, Loader2, CheckCircle2 } from "lucide-react"

const AI_STATUS_BADGE: Record<
  ProductSearchItem["ai_status"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  approved: { label: "Con SEO", variant: "secondary" },
  pending_review: { label: "Pendiente", variant: "default" },
  none: { label: "Sin SEO", variant: "outline" },
}

export function SeoRegenerateTab() {
  const [query, setQuery] = useState("")
  const { data: products, isLoading } = useProductSearch(query)
  const regenerate = useRegenerateSeo()
  const [lastDone, setLastDone] = useState<string | null>(null)

  const handleRegenerate = (productId: string, hasAi: boolean) => {
    setLastDone(null)
    regenerate.mutate(
      { productId, mode: hasAi ? "regenerate" : "create", force: true },
      { onSuccess: () => setLastDone(productId) },
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regenerar SEO de un producto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Buscá un producto y dispará la generación de SEO por IA. Se crea una
            propuesta que vas a poder revisar en la pestaña “Propuestas”.
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
          ) : (products ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-4">Sin resultados para “{query}”.</p>
          ) : (
            <div className="space-y-2">
              {products!.map((p) => {
                const hasAi = p.ai_status !== "none"
                const justDone = lastDone === p.id
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{p.title}</span>
                        <Badge variant={AI_STATUS_BADGE[p.ai_status].variant}>
                          {AI_STATUS_BADGE[p.ai_status].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {p.handle}
                        {p.sales_channel_name ? ` · ${p.sales_channel_name}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={justDone ? "secondary" : "default"}
                      disabled={regenerate.isPending}
                      onClick={() => handleRegenerate(p.id, hasAi)}
                    >
                      {regenerate.isPending && regenerate.variables?.productId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : justDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {justDone ? "Propuesta creada" : "Regenerar"}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {regenerate.isError && (
            <p className="text-sm text-red-600">
              {(regenerate.error as Error).message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
