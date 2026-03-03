"use client"

import { Header } from "@/components/dashboard/header"
import { AbandonedCartsSection } from "@/components/email-marketing/abandoned-carts-section"

export default function CarritosAbandonadosPage() {
  return (
    <div>
      <Header
        title="Carritos Abandonados"
        description="Seguimiento, recuperacion automatica y envio de emails para carritos abandonados"
      />
      <div className="p-6">
        <AbandonedCartsSection />
      </div>
    </div>
  )
}
