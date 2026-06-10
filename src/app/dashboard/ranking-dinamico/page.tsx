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
import { RankingOverviewTab } from "./_components/ranking-overview-tab"
import { RankingListTab } from "./_components/ranking-list-tab"
import { RankingRunsTab } from "./_components/ranking-runs-tab"
import { RankingTriggerTab } from "./_components/ranking-trigger-tab"
import { RankingConfigTab } from "./_components/ranking-config-tab"

const ALL = "all"

export default function RankingDinamicoPage() {
  const { data: channels = [] } = useSalesChannels()
  const [channel, setChannel] = useState<string>(ALL)
  const salesChannelId = channel === ALL ? undefined : channel

  const channelName = useMemo(() => {
    const map = new Map(channels.map((c) => [c.id, c.name]))
    return (id: string) => map.get(id) ?? id
  }, [channels])

  return (
    <>
      <Header
        title="Ranking Dinámico IA"
        description="Orden de productos por IA: cobertura, revenue atribuido, recompute y configuración."
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

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="runs">Runs</TabsTrigger>
            <TabsTrigger value="trigger">Recalcular</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            <RankingOverviewTab salesChannelId={salesChannelId} channelName={channelName} />
          </TabsContent>
          <TabsContent value="rankings" className="mt-6">
            <RankingListTab salesChannelId={salesChannelId} channelName={channelName} />
          </TabsContent>
          <TabsContent value="runs" className="mt-6">
            <RankingRunsTab />
          </TabsContent>
          <TabsContent value="trigger" className="mt-6">
            <RankingTriggerTab salesChannelId={salesChannelId} channelName={channelName} />
          </TabsContent>
          <TabsContent value="config" className="mt-6">
            <RankingConfigTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
