"use client"

import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"

interface AdminUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

export function useAdminUser() {
  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/users/me", {
        method: "GET",
      })
      return (response as { user: AdminUser }).user
    },
    staleTime: 10 * 60 * 1000, // 10 min — la identidad no cambia durante la sesión
  })
}
