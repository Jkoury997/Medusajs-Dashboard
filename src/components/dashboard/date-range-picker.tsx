"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type DateRange = {
  from: Date
  to: Date
  label: string
}

const presets: { label: string; days: number }[] = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
  { label: "12 meses", days: 365 },
]

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex gap-2">
      {presets.map((preset) => {
        const isActive = value.label === preset.label
        return (
          <Button
            key={preset.label}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const to = new Date()
              const from = new Date()
              from.setDate(from.getDate() - preset.days)
              onChange({ from, to, label: preset.label })
            }}
          >
            {preset.label}
          </Button>
        )
      })}
    </div>
  )
}

export function getDefaultDateRange(): DateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return { from, to, label: "30 días" }
}
