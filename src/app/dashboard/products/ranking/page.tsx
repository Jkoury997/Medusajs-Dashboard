"use client"

import { Header } from "@/components/dashboard/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Sparkles } from "lucide-react"
import { RankingsView } from "./_components/rankings-view"
import { MetricsView } from "./_components/metrics-view"

export default function RankingPage() {
  return (
    <div>
      <Header
        title="Ranking de Productos"
        description="Rankings AI para colecciones y categorías"
      />

      <div className="p-6">
        <Tabs defaultValue="rankings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rankings">
              <Trophy className="w-4 h-4" />
              Rankings
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <Sparkles className="w-4 h-4" />
              Métricas IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rankings">
            <RankingsView />
          </TabsContent>

          <TabsContent value="metrics">
            <MetricsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
