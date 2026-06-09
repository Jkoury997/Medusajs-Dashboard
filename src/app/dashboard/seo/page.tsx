"use client"

import { Header } from "@/components/dashboard/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SeoOverviewTab } from "./_components/seo-overview-tab"
import { SeoProposalsTab } from "./_components/seo-proposals-tab"
import { SeoRegenerateTab } from "./_components/seo-regenerate-tab"
import { SeoConfigTab } from "./_components/seo-config-tab"

export default function SeoAgentPage() {
  return (
    <>
      <Header
        title="SEO"
        description="Agente de IA de SEO: cobertura del catálogo, propuestas, regeneración y configuración."
      />
      <div className="p-6">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="proposals">Propuestas</TabsTrigger>
            <TabsTrigger value="regenerate">Regenerar</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            <SeoOverviewTab />
          </TabsContent>
          <TabsContent value="proposals" className="mt-6">
            <SeoProposalsTab />
          </TabsContent>
          <TabsContent value="regenerate" className="mt-6">
            <SeoRegenerateTab />
          </TabsContent>
          <TabsContent value="config" className="mt-6">
            <SeoConfigTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
