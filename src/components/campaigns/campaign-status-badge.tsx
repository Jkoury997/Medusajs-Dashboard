"use client"

import { Badge } from "@/components/ui/badge"
import type { ManualCampaignStatus } from "@/types/campaigns"

const STATUS_CONFIG: Record<ManualCampaignStatus, { label: string; className: string }> = {
  draft: { label: "Borrador", className: "bg-gray-100 text-gray-700" },
  scheduled: { label: "Programada", className: "bg-blue-100 text-blue-700" },
  sending: { label: "Enviando", className: "bg-yellow-100 text-yellow-700" },
  sent: { label: "Enviada", className: "bg-green-100 text-green-700" },
  paused: { label: "Pausada", className: "bg-orange-100 text-orange-700" },
  cancelled: { label: "Cancelada", className: "bg-red-100 text-red-700" },
}

export function CampaignStatusBadge({ status }: { status: ManualCampaignStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  return <Badge className={config.className}>{config.label}</Badge>
}
