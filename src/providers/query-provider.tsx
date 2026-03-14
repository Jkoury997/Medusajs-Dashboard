"use client"

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { useAuth } from "@/providers/auth-provider"

function isUnauthorizedError(error: unknown): boolean {
  // Check error message
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes("401") || msg.includes("unauthorized")) return true
  }
  // Check status property (Medusa SDK FetchError y otros)
  const err = error as Record<string, unknown> | null
  if (err && (err.status === 401 || err.statusCode === 401)) return true
  return false
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const { logout } = useAuth()

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: (failureCount, error) => {
              // No reintentar si es error de autenticación
              if (isUnauthorizedError(error)) return false
              return failureCount < 1
            },
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            if (isUnauthorizedError(error)) {
              logout()
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            if (isUnauthorizedError(error)) {
              logout()
            }
          },
        }),
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
