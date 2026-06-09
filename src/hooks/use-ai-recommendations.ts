"use client"

import { useMutation } from "@tanstack/react-query"

export function useAIRecommendations() {
  return useMutation({
    mutationFn: async ({
      metrics,
      provider,
      focusInstruction,
    }: {
      metrics: Record<string, unknown>
      provider: "anthropic" | "openai"
      focusInstruction?: string
    }) => {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics, provider, focusInstruction }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const raw = body?.error ?? body
        const msg =
          typeof raw === "string"
            ? raw
            : raw
              ? JSON.stringify(raw)
              : `Error ${res.status} al generar el análisis`
        throw new Error(msg)
      }

      const data = await res.json()
      return data.recommendations as string
    },
  })
}
