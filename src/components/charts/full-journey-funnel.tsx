"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const JOURNEY_COLORS = [
  "#ff75a8", "#ff8fb8", "#ffaacb", "#ffc4dd",
  "#e8508a", "#ff75a8", "#ff8fb8", "#ffaacb", "#ffc4dd",
]

interface JourneyStep {
  name: string
  count: number
  source: string
}

interface FullJourneyFunnelProps {
  steps: JourneyStep[]
}

export function FullJourneyFunnel({ steps }: FullJourneyFunnelProps) {
  if (steps.length === 0) return null

  const maxCount = steps[0].count

  const sourceBadge = (source: string) => {
    switch (source) {
      case "GA4":
        return "bg-purple-100 text-purple-700"
      case "Events":
        return "bg-blue-100 text-blue-700"
      case "Medusa":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Viaje Completo del Cliente
          <span className="text-sm font-normal text-gray-500 ml-2">
            (GA4 + Storefront + Medusa)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-1">
          {steps.map((step, index) => {
            const widthPercent = maxCount > 0
              ? Math.max(18, (step.count / maxCount) * 100)
              : 100
            const dropPercent = index > 0 && steps[index - 1].count > 0
              ? ((1 - step.count / steps[index - 1].count) * 100).toFixed(1)
              : null
            const color = JOURNEY_COLORS[index % JOURNEY_COLORS.length]

            return (
              <div key={index} className="w-full flex flex-col items-center">
                <div
                  className="relative flex items-center justify-between px-4 py-2.5 rounded-sm transition-all"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: color,
                    minHeight: 40,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium truncate">
                      {step.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sourceBadge(step.source)}`}>
                      {step.source}
                    </span>
                  </div>
                  <span className="text-white text-sm font-bold ml-2 whitespace-nowrap">
                    {step.count.toLocaleString("es-AR")}
                  </span>
                </div>
                {dropPercent && parseFloat(dropPercent) > 0 && (
                  <span className="text-xs text-gray-400 my-0.5">
                    ▼ -{dropPercent}%
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {steps.length >= 2 && (
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              Conversión total:{" "}
              <strong className="text-mk-pink">
                {maxCount > 0
                  ? ((steps[steps.length - 1].count / maxCount) * 100).toFixed(2)
                  : "0"}
                %
              </strong>
              <span className="text-gray-400 ml-1">
                ({steps[0].name} → {steps[steps.length - 1].name})
              </span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
