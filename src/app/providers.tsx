"use client"

import { AuthProvider } from "@/providers/auth-provider"
import { PermissionsProvider } from "@/providers/permissions-provider"
import { QueryProvider } from "@/providers/query-provider"
import { AICacheProvider } from "@/providers/ai-cache-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <QueryProvider>
          <AICacheProvider>{children}</AICacheProvider>
        </QueryProvider>
      </PermissionsProvider>
    </AuthProvider>
  )
}
