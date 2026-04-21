"use client"

import { useState } from "react"
import {
  useSyncOrders,
  useSyncOrderTotals,
  useImportOrder,
  useRelinkResellersByEmail,
} from "@/hooks/use-resellers-fisicas"
import { Card, CardContent } from "@/components/ui/card"
import { Download, RefreshCw, FileText, Link2 } from "lucide-react"

interface ResultState {
  kind: "success" | "error"
  message: string
}

function ResultLine({ result }: { result: ResultState | null }) {
  if (!result) return null
  return (
    <p
      className={`text-xs ${
        result.kind === "error" ? "text-red-500" : "text-green-600"
      }`}
    >
      {result.message}
    </p>
  )
}

export default function ConfiguracionPage() {
  const [syncDays, setSyncDays] = useState(10)
  const [syncResult, setSyncResult] = useState<ResultState | null>(null)

  const [importOrderId, setImportOrderId] = useState("")
  const [importResult, setImportResult] = useState<ResultState | null>(null)

  const [totalsResult, setTotalsResult] = useState<ResultState | null>(null)

  const [relinkResult, setRelinkResult] = useState<ResultState | null>(null)
  const [relinkDetails, setRelinkDetails] = useState<
    Array<{ business_name: string; email: string; old_customer_id: string; new_customer_id: string }>
  >([])

  const syncOrders = useSyncOrders()
  const syncTotals = useSyncOrderTotals()
  const importOrder = useImportOrder()
  const relinkByEmail = useRelinkResellersByEmail()

  function handleSync() {
    setSyncResult(null)
    syncOrders.mutate(syncDays, {
      onSuccess: (r) =>
        setSyncResult({ kind: "success", message: r.message }),
      onError: (err) =>
        setSyncResult({ kind: "error", message: err.message }),
    })
  }

  function handleImport() {
    if (!importOrderId.trim()) return
    setImportResult(null)
    importOrder.mutate(importOrderId.trim(), {
      onSuccess: (r) => {
        setImportResult({
          kind: "success",
          message: `${r.message} — Revendedora: ${r.reseller.business_name}`,
        })
        setImportOrderId("")
      },
      onError: (err) =>
        setImportResult({ kind: "error", message: err.message }),
    })
  }

  function handleSyncTotals() {
    setTotalsResult(null)
    syncTotals.mutate(undefined, {
      onSuccess: (r) =>
        setTotalsResult({ kind: "success", message: r.message }),
      onError: (err) =>
        setTotalsResult({ kind: "error", message: err.message }),
    })
  }

  function handleRelink() {
    setRelinkResult(null)
    setRelinkDetails([])
    relinkByEmail.mutate(undefined, {
      onSuccess: (r) => {
        setRelinkResult({ kind: "success", message: r.message })
        setRelinkDetails(
          r.details.map((d) => ({
            business_name: d.business_name,
            email: d.email,
            old_customer_id: d.old_customer_id,
            new_customer_id: d.new_customer_id,
          }))
        )
      },
      onError: (err) =>
        setRelinkResult({ kind: "error", message: err.message }),
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Revendedoras Físicas — Configuración
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sincronización con Medusa y herramientas de mantenimiento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sync orders */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-800">
                Sincronizar pedidos desde Medusa
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Trae los pedidos recientes de Medusa y los asocia a cada
              revendedora aprobada. Es seguro repetir — los pedidos ya
              importados se saltean.
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Últimos</label>
              <input
                type="number"
                min={1}
                max={30}
                value={syncDays}
                onChange={(e) => setSyncDays(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm w-16"
              />
              <label className="text-sm text-gray-500">días</label>
              <button
                className="ml-auto px-3 py-1.5 text-sm bg-indigo-600 text-white rounded disabled:opacity-50"
                disabled={syncOrders.isPending}
                onClick={handleSync}
              >
                {syncOrders.isPending ? "Sincronizando..." : "Sincronizar"}
              </button>
            </div>
            <ResultLine result={syncResult} />
          </CardContent>
        </Card>

        {/* Import single order */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-800">
                Importar un pedido puntual
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Pegá el ID de una orden de Medusa (<code>order_xxx</code>) para
              importarla aunque sea más vieja que el rango del botón de
              arriba.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="order_01J..."
                value={importOrderId}
                onChange={(e) => setImportOrderId(e.target.value)}
                className="border rounded px-2 py-1 text-sm flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleImport()}
              />
              <button
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
                disabled={importOrder.isPending || !importOrderId.trim()}
                onClick={handleImport}
              >
                {importOrder.isPending ? "Importando..." : "Importar"}
              </button>
            </div>
            <ResultLine result={importResult} />
          </CardContent>
        </Card>

        {/* Sync totals */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-gray-800">
                Sincronizar totales de pedidos
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Recalcula el monto total de los pedidos que todavía no lo tienen
              cargado desde Medusa. Útil para que el umbral de visibilidad en
              el mapa quede bien calculado.
            </p>
            <button
              className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded disabled:opacity-50"
              disabled={syncTotals.isPending}
              onClick={handleSyncTotals}
            >
              {syncTotals.isPending
                ? "Sincronizando..."
                : "Sincronizar totales"}
            </button>
            <ResultLine result={totalsResult} />
          </CardContent>
        </Card>

        {/* Relink by email */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-gray-800">
                Re-vincular revendedoras por email
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Busca en Medusa el customer actual de cada revendedora según su
              email y actualiza el <code>medusa_customer_id</code> guardado si
              cambió. Sirve cuando una revendedora se registró antes con
              email+password y ahora entra con Google.
            </p>
            <button
              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded disabled:opacity-50"
              disabled={relinkByEmail.isPending}
              onClick={handleRelink}
            >
              {relinkByEmail.isPending
                ? "Re-vinculando..."
                : "Re-vincular por email"}
            </button>
            <ResultLine result={relinkResult} />
            {relinkDetails.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border rounded">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1 text-gray-600 font-medium">
                        Revendedora
                      </th>
                      <th className="text-left px-2 py-1 text-gray-600 font-medium">
                        Email
                      </th>
                      <th className="text-left px-2 py-1 text-gray-600 font-medium">
                        customer_id viejo → nuevo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {relinkDetails.map((d, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{d.business_name}</td>
                        <td className="px-2 py-1 text-gray-500">{d.email}</td>
                        <td className="px-2 py-1 font-mono text-[10px] text-gray-500">
                          {d.old_customer_id} → {d.new_customer_id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
