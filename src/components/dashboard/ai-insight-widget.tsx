"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAIRecommendations } from "@/hooks/use-ai-recommendations"
import { useAICache } from "@/providers/ai-cache-provider"
import { PAGE_PROMPTS, type AIPageContext } from "@/lib/ai-prompts"
import { markdownToHtml } from "@/lib/markdown"

interface AIInsightWidgetProps {
  pageContext: AIPageContext
  metricsBuilder: () => Record<string, any> | null
  isDataLoading: boolean
}

export function AIInsightWidget({
  pageContext,
  metricsBuilder,
  isDataLoading,
}: AIInsightWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const aiMutation = useAIRecommendations()
  const { getResult, setResult, clearResult } = useAICache()

  const config = PAGE_PROMPTS[pageContext]
  const cached = getResult(pageContext)

  const handleGenerate = useCallback(() => {
    const metrics = metricsBuilder()
    if (!metrics) return

    setIsExpanded(true)
    aiMutation.mutate(
      {
        metrics,
        provider: "openai",
        focusInstruction: config.focusInstruction,
      },
      {
        onSuccess: (content) => {
          setResult(pageContext, content)
        },
      }
    )
  }, [metricsBuilder, pageContext, aiMutation, setResult, config.focusInstruction])

  const handleRegenerate = useCallback(() => {
    clearResult(pageContext)
    handleGenerate()
  }, [clearResult, pageContext, handleGenerate])

  const handleCopy = useCallback(() => {
    const content = cached?.content || ""
    if (!content) return
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [cached])

  const content = cached?.content || null
  const isLoading = aiMutation.isPending

  // Si hay contenido cacheado, mostrar expandido automáticamente
  const showExpanded = isExpanded || !!content

  return (
    <Card className="border-mk-pink-border bg-mk-pink-bg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span>{config.icon}</span>
            <span>Insight IA: {config.label}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {content && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="text-xs h-7"
                >
                  {copied ? "✓ Copiado" : "Copiar"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!showExpanded)}
                  className="text-xs h-7"
                >
                  {showExpanded ? "▲ Colapsar" : "▼ Expandir"}
                </Button>
              </>
            )}
            {!content && !isLoading && (
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={isDataLoading || isLoading}
                className="h-8"
              >
                🤖 Generar Insight
              </Button>
            )}
            {content && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isLoading}
                className="h-8 text-xs"
              >
                Regenerar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isLoading && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/6" />
          </div>
        </CardContent>
      )}

      {!isLoading && content && showExpanded && (
        <CardContent className="pt-0">
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
          />
          {cached && (
            <p className="text-xs text-gray-400 mt-3">
              Generado: {new Date(cached.timestamp).toLocaleString("es-AR")}
            </p>
          )}
        </CardContent>
      )}

      {aiMutation.isError && (
        <CardContent className="pt-0">
          <p className="text-sm text-red-500">
            Error al generar insight: {aiMutation.error?.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            className="mt-2"
          >
            Reintentar
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
