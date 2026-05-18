// src/main/services/workshop/workshop.service.ts
import { getSqlite } from '../../database/connection'
import { getCurrentSession } from '../auth/auth.service'
import type { IpcResponse, Motorcycle, WorkOrder, PaginatedResult, Mechanic } from '../../../shared/types/index'

// ============================================================
// TALLER / OT — Motos, órdenes de trabajo, mecánicos, repuestos
// ============================================================

// ── MOTOS ───────────────────────────────────────────────────

interface MotoData {
  clientId?: number
  plate: string
  brand: string
  model: string
  year?: number
  color?: string
  engineNumber?: string
  chassisNumber?: string
  notes?: string
}

export function listMotos(params?: {
  search?: string
  clientId?: number
  page?: number
  pageSize?: number
}): IpcResponse<PaginatedResult<Motorcycle>> {
  const db = getSqlite()
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20
  const offset = (page - 1) * pageSize

  let where = 'WHERE m.deleted_at IS NULL'
  const args: unknown[] = []

  if (params?.search) {
    where += ` AND (m.plate LIKE ? OR m.brand LIKE ? OR m.model LIKE ? OR c.name LIKE ?)`
    const q = `%${params.search}%`
    args.push(q, q, q, q)
  }
  if (params?.clientId) {
    where += ` AND m.client_id = ?`
    args.push(params.clientId)
  }

  const total = (db.prepare(`SELECT COUNT(*) as c FROM motorcycles m ${where}`).get(...args) as { c: number }).c

  const rows = db.prepare(`
    SELECT m.*, c.name as client_name
    FROM motorcycles m
    LEFT JOIN clients c ON m.client_id = c.id
    ${where}
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...args, pageSize, offset) as any[]

  return {
    success: true,
    data: {
      data: rows.map(mapMoto),
      total,
      page,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

export function getMoto(id: number): IpcResponse<Motorcycle> {
  const db = getSqlite()
  const row = db.prepare(`
    SELECT m.*, c.name as client_name
    FROM motorcycles m
    LEFT JOIN clients c ON m.client_id = c.id
    WHERE m.id = ? AND m.deleted_at IS NULL
  `).get(id) as any

  if (!row) return { success: false, error: 'Moto no encontrada' }
  return { success: true, data: mapMoto(row) }
}

export function searchMotos(query: string): IpcResponse<Motorcycle[]> {
  const db = getSqlite()
  const q = `%${query}%`
  const rows = db.prepare(`
    SELECT m.*, c.name as client_name
    FROM motorcycles m
    LEFT JOIN clients c ON m.client_id = c.id
    WHERE m.deleted_at IS NULL AND (m.plate LIKE ? OR m.brand LIKE ? OR m.model LIKE ?)
    ORDER BY m.plate ASC
    LIMIT 20
  `).all(q, q, q) as any[]

  return { success: true, data: rows.map(mapMoto) }
}

export function createMoto(data: MotoData): IpcResponse<Motorcycle> {
  const db = getSqlite()

  if (!data.plate?.trim()) return { success: false, error: 'La placa es requerida' }
  if (!data.brand?.trim()) return { success: false, error: 'La marca es requerida' }
  if (!data.model?.trim()) return { success: false, error: 'El modelo es requerido' }

  // Verificar placa única
  const dup = db.prepare(`SELECT id FROM motorcycles WHERE plate = ? AND deleted_at IS NULL`).get(data.plate.trim())
  if (dup) return { success: false, error: 'Ya existe una moto con esa placa' }

  const result = db.prepare(`
    INSERT INTO motorcycles (client_id, plate, brand, model, year, color, engine_number, chassis_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.clientId ?? null,
    data.plate.trim().toUpperCase(),
    data.brand.trim(),
    data.model.trim(),
    data.year ?? null,
    data.color ?? null,
    data.engineNumber ?? null,
    data.chassisNumber ?? null,
    data.notes ?? null,
  )

  return getMoto(result.lastInsertRowid as number)
}

export function updateMoto(data: MotoData & { id: number }): IpcResponse<Motorcycle> {
  const db = getSqlite()
  const old = db.prepare(`SELECT * FROM motorcycles WHERE id = ? AND deleted_at IS NULL`).get(data.id) as any
  if (!old) return { success: false, error: 'Moto no encontrada' }

  if (data.plate && data.plate !== old.plate) {
    const dup = db.prepare(`SELECT id FROM motorcycles WHERE plate = ? AND id != ? AND deleted_at IS NULL`)
      .get(data.plate.trim(), data.id)
    if (dup) return { success: false, error: 'Placa ya en uso' }
  }

  db.prepare(`
    UPDATE motorcycles SET
      client_id     = COALESCE(?, client_id),
      plate         = COALESCE(?, plate),
      brand         = COALESCE(?, brand),
      model         = COALESCE(?, model),
      year          = COALESCE(?, year),
      color         = COALESCE(?, color),
      engine_number = COALESCE(?, engine_number),
      chassis_number= COALESCE(?, chassis_number),
      notes         = COALESCE(?, notes),
      updated_at    = datetime('now','localtime')
    WHERE id = ?
  `).run(
    data.clientId ?? null,
    data.plate ?? null,
    data.brand ?? null,
    data.model ?? null,
    data.year ?? null,
    data.color ?? null,
    data.engineNumber ?? null,
    data.chassisNumber ?? null,
    data.notes ?? null,
    data.id,
  )

  auditLog('UPDATE', 'workshop', data.id, old, data)
  return getMoto(data.id)
}

// ── ÓRDENES DE TRABAJO ────────────────────────────────────

interface CreateWorkOrderData {
  motorcycleId: number
  clientId?: number
  mechanicId?: number
  description: string
  diagnosis?: string
  estimatedDelivery?: string
  notes?: string
  items?: {
    type: 'repuesto' | 'mano_obra' | 'otro'
    productId?: number
    description: string
    quantity: number
    unitPrice: number
  }[]
}

export function listWorkOrders(params?: {
  status?: string
  mechanicId?: number
  clientId?: number
  motorcycleId?: number
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}): IpcResponse<PaginatedResult<WorkOrder>> {
  const db = getSqlite()
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20
  const offset = (page - 1) * pageSize

  let where = 'WHERE wo.deleted_at IS NULL'
  const args: unknown[] = []

  if (params?.status) {
    where += ` AND wo.status = ?`
    args.push(params.status)
  }
  if (params?.mechanicId) {
    where += ` AND wo.mechanic_id = ?`
    args.push(params.mechanicId)
  }
  if (params?.clientId) {
    where += ` AND wo.client_id = ?`
    args.push(params.clientId)
  }
  if (params?.motorcycleId) {
    where += ` AND wo.motorcycle_id = ?`
    args.push(params.motorcycleId)
  }
  if (params?.startDate) {
    where += ` AND date(wo.created_at) >= ?`
    args.push(params.startDate)
  }
  if (params?.endDate) {
    where += ` AND date(wo.created_at) <= ?`
    args.push(params.endDate)
  }

  const total = (db.prepare(`SELECT COUNT(*) as c FROM work_orders wo ${where}`).get(...args) as { c: number }).c

  const rows = db.prepare(`
    SELECT wo.*, 
           m.plate, m.brand as moto_brand, m.model as moto_model,
           c.name as client_name,
           me.name as mechanic_name
    FROM work_orders wo
    LEFT JOIN motorcycles m ON wo.motorcycle_id = m.id
    LEFT JOIN clients c ON wo.client_id = c.id
    LEFT JOIN mechanics me ON wo.mechanic_id = me.id
    ${where}
    ORDER BY 
      CASE wo.status 
        WHEN 'pendiente' THEN 1 
        WHEN 'en_proceso' THEN 2 
        WHEN 'finalizado' THEN 3 
        WHEN 'entregado' THEN 4 
        ELSE 5 
      END,
      wo.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...args, pageSize, offset) as any[]

  return {
    success: true,
    data: {
      data: rows.map(mapWorkOrder),
      total,
      page,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

export function getWorkOrder(id: number): IpcResponse<WorkOrder> {
  const db = getSqlite()

  const wo = db.prepare(`
    SELECT wo.*, 
           m.plate, m.brand as moto_brand, m.model as moto_model,
           c.name as client_name,
           me.name as mechanic_name
    FROM work_orders wo
    LEFT JOIN motorcycles m ON wo.motorcycle_id = m.id
    LEFT JOIN clients c ON wo.client_id = c.id
    LEFT JOIN mechanics me ON wo.mechanic_id = me.id
    WHERE wo.id = ? AND wo.deleted_at IS NULL
  `).get(id) as any

  if (!wo) return { success: false, error: 'Orden de trabajo no encontrada' }

  const items = db.prepare(`
    SELECT woi.*, p.name as product_name
    FROM work_order_items woi
    LEFT JOIN products p ON woi.product_id = p.id
    WHERE woi.work_order_id = ?
  `).all(id) as any[]

  return {
    success: true,
    data: {
      ...mapWorkOrder(wo),
      items: items.map(i => ({
        id: i.id,
        workOrderId: i.work_order_id,
        type: i.type,
        productId: i.product_id,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        subtotal: i.subtotal,
      })),
    },
  }
}

export function createWorkOrder(data: CreateWorkOrderData): IpcResponse<WorkOrder> {
  const db = getSqlite()
  const session = getCurrentSession()
  if (!session) return { success: false, error: 'No hay sesión activa' }

  if (!data.description?.trim()) return { success: false, error: 'Descripción del servicio requerida' }

  // Verificar moto existe
  const moto = db.prepare(`SELECT * FROM motorcycles WHERE id = ? AND deleted_at IS NULL`).get(data.motorcycleId) as any
  if (!moto) return { success: false, error: 'Moto no encontrada' }

  // Generar número de OT
  const seq = db.prepare(`SELECT value FROM settings WHERE key = 'workorder_sequence'`).get() as { value: string }
  const nextNum = parseInt(seq?.value || '0') + 1
  const orderNumber = `OT${String(nextNum).padStart(6, '0')}`

  // Calcular totales
  let partsCost = 0
  let laborCost = 0
  const processedItems: any[] = []

  for (const item of (data.items || [])) {
    const subtotal = item.quantity * item.unitPrice
    if (item.type === 'repuesto') {
      partsCost += subtotal
      // Verificar stock si hay productId
      if (item.productId) {
        const product = db.prepare(`SELECT stock FROM products WHERE id = ?`).get(item.productId) as any
        if (!product) return { success: false, error: `Producto no encontrado: ${item.description}` }
        if (product.stock < item.quantity) {
          return { success: false, error: `Stock insuficiente para "${item.description}". Disponible: ${product.stock}` }
        }
      }
    } else if (item.type === 'mano_obra') {
      laborCost += subtotal
    }

    processedItems.push({ ...item, subtotal })
  }

  const total = partsCost + laborCost

  const result = db.prepare(`
    INSERT INTO work_orders
      (order_number, motorcycle_id, client_id, mechanic_id, user_id, status,
       description, diagnosis, labor_cost, parts_cost, total, estimated_delivery, notes)
    VALUES (?, ?, ?, ?, ?, 'pendiente', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderNumber,
    data.motorcycleId,
    data.clientId ?? moto.client_id,
    data.mechanicId ?? null,
    session.id,
    data.description.trim(),
    data.diagnosis ?? null,
    laborCost,
    partsCost,
    total,
    data.estimatedDelivery ?? null,
    data.notes ?? null,
  )

  const woId = result.lastInsertRowid as number

  // Insertar items
  for (const item of processedItems) {
    db.prepare(`
      INSERT INTO work_order_items
        (work_order_id, type, product_id, description, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      woId,
      item.type,
      item.productId ?? null,
      item.description,
      item.quantity,
      item.unitPrice,
      item.subtotal,
    )
  }

  // Actualizar secuencia
  db.prepare(`UPDATE settings SET value = ?, updated_at = datetime('now','localtime') WHERE key = 'workorder_sequence'`)
    .run(String(nextNum))

  auditLog('CREATE', 'workshop', woId, null, { orderNumber, total })

  return getWorkOrder(woId)
}

export function updateWorkOrder(data: Partial<CreateWorkOrderData> & { id: number }): IpcResponse<WorkOrder> {
  const db = getSqlite()
  const old = db.prepare(`SELECT * FROM work_orders WHERE id = ? AND deleted_at IS NULL`).get(data.id) as any
  if (!old) return { success: false, error: 'OT no encontrada' }

  // No permitir editar si ya está entregada o anulada
  if (['entregado', 'anulado'].includes(old.status)) {
    return { success: false, error: `No se puede editar una OT ${old.status}` }
  }

  db.prepare(`
    UPDATE work_orders SET
      mechanic_id       = COALESCE(?, mechanic_id),
      description       = COALESCE(?, description),
      diagnosis         = COALESCE(?, diagnosis),
      estimated_delivery= COALESCE(?, estimated_delivery),
      notes             = COALESCE(?, notes),
      updated_at        = datetime('now','localtime')
    WHERE id = ?
  `).run(
    data.mechanicId ?? null,
    data.description ?? null,
    data.diagnosis ?? null,
    data.estimatedDelivery ?? null,
    data.notes ?? null,
    data.id,
  )

  auditLog('UPDATE', 'workshop', data.id, old, data)
  return getWorkOrder(data.id)
}

export function changeWorkOrderStatus(data: { id: number; status: string; notes?: string }): IpcResponse<WorkOrder> {
  const db = getSqlite()
  const session = getCurrentSession()
  if (!session) return { success: false, error: 'No hay sesión activa' }

  const wo = db.prepare(`SELECT * FROM work_orders WHERE id = ? AND deleted_at IS NULL`).get(data.id) as any
  if (!wo) return { success: false, error: 'OT no encontrada' }

  // Validar transiciones de estado
  const validTransitions: Record<string, string[]> = {
    pendiente: ['en_proceso', 'anulado'],
    en_proceso: ['finalizado', 'anulado'],
    finalizado: ['entregado', 'en_proceso'],
    entregado: [],
    anulado: [],
  }

  if (!validTransitions[wo.status]?.includes(data.status)) {
    return { success: false, error: `No se puede cambiar de "${wo.status}" a "${data.status}"` }
  }

  // Si pasa a finalizado, consumir repuestos del inventario
  if (data.status === 'finalizado') {
    const items = db.prepare(`
      SELECT * FROM work_order_items WHERE work_order_id = ? AND type = 'repuesto'
    `).all(data.id) as any[]

    for (const item of items) {
      if (item.product_id) {
        const product = db.prepare(`SELECT stock, cost_price FROM products WHERE id = ?`).get(item.product_id) as any
        const newStock = product.stock - item.quantity

        if (newStock < 0) {
          return { success: false, error: `Stock insuficiente para "${item.description}"` }
        }

        db.prepare(`UPDATE products SET stock = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
          .run(newStock, item.product_id)

        db.prepare(`
          INSERT INTO stock_movements
            (product_id, type, quantity, cost_price, stock_before, stock_after, reference, reference_id, user_id, notes)
          VALUES (?, 'salida', ?, ?, ?, ?, ?, ?, ?, 'Consumo OT')
        `).run(
          item.product_id,
          item.quantity,
          product.cost_price,
          product.stock,
          newStock,
          `OT ${wo.order_number}`,
          data.id,
          session.id,
        )
      }
    }
  }

  db.prepare(`
    UPDATE work_orders SET
      status = ?,
      delivered_at = CASE WHEN ? = 'entregado' THEN datetime('now','localtime') ELSE delivered_at END,
      notes = COALESCE(?, notes),
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(data.status, data.status, data.notes ?? null, data.id)

  auditLog('STATUS_CHANGE', 'workshop', data.id, { status: wo.status }, { status: data.status })

  return getWorkOrder(data.id)
}

// ── MECÁNICOS ─────────────────────────────────────────────

export function listMechanics(params?: { activeOnly?: boolean }): IpcResponse<Mechanic[]> {
  const db = getSqlite()
  let where = 'WHERE deleted_at IS NULL'
  const args: unknown[] = []
  if (params?.activeOnly) {
    where += ' AND is_active = 1'
  }
  const rows = db.prepare(`SELECT * FROM mechanics ${where} ORDER BY name ASC`).all(...args) as any[]
  return {
    success: true,
    data: rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      document: r.document,
      phone: r.phone,
      specialty: r.specialty,
      patioFee: r.patio_fee,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  }
}

export function createMechanic(data: {
  name: string
  document?: string
  phone?: string
  specialty?: string
  patioFee?: number
}): IpcResponse {
  const db = getSqlite()
  if (!data.name?.trim()) return { success: false, error: 'Nombre requerido' }

  db.prepare(`
    INSERT INTO mechanics (name, document, phone, specialty, patio_fee)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    data.name.trim(),
    data.document ?? null,
    data.phone ?? null,
    data.specialty ?? null,
    data.patioFee ?? 0,
  )

  return { success: true }
}

export function updateMechanic(data: {
  id: number
  name?: string
  document?: string
  phone?: string
  specialty?: string
  patioFee?: number
  isActive?: boolean
}): IpcResponse {
  const db = getSqlite()
  db.prepare(`
    UPDATE mechanics SET
      name      = COALESCE(?, name),
      document  = COALESCE(?, document),
      phone     = COALESCE(?, phone),
      specialty = COALESCE(?, specialty),
      patio_fee = COALESCE(?, patio_fee),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(
    data.name ?? null,
    data.document ?? null,
    data.phone ?? null,
    data.specialty ?? null,
    data.patioFee ?? null,
    data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
    data.id,
  )
  return { success: true }
}

// ── Helpers ───────────────────────────────────────────────

function mapMoto(r: any): Motorcycle {
  return {
    id: r.id,
    clientId: r.client_id,
    clientName: r.client_name,
    plate: r.plate,
    brand: r.brand,
    model: r.model,
    year: r.year,
    color: r.color,
    engineNumber: r.engine_number,
    chassisNumber: r.chassis_number,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function mapWorkOrder(r: any): WorkOrder {
  return {
    id: r.id,
    orderNumber: r.order_number,
    motorcycleId: r.motorcycle_id,
    clientId: r.client_id,
    clientName: r.client_name,
    plate: r.plate,
    mechanicId: r.mechanic_id,
    mechanicName: r.mechanic_name,
    userId: r.user_id,
    status: r.status,
    description: r.description,
    diagnosis: r.diagnosis,
    laborCost: r.labor_cost,
    partsCost: r.parts_cost,
    total: r.total,
    estimatedDelivery: r.estimated_delivery,
    deliveredAt: r.delivered_at,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function auditLog(action: string, module: string, recordId: number, before: any, after: any): void {
  const db = getSqlite()
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