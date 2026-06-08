"use client"

import { Header } from "@/components/dashboard/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "./_components/overview-tab"
import { CampaignsTab } from "./_components/campaigns-tab"
import { VariantsTab } from "./_components/variants-tab"
import { SendsTab } from "./_components/sends-tab"

export default function EmailIntelligencePage() {
  return (
    <>
      <Header
        title="Email Intelligence"
        description="Agente de IA de campañas de email: configuración, métricas, variantes A/B y envíos."
      />
      <div className="p-6">
        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns">Configuración</TabsTrigger>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="variants">Variantes</TabsTrigger>
            <TabsTrigger value="sends">Envíos</TabsTrigger>
          </TabsList>
          <TabsContent value="campaigns" className="mt-6">
            <CampaignsTab />
          </TabsContent>
          <TabsContent value="overview" className="mt-6">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="variants" className="mt-6">
            <VariantsTab />
          </TabsContent>
          <TabsContent value="sends" className="mt-6">
            <SendsTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
