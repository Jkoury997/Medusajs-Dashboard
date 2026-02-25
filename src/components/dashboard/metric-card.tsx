import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: React.ReactNode
  subtitle?: string
}

export function MetricCard({ title, value, change, changeType = "neutral", icon, subtitle }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {icon && <span className="text-2xl">{icon}</span>}
        </div>
        <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
        {change && (
          <p
            className={cn(
              "text-sm mt-1",
              changeType === "positive" && "text-green-600",
              changeType === "negative" && "text-red-600",
              changeType === "neutral" && "text-gray-500"
            )}
          >
            {change} vs período anterior
          </p>
        )}
      </CardContent>
    </Card>
  )
}
