"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SearchGapsProps {
  topSearches: { term: string; count: number; results_avg: number }[]
  noResults: { term: string; count: number }[]
  noResultsRate: string
}

export function SearchGapsCard({ topSearches, noResults, noResultsRate }: SearchGapsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          🔍 Búsquedas y Oportunidades de Catálogo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {noResults.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-red-600">Sin Resultados</h4>
              <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                {noResultsRate}% de búsquedas
              </span>
            </div>
            <div className="space-y-1">
              {noResults.slice(0, 8).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700 truncate max-w-[180px]">&ldquo;{item.term}&rdquo;</span>
                  <span className="text-gray-500 ml-2">{item.count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {topSearches.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Top Búsquedas</h4>
            <div className="space-y-1">
              {topSearches.slice(0, 8).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700 truncate max-w-[180px]">&ldquo;{item.term}&rdquo;</span>
                  <span className="text-gray-500 ml-2">{item.count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {noResults.length === 0 && topSearches.length === 0 && (
          <p className="text-sm text-gray-400">No hay datos de búsquedas en el período</p>
        )}
      </CardContent>
    </Card>
  )
}
