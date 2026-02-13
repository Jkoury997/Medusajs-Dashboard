"use client"

import { useMutation } from "@tanstack/react-query"

export function useAIRecommendations() {
  return useMutation({
    mutationFn: async ({
      metrics,
      provider,
      focusInstruction,
    }: {
      metrics: Record<string, any>
      provider: "anthropic" | "openai"
      focusInstruction?: string
    }) => {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics, provider, focusInstruction }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to get recommendations")
      }

      const data = await res.json()
      return data.recommendations as string
    },
  })
}
