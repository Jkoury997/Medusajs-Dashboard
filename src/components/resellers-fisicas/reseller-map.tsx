"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { ResellerMapItem } from "@/hooks/use-resellers-fisicas"

// Argentina default center (Buenos Aires). Used as fallback when no resellers
// have coordinates yet so the map still renders something usable.
const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816]
const DEFAULT_ZOOM = 5

type MarkerVariant = "visible" | "eligible" | "disabled" | "pending" | "rejected"

const MARKER_COLORS: Record<MarkerVariant, string> = {
  visible: "#16a34a", // green - shown on public map
  eligible: "#2563eb", // blue - approved + located but not on public map
  disabled: "#f97316", // orange - admin-disabled
  pending: "#eab308", // yellow - waiting approval
  rejected: "#6b7280", // gray - rejected
}

function variantForReseller(r: ResellerMapItem): MarkerVariant {
  if (r.visible_on_map === "compras") return "visible"
  if (r.status === "pendiente") return "pending"
  if (r.status === "rechazada") return "rejected"
  if (r.map_enabled === false) return "disabled"
  return "eligible"
}

function buildIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "reseller-marker",
    html: `<span style="
      display:inline-block;
      width:20px;
      height:20px;
      border-radius:50%;
      background:${color};
      border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,0.35);
    "></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  })
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
  }, [map, points])
  return null
}

const TYPE_LABELS: Record<string, string> = {
  tienda_fisica: "Tienda Física",
  redes: "Solo Redes",
  distribuidor: "Distribuidor",
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

interface ResellerMapProps {
  resellers: ResellerMapItem[]
  onToggleMapEnabled?: (id: string, enabled: boolean) => void
  togglingId?: string | null
}

export function ResellerMap({ resellers, onToggleMapEnabled, togglingId }: ResellerMapProps) {
  const mapRef = useRef<L.Map | null>(null)

  const withLocation = useMemo(
    () => resellers.filter((r) => r.location?.coordinates),
    [resellers]
  )

  const points: [number, number][] = useMemo(
    () =>
      withLocation.map((r) => {
        const [lng, lat] = r.location!.coordinates
        return [lat, lng]
      }),
    [withLocation]
  )

  // Pre-build icons once per color so every marker doesn't re-create one.
  const icons = useMemo(() => {
    const out: Record<MarkerVariant, L.DivIcon> = {} as Record<MarkerVariant, L.DivIcon>
    ;(Object.keys(MARKER_COLORS) as MarkerVariant[]).forEach((v) => {
      out[v] = buildIcon(MARKER_COLORS[v])
    })
    return out
  }, [])

  return (
    <div className="w-full h-[560px] rounded-lg overflow-hidden border border-gray-200 relative">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        ref={(instance) => {
          if (instance) mapRef.current = instance
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {withLocation.map((r) => {
          const [lng, lat] = r.location!.coordinates
          const variant = variantForReseller(r)
          return (
            <Marker key={r._id} position={[lat, lng]} icon={icons[variant]}>
              <Popup minWidth={240}>
                <div className="space-y-1 text-[13px] leading-tight">
                  <Link
                    href={`/dashboard/resellers-fisicas/lista/${r._id}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {r.business_name}
                  </Link>
                  <div className="text-gray-500">{TYPE_LABELS[r.type] ?? r.type}</div>
                  {r.approximate_zone && (
                    <div className="text-gray-500">Zona: {r.approximate_zone}</div>
                  )}
                  {r.address && <div className="text-gray-500">{r.address}</div>}

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-2 border-t mt-2">
                    <div>
                      <div className="text-[10px] uppercase text-gray-400">Stock</div>
                      <div className="font-medium">{r.total_stock}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-gray-400">Productos</div>
                      <div className="font-medium">{r.product_count}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-gray-400">Ventas mes</div>
                      <div className="font-medium">{r.sales_this_month}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-gray-400">Facturación</div>
                      <div className="font-medium">{formatCurrency(r.revenue_this_month || 0)}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t mt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Estado</span>
                      <span className="font-medium capitalize">{r.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Visible en mapa público</span>
                      <span
                        className={`font-medium ${
                          r.visible_on_map ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {r.visible_on_map ? "Sí" : "No"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Habilitada por admin</span>
                      <span
                        className={`font-medium ${
                          r.map_enabled ? "text-green-600" : "text-orange-600"
                        }`}
                      >
                        {r.map_enabled ? "Sí" : "No"}
                      </span>
                    </div>
                  </div>

                  {onToggleMapEnabled && (
                    <button
                      className={`mt-2 w-full px-2 py-1.5 text-xs rounded font-medium transition disabled:opacity-50 ${
                        r.map_enabled
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                      disabled={togglingId === r._id}
                      onClick={() => onToggleMapEnabled(r._id, !r.map_enabled)}
                    >
                      {togglingId === r._id
                        ? "Actualizando..."
                        : r.map_enabled
                        ? "Deshabilitar en mapa"
                        : "Habilitar en mapa"}
                    </button>
                  )}

                  {r.whatsapp && (
                    <a
                      href={`https://wa.me/${r.whatsapp.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center mt-1 px-2 py-1 text-xs border border-green-600 text-green-700 rounded hover:bg-green-50"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur px-3 py-2 rounded-md shadow border border-gray-200 text-[11px] space-y-1">
        <div className="font-semibold text-gray-700 mb-1">Referencias</div>
        {(
          [
            ["visible", "En mapa público"],
            ["eligible", "Aprobada, no visible"],
            ["disabled", "Deshabilitada por admin"],
            ["pending", "Pendiente"],
            ["rejected", "Rechazada"],
          ] as const
        ).map(([variant, label]) => (
          <div key={variant} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full border border-white shadow"
              style={{ background: MARKER_COLORS[variant] }}
            />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
