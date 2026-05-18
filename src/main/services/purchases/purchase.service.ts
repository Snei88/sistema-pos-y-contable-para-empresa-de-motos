// src/main/services/purchases/purchase.service.ts
import { getSqlite } from '../../database/connection'
import { getCurrentSession } from '../auth/auth.service'
import type { IpcResponse, Purchase, PaginatedResult } from '../../../shared/types/index'

// ============================================================
// COMPRAS — Registro, recepción, actualización inventario, CxP
// ============================================================

interface CreatePurchaseData {
  supplierId: number
  invoiceNumber?: string
  items: {
    productId: number
    quantity: number
    unitCost: number
  }[]
  tax?: number
  dueDate?: string
  notes?: string
}

// ── Listar compras ──────────────────────────────────────────
export function listPurchases(params?: {
  search?: string
  status?: string
  paymentStatus?: string
  supplierId?: number
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}): IpcResponse<PaginatedResult<Purchase>> {
  const db       = getSqlite()
  const page     = params?.page     ?? 1
  const pageSize = params?.pageSize ?? 20
  const offset   = (page - 1) * pageSize

  let where = 'WHERE 1=1'
  const args: unknown[] = []

  if (params?.search) {
    where += ` AND (p.invoice_number LIKE ? OR s.name LIKE ?)`
    const q = `%${params.search}%`
    args.push(q, q)
  }
  if (params?.status) {
    where += ` AND p.status = ?`
    args.push(params.status)
  }
  if (params?.paymentStatus) {
    where += ` AND p.payment_status = ?`
    args.push(params.paymentStatus)
  }
  if (params?.supplierId) {
    where += ` AND p.supplier_id = ?`
    args.push(params.supplierId)
  }
  if (params?.startDate) {
    where += ` AND date(p.created_at) >= ?`
    args.push(params.startDate)
  }
  if (params?.endDate) {
    where += ` AND date(p.created_at) <= ?`
    args.push(params.endDate)
  }

  const total = (db.prepare(`
    SELECT COUNT(*) as c FROM purchases p ${where}
  `).get(...args) as { c: number }).c

  const rows = db.prepare(`
    SELECT p.*, s.name as supplier_name, u.full_name as user_name
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    LEFT JOIN users u ON p.user_id = u.id
    ${where}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...args, pageSize, offset) as any[]

  return {
    success: true,
    data: {
      data: rows.map(mapPurchase),
      total,
      page,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// ── Obtener compra por ID ─────────────────────────────────
export function getPurchase(id: number): IpcResponse<Purchase> {
  const db = getSqlite()

  const purchase = db.prepare(`
    SELECT p.*, s.name as supplier_name, u.full_name as user_name
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(id) as any

  if (!purchase) return { success: false, error: 'Compra no encontrada' }

  const items = db.prepare(`
    SELECT pi.*, pr.name as product_name, pr.code as product_code
    FROM purchase_items pi
    LEFT JOIN products pr ON pi.product_id = pr.id
    WHERE pi.purchase_id = ?
  `).all(id) as any[]

  return {
    success: true,
    data: {
      ...mapPurchase(purchase),
      items: items.map(i => ({
        id: i.id,
        purchaseId: i.purchase_id,
        productId: i.product_id,
        productName: i.product_name,
        quantity: i.quantity,
        unitCost: i.unit_cost,
        subtotal: i.subtotal,
      })),
    },
  }
}

// ── Crear compra ──────────────────────────────────────────
export function createPurchase(data: CreatePurchaseData): IpcResponse<Purchase> {
  const db      = getSqlite()
  const session = getCurrentSession()
  if (!session) return { success: false, error: 'No hay sesión de usuario activa' }

  // Validaciones
  if (!data.supplierId) return { success: false, error: 'Proveedor requerido' }
  if (!data.items?.length) return { success: false, error: 'Debe tener al menos un item' }

  // Verificar proveedor existe
  const supplier = db.prepare(`SELECT id FROM suppliers WHERE id = ? AND is_active = 1`).get(data.supplierId)
  if (!supplier) return { success: false, error: 'Proveedor no encontrado o inactivo' }

  // Calcular totales
  let subtotal = 0
  const processedItems: any[] = []

  for (const item of data.items) {
    if (item.quantity <= 0) return { success: false, error: 'Cantidad debe ser mayor a 0' }
    if (item.unitCost < 0) return { success: false, error: 'Costo no puede ser negativo' }

    const product = db.prepare(`SELECT id, name, stock, cost_price FROM products WHERE id = ? AND deleted_at IS NULL`)
      .get(item.productId) as any
    if (!product) return { success: false, error: `Producto ID ${item.productId} no encontrado` }

    const itemSubtotal = item.quantity * item.unitCost
    subtotal += itemSubtotal

    processedItems.push({
      ...item,
      productName: product.name,
      subtotal: itemSubtotal,
      currentStock: product.stock,
      currentCost: product.cost_price,
    })
  }

  const tax = data.tax ?? subtotal * 0.19
  const total = subtotal + tax

  // Insertar compra
  const result = db.prepare(`
    INSERT INTO purchases
      (supplier_id, user_id, invoice_number, status, payment_status, subtotal, tax, total, paid, due_date, notes)
    VALUES (?, ?, ?, 'pendiente', 'pendiente', ?, ?, ?, 0, ?, ?)
  `).run(
    data.supplierId,
    session.id,
    data.invoiceNumber ?? null,
    subtotal,
    tax,
    total,
    data.dueDate ?? null,
    data.notes ?? null,
  )

  const purchaseId = result.lastInsertRowid as number

  // Insertar items
  for (const item of processedItems) {
    db.prepare(`
      INSERT INTO purchase_items (purchase_id, product_id, product_name, quantity, unit_cost, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(purchaseId, item.productId, item.productName, item.quantity, item.unitCost, item.subtotal)
  }

  auditLog('CREATE', 'purchases', purchaseId, null, { supplierId: data.supplierId, total, items: data.items.length })

  return getPurchase(purchaseId)
}

// ── Recibir compra (actualiza inventario) ──────────────────
export function receivePurchase(data: { id: number; notes?: string }): IpcResponse<Purchase> {
  const db      = getSqlite()
  const session = getCurrentSession()
  if (!session) return { success: false, error: 'No hay sesión activa' }

  const purchase = db.prepare(`SELECT * FROM purchases WHERE id = ?`).get(data.id) as any
  if (!purchase) return { success: false, error: 'Compra no encontrada' }
  if (purchase.status === 'recibida') return { success: false, error: 'Compra ya fue recibida' }
  if (purchase.status === 'anulada') return { success: false, error: 'Compra anulada, no se puede recibir' }

  const items = db.prepare(`SELECT * FROM purchase_items WHERE purchase_id = ?`).all(data.id) as any[]

  // Actualizar stock y recalcular costo promedio ponderado
  for (const item of items) {
    const product = db.prepare(`SELECT stock, cost_price FROM products WHERE id = ?`).get(item.product_id) as any
    const stockBefore = product.stock
    const stockAfter = stockBefore + item.quantity

    // Costo promedio ponderado: (stock_actual * costo_actual + cantidad_compra * costo_compra) / stock_nuevo
    const newCostPrice = stockAfter > 0
      ? ((stockBefore * product.cost_price) + (item.quantity * item.unit_cost)) / stockAfter
      : item.unit_cost

    db.prepare(`
      UPDATE products SET
        stock = ?,
        cost_price = ?,
        updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(stockAfter, newCostPrice, item.product_id)

    // Kardex
    db.prepare(`
      INSERT INTO stock_movements
        (product_id, type, quantity, cost_price, stock_before, stock_after, reference, reference_id, user_id, notes)
      VALUES (?, 'compra', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.product_id,
      item.quantity,
      item.unit_cost,
      stockBefore,
      stockAfter,
      `Compra #${purchase.id}`,
      data.id,
      session.id,
      data.notes ?? 'Recepción de compra',
    )
  }

  // Actualizar estado
  db.prepare(`
    UPDATE purchases SET
      status = 'recibida',
      received_at = datetime('now','localtime'),
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(data.id)

  // Asiento contable: Inventario ↑, CxP ↑
  createPurchaseAccountingEntry(data.id, purchase.total, items)

  auditLog('RECEIVE', 'purchases', data.id, purchase, { receivedAt: new Date().toISOString() })

  return getPurchase(data.id)
}

// ── Registrar pago a proveedor ────────────────────────────
export function payPurchase(data: { id: number; amount: number; method: string; reference?: string }): IpcResponse {
  const db      = getSqlite()
  const session = getCurrentSession()
  if (!session) return { success: false, error: 'No hay sesión activa' }

  const purchase = db.prepare(`SELECT * FROM purchases WHERE id = ?`).get(data.id) as any
  if (!purchase) return { success: false, error: 'Compra no encontrada' }

  const newPaid = purchase.paid + data.amount
  const balance = purchase.total - newPaid

  if (newPaid > purchase.total) {
    return { success: false, error: 'El pago excede el total de la compra' }
  }

  const paymentStatus = balance <= 0 ? 'pagado' : newPaid > 0 ? 'parcial' : 'pendiente'

  db.prepare(`
    UPDATE purchases SET
      paid = ?,
      payment_status = ?,
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(newPaid, paymentStatus, data.id)

  // Nota: aquí se podría registrar el egreso de caja si se implementan movimientos de caja

  auditLog('PAY', 'purchases', data.id, { paid: purchase.paid }, { newPaid, paymentStatus })

  return { success: true }
}

// ── Anular compra ─────────────────────────────────────────
export function cancelPurchase(id: number): IpcResponse {
  const db      = getSqlite()
  const session = getCurrentSession()
  if (!session) return { success: false, error: 'No hay sesión activa' }

  const purchase = db.prepare(`SELECT * FROM purchases WHERE id = ? AND status != 'anulada'`).get(id) as any
  if (!purchase) return { success: false, error: 'Compra no encontrada o ya anulada' }

  // Solo admin puede anular compras recibidas
  const isAdmin = session.role === 'admin' || session.role === 'supervisor'
  if (purchase.status === 'recibida' && !isAdmin) {
    return { success: false, error: 'Solo admin puede anular compras ya recibidas (afecta inventario)' }
  }

  // Si ya fue recibida, revertir stock
  if (purchase.status === 'recibida') {
    const items = db.prepare(`SELECT * FROM purchase_items WHERE purchase_id = ?`).all(id) as any[]
    for (const item of items) {
      const product = db.prepare(`SELECT stock FROM products WHERE id = ?`).get(item.product_id) as any
      const newStock = Math.max(0, product.stock - item.quantity)

      db.prepare(`UPDATE products SET stock = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
        .run(newStock, item.product_id)

      db.prepare(`
        INSERT INTO stock_movements
          (product_id, type, quantity, stock_before, stock_after, reference, reference_id, user_id, notes)
        VALUES (?, 'ajuste_resta', ?, ?, ?, ?, ?, ?, 'Anulación compra')
      `).run(
        item.product_id,
        item.quantity,
        product.stock,
        newStock,
        `Anulación compra #${id}`,
        id,
        session.id,
      )
    }
  }

  db.prepare(`
    UPDATE purchases SET status = 'anulada', updated_at = datetime('now','localtime') WHERE id = ?
  `).run(id)

  auditLog('CANCEL', 'purchases', id, purchase, { status: 'anulada' })

  return { success: true }
}

// ── Helpers ───────────────────────────────────────────────
function mapPurchase(r: any): Purchase {
  return {
    id: r.id,
    supplierId: r.supplier_id,
    supplierName: r.supplier_name,
    userId: r.user_id,
    userName: r.user_name,
    invoiceNumber: r.invoice_number,
    status: r.status,
    paymentStatus: r.payment_status,
    subtotal: r.subtotal,
    tax: r.tax,
    total: r.total,
    paid: r.paid,
    dueDate: r.due_date,
    notes: r.notes,
    receivedAt: r.received_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function createPurchaseAccountingEntry(purchaseId: number, total: number, _items: any[]): void {
  const db      = getSqlite()
  const session = getCurrentSession()
  if (!session) return

  const entryNum = `AC-${String(purchaseId).padStart(6, '0')}`

  db.prepare(`
    INSERT INTO journal_entries (entry_number, date, description, reference, reference_type, reference_id, user_id)
    VALUES (?, date('now'), ?, ?, 'compra', ?, ?)
  `).run(entryNum, `Compra #${purchaseId}`, `COM-${purchaseId}`, purchaseId, session.id)

  const entryId = (db.prepare(`SELECT last_insert_rowid() as id`).get() as any).id

  // Débito: Inventario
  db.prepare(`INSERT INTO journal_lines (entry_id, account_code, debit, credit, description) VALUES (?, '1435', ?, 0, ?)`)
    .run(entryId, total, 'Entrada de mercancía')

  // Crédito: Proveedores / CxP
  db.prepare(`INSERT INTO journal_lines (entry_id, account_code, debit, credit, description) VALUES (?, '2205', 0, ?, ?)`)
    .run(entryId, total, 'Cuenta por pagar proveedor')
}

function auditLog(action: string, module: string, recordId: number, before: any, after: any): void {
  const db      = getSqlite()
  const session = getCurrentSession()
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, module, record_id, before, after)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    session?.id ?? 1,
    session?.fullName ?? 'Sistema',
    action,
    module,
    recordId,
    before ? JSON.stringify(before) : null,
    after ? JSON.stringify(after) : null,
  )
}