"use client"

import { useMemo, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSalesChannels } from "@/hooks/use-email-intelligence"
import { GeoGuidesTab } from "./_components/geo-guides-tab"
import { GeoGenerateTab } from "./_components/geo-generate-tab"
import { GeoConfigTab } from "./_components/geo-config-tab"

const ALL = "all"

export default function GeoPage() {
  const { data: channels = [] } = useSalesChannels()
  const [channel, setChannel] = useState<string>(ALL)
  const salesChannelId = channel === ALL ? undefined : channel

  const channelName = useMemo(() => {
    const map = new Map(channels.map((c) => [c.id, c.name]))
    return salesChannelId ? map.get(salesChannelId) : undefined
  }, [channels, salesChannelId])

  return (
    <>
      <Header
        title="GEO / Guías"
        description="Guías citables por IA (ChatGPT, Perplexity, AI Overviews): generación, revisión y publicación."
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Marca:</span>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Todas las marcas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las marcas</SelectItem>
              {channels.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="guides">
          <TabsList>
            <TabsTrigger value="guides">Guías</TabsTrigger>
            <TabsTrigger value="generate">Generar</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>
          <TabsContent value="guides" className="mt-6">
            <GeoGuidesTab salesChannelId={salesChannelId} />
          </TabsContent>
          <TabsContent value="generate" className="mt-6">
            <GeoGenerateTab salesChannelId={salesChannelId} channelName={channelName} />
          </TabsContent>
          <TabsContent value="config" className="mt-6">
            <GeoConfigTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
