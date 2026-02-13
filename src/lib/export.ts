/**
 * Utilidades para exportar datos a CSV compatible con Excel (UTF-8 BOM + separador ;)
 */

interface CSVColumn<T> {
  header: string
  accessor: (row: T) => string | number | null | undefined
}

/**
 * Genera un archivo CSV y lo descarga automáticamente.
 * Usa UTF-8 BOM para que Excel abra bien los acentos.
 * Usa ; como separador para compatibilidad con Excel en español.
 */
export function exportToCSV<T>(
  data: T[],
  columns: CSVColumn<T>[],
  filename: string
) {
  if (data.length === 0) return

  // Headers
  const headers = columns.map((col) => escapeCSV(col.header)).join(";")

  // Rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = col.accessor(row)
        if (value === null || value === undefined) return ""
        return escapeCSV(String(value))
      })
      .join(";")
  )

  // UTF-8 BOM para que Excel reconozca la codificación
  const BOM = "\uFEFF"
  const csvContent = BOM + [headers, ...rows].join("\n")

  // Crear blob y descargar
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Escapa un valor para CSV: si contiene ; o " o salto de línea, lo encierra en comillas.
 */
function escapeCSV(value: string): string {
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Formatea una fecha para CSV (DD/MM/YYYY)
 */
export function formatDateCSV(date: string | Date | null): string {
  if (!date) return ""
  const d = new Date(date)
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`
}

/**
 * Formatea un número como moneda para CSV (sin símbolo, con punto de miles)
 */
export function formatCurrencyCSV(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
