"use client"

import { AuthProvider } from "@/providers/auth-provider"
import { QueryProvider } from "@/providers/query-provider"
import { AICacheProvider } from "@/providers/ai-cache-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <AICacheProvider>{children}</AICacheProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
