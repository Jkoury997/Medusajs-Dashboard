"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import type { AIPageContext } from "@/lib/ai-prompts"

interface AICacheEntry {
  content: string
  timestamp: number
}

interface AICacheContextType {
  getResult: (page: AIPageContext) => AICacheEntry | null
  setResult: (page: AIPageContext, content: string) => void
  clearResult: (page: AIPageContext) => void
}

const AICacheContext = createContext<AICacheContextType | null>(null)

export function AICacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Record<string, AICacheEntry>>({})

  const getResult = useCallback(
    (page: AIPageContext) => cache[page] || null,
    [cache]
  )

  const setResult = useCallback(
    (page: AIPageContext, content: string) => {
      setCache((prev) => ({
        ...prev,
        [page]: { content, timestamp: Date.now() },
      }))
    },
    []
  )

  const clearResult = useCallback((page: AIPageContext) => {
    setCache((prev) => {
      const next = { ...prev }
      delete next[page]
      return next
    })
  }, [])

  return (
    <AICacheContext.Provider value={{ getResult, setResult, clearResult }}>
      {children}
    </AICacheContext.Provider>
  )
}

export function useAICache() {
  const ctx = useContext(AICacheContext)
  if (!ctx) throw new Error("useAICache must be used within AICacheProvider")
  return ctx
}
