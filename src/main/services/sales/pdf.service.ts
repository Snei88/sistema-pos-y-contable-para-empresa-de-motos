// src/main/services/sales/pdf.service.ts
import { getSqlite } from '../../database/connection'
import type { IpcResponse } from '../../../shared/types/index'
import { shell } from 'electron'
import { join } from 'path'
import { app } from 'electron'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

function getPdfDir(): string {
  const dir = join(app.getPath('userData'), 'pdfs')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function loadSettings(): Record<string, string> {
  const db = getSqlite()
  const settings = db.prepare(`SELECT key, value FROM settings`).all() as any[]
  const cfg: Record<string, string> = {}
  for (const s of settings) cfg[s.key] = s.value
  return cfg
}

function cleanPhone(phone?: string): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (digits.length === 10) return `57${digits}`
  return digits
}

function openWhatsapp(message: string, phone?: string): IpcResponse {
  const target = cleanPhone(phone)
  const base = target ? `https://wa.me/${target}` : 'https://wa.me/'
  shell.openExternal(`${base}?text=${encodeURIComponent(message)}`)
  return { success: true }
}

// ── Imprimir factura de venta ─────────────────────────────
export function printInvoice(saleId: number): IpcResponse<{ filePath: string }> {
  const db = getSqlite()

  const sale = db.prepare(`
    SELECT s.*, u.full_name as user_name, cl.name as client_name_full,
           cl.document_type, cl.document, cl.phone as client_phone, cl.email as client_email,
           cl.address as client_address
    FROM sales s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN clients cl ON s.client_id = cl.id
    WHERE s.id = ?
  `).get(saleId) as any

  if (!sale) return { success: false, error: 'Venta no encontrada' }

  const items = db.prepare(`SELECT * FROM sale_items WHERE sale_id = ?`).all(saleId) as any[]
  const payments = db.prepare(`SELECT * FROM sale_payments WHERE sale_id = ?`).all(saleId) as any[]
  const cfg = loadSettings()

  const html = buildInvoiceHtml(sale, items, payments, cfg)
  const filePath = join(getPdfDir(), `factura_${sale.invoice_number}.html`)
  writeFileSync(filePath, html, 'utf-8')
  shell.openExternal(`file://${filePath}`)

  return { success: true, data: { filePath } }
}

export function sendInvoiceWhatsapp(saleId: number): IpcResponse {
  const db = getSqlite()
  const sale = db.prepare(`
    SELECT s.*, u.full_name as user_name, cl.name as client_name_full,
           cl.document_type, cl.document, cl.phone as client_phone, cl.email as client_email
    FROM sales s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN clients cl ON s.client_id = cl.id
    WHERE s.id = ?
  `).get(saleId) as any

  if (!sale) return { success: false, error: 'Venta no encontrada' }

  const items = db.prepare(`SELECT * FROM sale_items WHERE sale_id = ?`).all(saleId) as any[]
  const payments = db.prepare(`SELECT * FROM sale_payments WHERE sale_id = ?`).all(saleId) as any[]
  const cfg = loadSettings()
  return openWhatsapp(buildInvoiceWhatsappMessage(sale, items, payments, cfg), sale.client_phone)
}

export function sendPendingWhatsapp(data: {
  cart: any[]
  client?: any
  globalDiscount?: number
  notes?: string
  createdAt?: string
}): IpcResponse {
  const cfg = loadSettings()
  return openWhatsapp(buildPendingWhatsappMessage(data, cfg), data.client?.phone)
}

// ── Imprimir orden de trabajo ─────────────────────────────
export function printWorkOrder(workOrderId: number): IpcResponse<{ filePath: string }> {
  const db = getSqlite()

  const wo = db.prepare(`
    SELECT wo.*, m.plate, m.brand, m.model, m.year, m.color,
           c.name as client_name, me.name as mechanic_name, u.full_name as user_name
    FROM work_orders wo
    LEFT JOIN motorcycles m ON wo.motorcycle_id = m.id
    LEFT JOIN clients c ON wo.client_id = c.id
    LEFT JOIN mechanics me ON wo.mechanic_id = me.id
    LEFT JOIN users u ON wo.user_id = u.id
    WHERE wo.id = ?
  `).get(workOrderId) as any

  if (!wo) return { success: false, error: 'Orden de trabajo no encontrada' }

  const items = db.prepare(`SELECT * FROM work_order_items WHERE work_order_id = ?`).all(workOrderId) as any[]
  const settings = db.prepare(`SELECT key, value FROM settings`).all() as any[]
  const cfg: Record<string, string> = {}
  for (const s of settings) cfg[s.key] = s.value

  const html = buildWorkOrderHtml(wo, items, cfg)
  const filePath = join(getPdfDir(), `OT_${wo.order_number}.html`)
  writeFileSync(filePath, html, 'utf-8')
  shell.openExternal(`file://${filePath}`)

  return { success: true, data: { filePath } }
}

// ── Recibo genérico ───────────────────────────────────────
export function printReceipt(data: { title?: string; body: string }): IpcResponse<{ filePath: string }> {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:monospace;padding:20px;max-width:400px;margin:0 auto}pre{white-space:pre-wrap}</style></head><body><h2>${data.title ?? 'Recibo'}</h2><pre>${data.body}</pre></body></html>`
  const filePath = join(getPdfDir(), `recibo_${Date.now()}.html`)
  writeFileSync(filePath, html, 'utf-8')
  shell.openExternal(`file://${filePath}`)
  return { success: true, data: { filePath } }
}

// ── Helpers HTML ──────────────────────────────────────────
function fmt(n: number): string {
  return `$${(n ?? 0).toLocaleString('es-CO')}`
}

function invoiceClientName(sale: any): string {
  return sale.client_name ?? sale.client_name_full ?? 'Cliente ocasional'
}

function buildInvoiceWhatsappMessage(sale: any, items: any[], payments: any[], cfg: Record<string, string>): string {
  const empresa = cfg['empresa_nombre'] ?? 'Manuel Motos'
  const nit = cfg['empresa_nit'] ?? ''
  const separator = '━━━━━━━━━━━━━━━━━━'
  const createdAt = new Date(sale.created_at)
  const date = createdAt.toLocaleDateString('es-CO')
  const time = createdAt.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  const itemLines = items.map(i =>
    `• ${i.product_name} x${i.quantity} — ${fmt(i.subtotal)}`
  ).join('\n')
  const payLines = payments.length
    ? payments.map(p => `• ${p.method}: ${fmt(p.amount)}${p.reference ? ` (${p.reference})` : ''}`).join('\n')
    : '• Sin pagos registrados'

  return [
    separator,
    `*${empresa.toUpperCase()}*`,
    nit ? `NIT: ${nit}` : '',
    separator,
    '',
    '*FACTURA DE VENTA*',
    `Factura: ${sale.invoice_number}`,
    '',
    `Fecha: ${date} - ${time}`,
    `Cliente: ${invoiceClientName(sale)}`,
    sale.document ? `Documento: ${sale.document}` : '',
    '',
    separator,
    '*DETALLE DE LA VENTA*',
    separator,
    '',
    itemLines,
    '',
    separator,
    `Subtotal: ${fmt(sale.subtotal)}`,
    sale.discount > 0 ? `Descuento: -${fmt(sale.discount)}` : '',
    `IVA: ${fmt(sale.tax)}`,
    `*TOTAL PAGADO: ${fmt(sale.total)}*`,
    separator,
    '',
    '*Pagos:*',
    payLines,
    '',
    sale.notes ? `Notas: ${sale.notes}` : '',
    'Gracias por tu compra.',
  ].filter(Boolean).join('\n')
}

function buildPendingWhatsappMessage(data: { cart: any[]; client?: any; globalDiscount?: number; notes?: string; createdAt?: string }, cfg: Record<string, string>): string {
  const empresa = cfg['empresa_nombre'] ?? 'Manuel Motos'
  const nit = cfg['empresa_nit'] ?? ''
  const separator = '━━━━━━━━━━━━━━━━━━'
  const createdAt = new Date(data.createdAt ?? Date.now())
  const date = createdAt.toLocaleDateString('es-CO')
  const time = createdAt.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  const subtotal = data.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity) - (item.discount || 0), 0)
  const discount = data.globalDiscount || 0
  const total = Math.max(0, subtotal - discount)
  const itemLines = data.cart.map(item => `• ${item.name} x${item.quantity} — ${fmt((item.unitPrice * item.quantity) - (item.discount || 0))}`).join('\n')

  return [
    separator,
    `*${empresa.toUpperCase()}*`,
    nit ? `NIT: ${nit}` : '',
    separator,
    '',
    '*VENTA PENDIENTE / NO PAGADA*',
    '',
    `Fecha: ${date} - ${time}`,
    `Cliente: ${data.client?.name ?? 'Cliente ocasional'}`,
    data.client?.document ? `Documento: ${data.client.document}` : '',
    '',
    separator,
    '*DETALLE DE LA VENTA*',
    separator,
    '',
    itemLines,
    '',
    separator,
    `Subtotal: ${fmt(subtotal)}`,
    discount > 0 ? `Descuento: -${fmt(discount)}` : '',
    `*TOTAL PENDIENTE: ${fmt(total)}*`,
    separator,
    '',
    data.notes ? `Notas: ${data.notes}` : '',
    'Gracias por tu compra.',
  ].filter(Boolean).join('\n')
}

function buildInvoiceHtml(sale: any, items: any[], payments: any[], cfg: Record<string, string>): string {
  const empresa = cfg['empresa_nombre'] ?? 'Manuel Motos'
  const nit = cfg['empresa_nit'] ?? ''
  const dir = cfg['empresa_direccion'] ?? ''
  const tel = cfg['empresa_telefono'] ?? ''
  const ciudad = cfg['empresa_ciudad'] ?? 'Colombia'
  const email = cfg['empresa_email'] ?? ''
  const encargado = cfg['empresa_encargado'] ?? ''

  const itemRows = items.map(i => `
    <tr>
      <td>${i.product_name}</td>
      <td style="text-align:center">${i.quantity}</td>
      <td style="text-align:right">${fmt(i.unit_price)}</td>
      <td style="text-align:right">${fmt(i.subtotal)}</td>
    </tr>`).join('')

  const payRows = payments.length
    ? payments.map(p => `<tr><td>${p.method}${p.reference ? ` - Ref. ${p.reference}` : ''}</td><td style="text-align:right">${fmt(p.amount)}</td></tr>`).join('')
    : '<tr><td colspan="2">Sin pagos registrados</td></tr>'

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Factura ${sale.invoice_number}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; color: #111; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th { background: #f0f0f0; padding: 5px; text-align: left; border-bottom: 1px solid #ccc; }
  td { padding: 4px 5px; border-bottom: 1px solid #eee; }
  .totals td { font-weight: bold; }
  .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #555; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
  <h1>${empresa}</h1>
  <div>NIT: ${nit}</div>
  <div>${dir} | ${ciudad}</div>
  <div>Tel: ${tel}${email ? ` | ${email}` : ''}</div>
  ${encargado ? `<div>Encargado: ${encargado}</div>` : ''}
  <br>
  <strong>FACTURA DE VENTA</strong><br>
  <strong>${sale.invoice_number}</strong>
  <div>${new Date(sale.created_at).toLocaleString('es-CO')}</div>
</div>

<table>
  <tr><td><strong>Cliente:</strong></td><td>${invoiceClientName(sale)}</td></tr>
  <tr><td><strong>Documento:</strong></td><td>${sale.document ?? '—'}</td></tr>
  <tr><td><strong>Tel / Email:</strong></td><td>${sale.client_phone ?? '—'}${sale.client_email ? ` | ${sale.client_email}` : ''}</td></tr>
  <tr><td><strong>Cajero:</strong></td><td>${sale.user_name}</td></tr>
  <tr><td><strong>Estado pago:</strong></td><td>${sale.payment_status}</td></tr>
</table>

<table>
  <thead><tr><th>Producto</th><th>Cant</th><th>Precio</th><th>Subtotal</th></tr></thead>
  <tbody>${itemRows}</tbody>
</table>

<table class="totals">
  <tr><td>Subtotal</td><td style="text-align:right">${fmt(sale.subtotal)}</td></tr>
  ${sale.discount > 0 ? `<tr><td>Descuento</td><td style="text-align:right">-${fmt(sale.discount)}</td></tr>` : ''}
  <tr><td>IVA (19%)</td><td style="text-align:right">${fmt(sale.tax)}</td></tr>
  <tr><td><strong>TOTAL</strong></td><td style="text-align:right"><strong>${fmt(sale.total)}</strong></td></tr>
</table>

<table>
  <thead><tr><th colspan="2">Pagos</th></tr></thead>
  <tbody>${payRows}</tbody>
  ${sale.change > 0 ? `<tr><td>Cambio</td><td style="text-align:right">${fmt(sale.change)}</td></tr>` : ''}
</table>

<div class="footer">¡Gracias por su compra!</div>
<div class="footer">Documento generado por el sistema.</div>
<script>window.onload=()=>window.print()</script>
</body>
</html>`
}

function buildWorkOrderHtml(wo: any, items: any[], cfg: Record<string, string>): string {
  const empresa = cfg['empresa_nombre'] ?? 'Manuel Motos'
  const tel = cfg['empresa_telefono'] ?? ''

  const repuestos = items.filter(i => i.type === 'repuesto')
  const manoObra = items.filter(i => i.type === 'mano_obra')
  const otros = items.filter(i => i.type === 'otro')

  const itemSection = (title: string, list: any[]) => list.length === 0 ? '' : `
    <h4>${title}</h4>
    <table>
      <thead><tr><th>Descripción</th><th>Cant</th><th>Precio</th><th>Subtotal</th></tr></thead>
      <tbody>${list.map(i => `<tr><td>${i.description}</td><td>${i.quantity}</td><td style="text-align:right">$${i.unit_price.toLocaleString('es-CO')}</td><td style="text-align:right">$${i.subtotal.toLocaleString('es-CO')}</td></tr>`).join('')}</tbody>
    </table>`

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Orden de Trabajo ${wo.order_number}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; color: #111; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h4 { margin: 12px 0 4px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
  .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { background: #f0f0f0; padding: 5px; text-align: left; border-bottom: 1px solid #ccc; }
  td { padding: 4px 5px; border-bottom: 1px solid #eee; }
  .firma { margin-top: 40px; display: flex; justify-content: space-between; }
  .firma div { border-top: 1px solid #000; width: 180px; text-align: center; padding-top: 4px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
  <h1>${empresa}</h1>
  <div>Tel: ${tel}</div>
  <br>
  <strong>ORDEN DE TRABAJO</strong><br>
  <strong>${wo.order_number}</strong>
  <div>${new Date(wo.created_at).toLocaleString('es-CO')}</div>
</div>

<table>
  <tr><td><strong>Placa:</strong></td><td>${wo.plate}</td><td><strong>Marca/Modelo:</strong></td><td>${wo.brand} ${wo.model} ${wo.year ?? ''}</td></tr>
  <tr><td><strong>Cliente:</strong></td><td>${wo.client_name ?? '—'}</td><td><strong>Mecánico:</strong></td><td>${wo.mechanic_name ?? 'Sin asignar'}</td></tr>
  <tr><td><strong>Estado:</strong></td><td>${wo.status}</td><td><strong>Entrega est.:</strong></td><td>${wo.estimated_delivery ? new Date(wo.estimated_delivery).toLocaleDateString('es-CO') : '—'}</td></tr>
</table>

<h4>Descripción del servicio</h4>
<p style="padding:6px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px">${wo.description}</p>
${wo.diagnosis ? `<h4>Diagnóstico</h4><p style="padding:6px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px">${wo.diagnosis}</p>` : ''}

${itemSection('Repuestos', repuestos)}
${itemSection('Mano de obra', manoObra)}
${itemSection('Otros', otros)}

<table style="margin-top:8px">
  <tr><td>Repuestos</td><td style="text-align:right">$${wo.parts_cost.toLocaleString('es-CO')}</td></tr>
  <tr><td>Mano de obra</td><td style="text-align:right">$${wo.labor_cost.toLocaleString('es-CO')}</td></tr>
  <tr><td><strong>TOTAL</strong></td><td style="text-align:right"><strong>$${wo.total.toLocaleString('es-CO')}</strong></td></tr>
</table>

<div class="firma">
  <div>Técnico</div>
  <div>Cliente</div>
</div>
<script>window.onload=()=>window.print()</script>
</body>
</html>`
}
