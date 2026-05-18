// src/main/services/sales/sales.service.ts
import { getSqlite } from '../../database/connection'
import { getCurrentSession } from '../auth/auth.service'
import type { IpcResponse, Sale, PaginatedResult } from '../../../shared/types/index'

// ============================================================
// VENTAS / POS — Carrito, pagos mixtos, facturación, créditos
// ============================================================

interface CreateSaleData {
  clientId?: number
  clientName?: string
  items: {
    productId?: number
    productName: string
    productCode?: string
    quantity: number
    unitPrice: number
    costPrice?: number
    discount?: number
    isManual?: boolean
  }[]
  payments: {
    method: string
    amount: number
    reference?: string
  }[]
  discount?: number
  notes?: string
  workOrderId?: number
}

// ── Listar ventas ───────────────────────────────────────────
export function listSales(params?: {
  search?: string
  status?: string
  paymentStatus?: string
  clientId?: number
  userId?: number
  cashSessionId?: number
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}): IpcResponse<PaginatedResult<Sale>> {
  const db       = getSqlite()
  const page     = params?.page     ?? 1
  const pageSize = params?.pageSize ?? 20
  const offset   = (page - 1) * pageSize

  let where = 'WHERE 1=1'
  const args: unknown[] = []

  if (params?.search) {
    where += ` AND (s.invoice_number LIKE ? OR s.client_name LIKE ?)`
    const q = `%${params.search}%`
    args.push(q, q)
  }
  if (params?.status) {
    where += ` AND s.status = ?`
    args.push(params.status)
  }
  if (params?.paymentStatus) {
    where += ` AND s.payment_status = ?`
    args.push(params.paymentStatus)
  }
  if (params?.clientId) {
    where += ` AND s.client_id = ?`
    args.push(params.clientId)
  }
  if (params?.userId) {
    where += ` AND s.user_id = ?`
    args.push(params.userId)
  }
  if (params?.cashSessionId) {
    where += ` AND s.cash_session_id = ?`
    args.push(params.cashSessionId)
  }
  if (params?.startDate) {
    where += ` AND date(s.created_at) >= ?`
    args.push(params.startDate)
  }
  if (params?.endDate) {
    where += ` AND date(s.created_at) <= ?`
    args.push(params.endDate)
  }

  const total = (db.prepare(`
    SELECT COUNT(*) as c FROM sales s ${where}
  `).get(...args) as { c: number }).c

  const rows = db.prepare(`
    SELECT s.*, u.full_name as user_name, c.name as client_name_full
    FROM sales s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN clients c ON s.client_id = c.id
    ${where}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...args, pageSize, offset) as any[]

  return {
    success: true,
    data: {
      data: rows.map(mapSale),
      total,
      page,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// ── Obtener venta por ID ────────────────────────────────────
export function getSale(id: number): IpcResponse<Sale> {
  const db = getSqlite()

  const sale = db.prepare(`
    SELECT s.*, u.full_name as user_name
    FROM sales s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(id) as any

  if (!sale) return { success: false, error: 'Venta no encontrada' }

  const items = db.prepare(`
    SELECT * FROM sale_items WHERE sale_id = ?
  `).all(id) as any[]

  const payments = db.prepare(`
    SELECT * FROM sale_payments WHERE sale_id = ?
  `).all(id) as any[]

  return {
    success: true,
    data: {
      ...mapSale(sale),
      items: items.map(i => ({
        id: i.id,
        saleId: i.sale_id,
        productId: i.product_id,
        productName: i.product_name,
        productCode: i.product_code,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        costPrice: i.cost_price,
        discount: i.discount,
        subtotal: i.subtotal,
        isManual: Boolean(i.is_manual),
      })),
      payments: payments.map(p => ({
        id: p.id,
        saleId: p.sale_id,
        method: p.method,
        amount: p.amount,
        reference: p.reference,
        createdAt: p.created_at,
      })),
    },
  }
}

// ── Crear venta ─────────────────────────────────────────────
export function createSale(data: CreateSaleData): IpcResponse<Sale> {
  const db      = getSqlite()
  const session = getCurrentSession()
  if (!session) return { success: false, error: 'No hay sesión de usuario activa' }

  // Verificar caja abierta
  const cashSession = db.prepare(`
    SELECT id FROM cash_sessions WHERE user_id = ? AND status = 'abierta'
  `).get(session.id) as { id: number } | undefined
  if (!cashSession) {
    return { success: false, error: 'No hay caja abierta. Abre caja primero.' }
  }

  // Validar items
  if (!data.items?.length) {
    return { success: false, error: 'La venta debe tener al menos un item' }
  }

  // Validar stock y calcular totales
  let subtotal = 0
  let totalCost = 0
  const processedItems: any[] = []

  for (const item of data.items) {
    if (!item.isManual && item.productId) {
      const product = db.prepare(`SELECT * FROM products WHERE id = ? AND deleted_at IS NULL`)
        .get(item.productId) as any
      if (!product) {
        return { success: false, error: `Producto no encontrado: ${item.productName}` }
      }
      if (product.stock < item.quantity) {
        return { success: false, error: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}` }
      }

      const itemSubtotal = (item.unitPrice * item.quantity) - (item.discount || 0)
      subtotal += itemSubtotal
      totalCost += (item.costPrice || product.cost_price) * item.quantity

      processedItems.push({
        ...item,
        costPrice: item.costPrice || product.cost_price,
        subtotal: itemSubtotal,
      })
    } else {
      // Producto manual (libre)
      const itemSubtotal = (item.unitPrice * item.quantity) - (item.discount || 0)
      subtotal += itemSubtotal
      processedItems.push({
        ...item,
        costPrice: 0,
        subtotal: itemSubtotal,
      })
    }
  }

  // Descuento global (sin IVA — precios ya incluyen impuestos)
  const globalDiscount = data.discount || 0
  const tax = 0
  const total = Math.max(0, subtotal - globalDiscount)

  // Validar pagos
  const totalPayments = data.payments.reduce((sum, p) => sum + p.amount, 0)
  const hasCredit = data.payments.some(p => p.method === 'credito')
  const isPartial = totalPayments < total && totalPayments > 0

  if (!hasCredit && totalPayments < total) {
    return { success: false, error: `Faltan $${(total - totalPayments).toLocaleString('es-CO')} para completar el pago` }
  }

  // Generar número de factura
  const seq = db.prepare(`SELECT value FROM settings WHERE key = 'invoice_sequence'`).get() as { value: string }
  const nextNum = parseInt(seq?.value || '0') + 1
  const invoiceNumber = `F${String(nextNum).padStart(6, '0')}`

  // Determinar estados
  let paymentStatus: string
  if (hasCredit || isPartial) {
    paymentStatus = totalPayments >= total ? 'pagado' : totalPayments > 0 ? 'parcial' : 'pendiente'
  } else {
    paymentStatus = 'pagado'
  }

  // Insertar venta
  const saleResult = db.prepare(`
    INSERT INTO sales
      (invoice_number, client_id, client_name, user_id, cash_session_id, work_order_id,
       status, payment_status, subtotal, discount, tax, total, paid, change, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'completada', ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    invoiceNumber,
    data.clientId ?? null,
    data.clientName ?? null,
    session.id,
    cashSession.id,
    data.workOrderId ?? null,
    paymentStatus,
    subtotal,
    globalDiscount,
    tax,
    total,
    Math.min(totalPayments, total),
    Math.max(0, totalPayments - total),
    data.notes ?? null,
  )

  const saleId = saleResult.lastInsertRowid as number

  // Insertar items y actualizar stock
  for (const item of processedItems) {
    db.prepare(`
      INSERT INTO sale_items
        (sale_id, product_id, product_name, product_code, quantity, unit_price, cost_price, discount, subtotal, is_manual)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      saleId,
      item.productId ?? null,
      item.productName,
      item.productCode ?? null,
      item.quantity,
      item.unitPrice,
      item.costPrice,
      item.discount || 0,
      item.subtotal,
      item.isManual ? 1 : 0,
    )

    // Actualizar stock y kardex
    if (item.productId) {
      const product = db.prepare(`SELECT stock, cost_price FROM products WHERE id = ?`)
        .get(item.productId) as any

      const stockBefore = product.stock
      const stockAfter = stockBefore - item.quantity

      db.prepare(`UPDATE products SET stock = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
        .run(stockAfter, item.productId)

      db.prepare(`
        INSERT INTO stock_movements
          (product_id, type, quantity, cost_price, sale_price, stock_before, stock_after, reference, reference_id, user_id)
        VALUES (?, 'venta', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        item.productId,
        item.quantity,
        item.costPrice,
        item.unitPrice,
        stockBefore,
        stockAfter,
        `Venta ${invoiceNumber}`,
        saleId,
        session.id,
      )
    }
  }

  // Insertar pagos
  for (const payment of data.payments) {
    if (payment.amount <= 0) continue
    db.prepare(`
      INSERT INTO sale_payments (sale_id, method, amount, reference)
      VALUES (?, ?, ?, ?)
    `).run(saleId, payment.method, payment.amount, payment.reference ?? null)
  }

  // Si hay crédito o parcial, crear registro en cartera
  if (paymentStatus === 'pendiente' || paymentStatus === 'parcial') {
    const balance = total - Math.min(totalPayments, total)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30) // 30 días por defecto

    db.prepare(`
      INSERT INTO credits
        (client_id, sale_id, invoice_number, original_amount, paid_amount, balance, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'al_dia')
    `).run(
      data.clientId ?? null,
      saleId,
      invoiceNumber,
      total,
      Math.min(totalPayments, total),
      balance,
      dueDate.toISOString().split('T')[0],
    )
  }

  // Actualizar secuencia
  db.prepare(`UPDATE settings SET value = ?, updated_at = datetime('now','localtime') WHERE key = 'invoice_sequence'`)
    .run(String(nextNum))

  // Asiento contable automático
  createAccountingEntry(saleId, invoiceNumber, total, totalCost, tax, data.payments)

  auditLog('CREATE', 'sales', saleId, null, { invoiceNumber, total, items: data.items.length })

  return getSale(saleId)
}

// ── Anular venta ────────────────────────────────────────────
export function cancelSale(data: { id: number; reason: string }): IpcResponse {
  const db      = getSqlite()
  const session = getCurrentSession()
  if (!session) return { success: false, error: 'No hay sesión activa' }

  const sale = db.prepare(`SELECT * FROM sales WHERE id = ? AND status != 'anulada'`).get(data.id) as any
  if (!sale) return { success: false, error: 'Venta no encontrada o ya anulada' }

  // Verificar permisos: solo admin/supervisor puede anular, o el mismo cajero el mismo día
  const isAdmin = session.role === 'admin' || session.role === 'supervisor'
  const isSameDay = new Date(sale.created_at).toDateString() === new Date().toDateString()
  const isOwner = sale.user_id === session.id

  if (!isAdmin && !(isOwner && isSameDay)) {
    return { success: false, error: 'No tienes permiso para anular esta venta' }
  }

  // Revertir stock
  const items = db.prepare(`SELECT * FROM sale_items WHERE sale_id = ?`).all(data.id) as any[]
  for (const item of items) {
    if (item.product_id) {
      const product = db.prepare(`SELECT stock FROM products WHERE id = ?`).get(item.product_id) as any
      const newStock = product.stock + item.quantity

      db.prepare(`UPDATE products SET stock = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
        .run(newStock, item.product_id)

      db.prepare(`
        INSERT INTO stock_movements
          (product_id, type, quantity, stock_before, stock_after, reference, reference_id, user_id, notes)
        VALUES (?, 'devolucion', ?, ?, ?, ?, ?, ?, 'Anulación venta')
      `).run(
        item.product_id,
        item.quantity,
        product.stock,
        newStock,
        `Anulación ${sale.invoice_number}`,
        data.id,
        session.id,
      )
    }
  }

  // Anular crédito asociado si existe
  db.prepare(`UPDATE credits SET status = 'vencido', balance = 0 WHERE sale_id = ?`).run(data.id)

  // Actualizar venta
  db.prepare(`
    UPDATE sales SET
      status = 'anulada',
      payment_status = 'pagado',
      cancel_reason = ?,
      canceled_by = ?,
      canceled_at = datetime('now','localtime'),
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(data.reason, session.id, data.id)

  // Reversión contable
  createReversalEntry(data.id, sale.invoice_number, sale.total)

  auditLog('CANCEL', 'sales', data.id, sale, { reason: data.reason, canceledBy: session.id })

  return { success: true }
}

// ── Ventas del día ──────────────────────────────────────────
export function getSalesToday(): IpcResponse<{ sales: Sale[]; total: number; count: number }> {
  const db = getSqlite()
  const today = new Date().toISOString().split('T')[0]

  const rows = db.prepare(`
    SELECT s.*, u.full_name as user_name
    FROM sales s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE date(s.created_at) = ? AND s.status = 'completada'
    ORDER BY s.created_at DESC
  `).all(today) as any[]

  const stats = db.prepare(`
    SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
    FROM sales
    WHERE date(created_at) = ? AND status = 'completada'
  `).get(today) as { total: number; count: number }

  return {
    success: true,
    data: {
      sales: rows.map(mapSale),
      total: stats.total,
      count: stats.count,
    },
  }
}

// ── Helpers ──────────────────────────────────────────────────
function mapSale(r: any): Sale {
  return {
    id:             r.id,
    invoiceNumber:  r.invoice_number,
    clientId:       r.client_id,
    clientName:     r.client_name || r.client_name_full,
    userId:         r.user_id,
    userName:       r.user_name,
    cashSessionId:  r.cash_session_id,
    workOrderId:    r.work_order_id,
    status:         r.status,
    paymentStatus:  r.payment_status,
    subtotal:       r.subtotal,
    discount:       r.discount,
    tax:            r.tax,
    total:          r.total,
    paid:           r.paid,
    change:         r.change,
    notes:          r.notes,
    cancelReason:   r.cancel_reason,
    canceledBy:     r.canceled_by,
    canceledAt:     r.canceled_at,
    createdAt:      r.created_at,
    updatedAt:      r.updated_at,
  }
}

function createAccountingEntry(saleId: number, invoice: string, total: number, cost: number, tax: number, payments: any[]): void {
  const db      = getSqlite()
  const session = getCurrentSession()
  if (!session) return

  const entryNum = `AS-${String(saleId).padStart(6, '0')}`
  const cashAmount = payments.filter(p => p.method === 'efectivo').reduce((s, p) => s + p.amount, 0)
  const otherAmount = total - cashAmount

  db.prepare(`
    INSERT INTO journal_entries (entry_number, date, description, reference, reference_type, reference_id, user_id)
    VALUES (?, date('now'), ?, ?, 'venta', ?, ?)
  `).run(entryNum, `Venta ${invoice}`, invoice, saleId, session.id)

  const entryId = (db.prepare(`SELECT last_insert_rowid() as id`).get() as any).id

  // Débito: Caja / Bancos
  if (cashAmount > 0) {
    db.prepare(`INSERT INTO journal_lines (entry_id, account_code, debit, credit, description) VALUES (?, '1105', ?, 0, ?)`)
      .run(entryId, cashAmount, 'Caja general')
  }
  if (otherAmount > 0) {
    db.prepare(`INSERT INTO journal_lines (entry_id, account_code, debit, credit, description) VALUES (?, '1110', ?, 0, ?)`)
      .run(entryId, otherAmount, 'Bancos / Otros medios')
  }

  // Débito: Costo de ventas
  if (cost > 0) {
    db.prepare(`INSERT INTO journal_lines (entry_id, account_code, debit, credit, description) VALUES (?, '6135', ?, 0, ?)`)
      .run(entryId, cost, 'Costo de ventas')
  }

  // Crédito: Ingresos
  const netIncome = total - tax
  if (netIncome > 0) {
    db.prepare(`INSERT INTO journal_lines (entry_id, account_code, debit, credit, description) VALUES (?, '4135', 0, ?, ?)`)
      .run(entryId, netIncome, 'Ingresos por ventas')
  }

  // Crédito: IVA
  if (tax > 0) {
    db.prepare(`INSERT INTO journal_lines (entry_id, account_code, debit, credit, description) VALUES (?, '2408', 0, ?, ?)`)
      .run(entryId, tax, 'IVA generado')
  }

  // Crédito: Inventario (salida)
  if (cost > 0) {
    db.prepare(`INSERT INTO journal_lines (entry_id, account_code, debit, credit, description) VALUES (?, '1435', 0, ?, ?)`)
      .run(entryId, cost, 'Salida de inventario')
  }
}

function createReversalEntry(saleId: number, invoice: string, total: number): void {
  const db      = getSqlite()
  const session = getCurrentSession()
  if (!session) return

  const entryNum = `RA-${String(saleId).padStart(6, '0')}`
  
  db.prepare(`
    INSERT INTO journal_entries (entry_number, date, description, reference, reference_type, reference_id, user_id)
    VALUES (?, date('now'), ?, ?, 'anulacion', ?, ?)
  `).run(entryNum, `Anulación venta ${invoice}`, invoice, saleId, session.id)

  const entryId = (db.prepare(`SELECT last_insert_rowid() as id`).get() as any).id

  // Reversión simple: ingreso negativo, caja negativo
  db.prepare(`INSERT INTO journal_lines (entry_id, account_code, debit, credit, description) VALUES (?, '4135', ?, 0, ?)`)
    .run(entryId, total, `Reversión ${invoice}`)
  db.prepare(`INSERT INTO journal_lines (entry_id, account_code, debit, credit, description) VALUES (?, '1105', 0, ?, ?)`)
    .run(entryId, total, `Reversión caja ${invoice}`)
}

function auditLog(action: string, module: string, recordId: number, before: any, after: any): void {
  const db      = getSqlite()
  const session = getCurrentSession()
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, module, record_id, before, after)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    session?.id       ?? 1,
    session?.fullName ?? 'Sistema',
    action,
    module,
    recordId,
    before ? JSON.stringify(before) : null,
    after  ? JSON.stringify(after)  : null,
  )
}