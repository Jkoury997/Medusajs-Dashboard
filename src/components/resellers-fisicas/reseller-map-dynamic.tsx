"use client"

import dynamic from "next/dynamic"

// Leaflet touches the DOM on import, so we must lazy-load it in the browser
// only. This wrapper is what feature pages should import.
export const ResellerMapDynamic = dynamic(
  () => import("./reseller-map").then((m) => m.ResellerMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[560px] rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        Cargando mapa...
      </div>
    ),
  }
)
