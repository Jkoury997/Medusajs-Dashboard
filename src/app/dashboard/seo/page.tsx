"use client"

import { useState } from "react"
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
import { SeoOverviewTab } from "./_components/seo-overview-tab"
import { SeoProposalsTab } from "./_components/seo-proposals-tab"
import { SeoRegenerateTab } from "./_components/seo-regenerate-tab"
import { SeoSearchInsightsTab } from "./_components/seo-search-insights-tab"
import { SeoSynonymsTab } from "./_components/seo-synonyms-tab"
import { SeoConfigTab } from "./_components/seo-config-tab"

const ALL = "all"

export default function SeoAgentPage() {
  const { data: channels = [] } = useSalesChannels()
  const [channel, setChannel] = useState<string>(ALL)
  const salesChannelId = channel === ALL ? undefined : channel

  return (
    <>
      <Header
        title="SEO"
        description="Agente de IA de SEO: cobertura del catálogo, propuestas, regeneración, búsquedas y synonyms."
      />
      <div className="p-6 space-y-4">
        {/* Selector de marca (sales channel) — filtra todas las pestañas. */}
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

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="proposals">Propuestas</TabsTrigger>
            <TabsTrigger value="regenerate">Regenerar</TabsTrigger>
            <TabsTrigger value="insights">Búsquedas</TabsTrigger>
            <TabsTrigger value="synonyms">Synonyms</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            <SeoOverviewTab salesChannelId={salesChannelId} />
          </TabsContent>
          <TabsContent value="proposals" className="mt-6">
            <SeoProposalsTab salesChannelId={salesChannelId} />
          </TabsContent>
          <TabsContent value="regenerate" className="mt-6">
            <SeoRegenerateTab salesChannelId={salesChannelId} />
          </TabsContent>
          <TabsContent value="insights" className="mt-6">
            <SeoSearchInsightsTab salesChannelId={salesChannelId} />
          </TabsContent>
          <TabsContent value="synonyms" className="mt-6">
            <SeoSynonymsTab salesChannelId={salesChannelId} />
          </TabsContent>
          <TabsContent value="config" className="mt-6">
            <SeoConfigTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
