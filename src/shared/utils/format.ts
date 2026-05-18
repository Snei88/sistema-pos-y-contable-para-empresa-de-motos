// ============================================================
// UTILIDADES DE FORMATO — Colombia / LATAM
// ============================================================

/**
 * Formatea un número como moneda colombiana (COP)
 * Ej: 15000 → "$ 15.000"
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formatea número con separadores de miles
 * Ej: 15000 → "15.000"
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-CO').format(n)
}

/**
 * Formatea porcentaje
 * Ej: 0.18 → "18%"
 */
export function formatPercent(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`
}

/**
 * Formatea variación con signo y color hint
 * Ej: 0.18 → "+18.0%" | -0.05 → "-5.0%"
 */
export function formatVariation(n: number): { text: string; positive: boolean } {
  const positive = n >= 0
  return {
    text: `${positive ? '+' : ''}${(n * 100).toFixed(1)}%`,
    positive,
  }
}

/**
 * Formatea fecha ISO a dd/MM/yyyy
 */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Bogota',
  })
}

/**
 * Formatea fecha+hora
 */
export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })
}

/**
 * Formatea hora HH:mm
 */
export function formatTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })
}

/**
 * Fecha actual en formato ISO (Bogotá)
 */
export function nowISO(): string {
  return new Date().toISOString()
}

/**
 * Fecha de hoy como string YYYY-MM-DD en hora Bogotá
 */
export function todayString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

/**
 * Texto legible de hace cuánto tiempo
 * Ej: "hace 5 minutos"
 */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

/**
 * Truncar texto largo
 */
export function truncate(text: string, maxLength = 30): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Generar número de factura
 * Ej: "FAC-20240421-0001"
 */
export function generateInvoiceNumber(sequence: number): string {
  const date = todayString().replace(/-/g, '')
  return `FAC-${date}-${String(sequence).padStart(4, '0')}`
}

/**
 * Generar número de OT
 */
export function generateWorkOrderNumber(sequence: number): string {
  const date = todayString().replace(/-/g, '')
  return `OT-${date}-${String(sequence).padStart(4, '0')}`
}

/**
 * Calcular costo promedio ponderado
 * Fórmula: (stock_actual * costo_actual + cantidad_nueva * costo_nuevo) / (stock_actual + cantidad_nueva)
 */
export function weightedAverageCost(
  currentStock: number,
  currentCost: number,
  newQuantity: number,
  newCost: number
): number {
  const totalUnits = currentStock + newQuantity
  if (totalUnits === 0) return newCost
  return (currentStock * currentCost + newQuantity * newCost) / totalUnits
}

/**
 * Calcular margen de ganancia
 */
export function grossMargin(salePrice: number, costPrice: number): number {
  if (salePrice === 0) return 0
  return (salePrice - costPrice) / salePrice
}