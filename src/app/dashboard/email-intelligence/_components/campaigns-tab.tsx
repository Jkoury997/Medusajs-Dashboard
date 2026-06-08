"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useEmailCampaigns,
  useSalesChannels,
} from "@/hooks/use-email-intelligence"
import { CampaignConfigCard } from "./campaign-config-card"

export function CampaignsTab() {
  const { data, isLoading, error } = useEmailCampaigns()
  // Los canales son opcionales: si fallan, igual se puede configurar lo global.
  const { data: channels } = useSalesChannels()

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-red-600">
          No se pudieron cargar las campañas. {(error as Error).message}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
              <div className="grid grid-cols-3 gap-4 mt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const campaigns = data?.campaigns ?? []

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Configurá cada campaña: encendido/apagado, topes de envío, umbral de CTR,
        condiciones de disparo y habilitación por marca.
      </p>
      {campaigns.map((c) => (
        <CampaignConfigCard key={c.id} campaign={c} channels={channels ?? []} />
      ))}
    </div>
  )
}
