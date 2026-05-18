// src/main/services/clients/client.service.ts
import { getSqlite } from '../../database/connection'
import { getCurrentSession } from '../auth/auth.service'
import type { IpcResponse, Client, PaginatedResult, Sale, WorkOrder, Credit } from '../../../shared/types/index'

// ============================================================
// CLIENTES — CRUD + Búsqueda + Historial
// ============================================================

interface ListClientsParams {
  search?: string
  document?: string
  isActive?: boolean
  hasCredit?: boolean
  page?: number
  pageSize?: number
}

// ── Listar clientes ─────────────────────────────────────────
export function listClients(params?: ListClientsParams): IpcResponse<PaginatedResult<Client>> {
  const db       = getSqlite()
  const page     = params?.page     ?? 1
  const pageSize = params?.pageSize ?? 20
  const offset   = (page - 1) * pageSize

  let where  = 'WHERE deleted_at IS NULL'
  const args: unknown[] = []

  if (params?.search) {
    where += ` AND (name LIKE ? OR document LIKE ? OR phone LIKE ?)`
    const q = `%${params.search}%`
    args.push(q, q, q)
  }
  if (params?.document) {
    where += ` AND document = ?`
    args.push(params.document)
  }
  if (params?.isActive !== undefined) {
    where += ` AND is_active = ?`
    args.push(params.isActive ? 1 : 0)
  }
  if (params?.hasCredit) {
    where += ` AND credit_limit > 0`
  }

  const total = (db.prepare(`
    SELECT COUNT(*) as c FROM clients ${where}
  `).get(...args) as { c: number }).c

  const rows = db.prepare(`
    SELECT * FROM clients ${where}
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `).all(...args, pageSize, offset) as any[]

  return {
    success: true,
    data: {
      data: rows.map(mapClient),
      total,
      page,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// ── Obtener cliente por ID ──────────────────────────────────
export function getClient(id: number): IpcResponse<Client> {
  const db  = getSqlite()
  const row = db.prepare(`
    SELECT * FROM clients WHERE id = ? AND deleted_at IS NULL
  `).get(id) as any

  if (!row) return { success: false, error: 'Cliente no encontrado' }
  return { success: true, data: mapClient(row) }
}

// ── Buscar clientes (POS / rápido) ──────────────────────────
export function searchClients(query: string): IpcResponse<Client[]> {
  const db = getSqlite()
  const q  = `%${query}%`
  const rows = db.prepare(`
    SELECT * FROM clients
    WHERE deleted_at IS NULL AND is_active = 1
      AND (name LIKE ? OR document LIKE ? OR phone LIKE ?)
    ORDER BY name ASC
    LIMIT 20
  `).all(q, q, q) as any[]

  return { success: true, data: rows.map(mapClient) }
}

// ── Crear cliente ────────────────────────────────────────────
export function createClient(data: {
  documentType?: string
  document?: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  creditLimit?: number
  discount?: number
}): IpcResponse<Client> {
  const db = getSqlite()

  // Validaciones
  if (!data.name?.trim()) {
    return { success: false, error: 'El nombre es requerido' }
  }

  // Validar documento único si se proporciona
  if (data.document?.trim()) {
    const dup = db.prepare(`
      SELECT id FROM clients WHERE document = ? AND deleted_at IS NULL
    `).get(data.document.trim())
    if (dup) {
      return { success: false, error: 'Ya existe un cliente con ese documento' }
    }
  }

  const result = db.prepare(`
    INSERT INTO clients
      (document_type, document, name, phone, email, address, notes, credit_limit, discount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.documentType ?? null,
    data.document?.trim() ?? null,
    data.name.trim(),
    data.phone ?? null,
    data.email ?? null,
    data.address ?? null,
    data.notes ?? null,
    data.creditLimit ?? 0,
    data.discount ?? 0,
  )

  const clientId = result.lastInsertRowid as number
  auditLog('CREATE', 'clients', clientId, null, data)

  return getClient(clientId)
}

// ── Actualizar cliente ──────────────────────────────────────
export function updateClient(data: {
  id: number
  documentType?: string
  document?: string
  name?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  creditLimit?: number
  discount?: number
  isActive?: boolean
}): IpcResponse<Client> {
  const db  = getSqlite()
  const old = db.prepare(`SELECT * FROM clients WHERE id = ? AND deleted_at IS NULL`).get(data.id) as any
  if (!old) return { success: false, error: 'Cliente no encontrado' }

  // Validar documento único si cambia
  if (data.document?.trim() && data.document !== old.document) {
    const dup = db.prepare(`
      SELECT id FROM clients WHERE document = ? AND id != ? AND deleted_at IS NULL
    `).get(data.document.trim(), data.id)
    if (dup) {
      return { success: false, error: 'Documento ya en uso por otro cliente' }
    }
  }

  db.prepare(`
    UPDATE clients SET
      document_type = COALESCE(?, document_type),
      document      = COALESCE(?, document),
      name          = COALESCE(?, name),
      phone         = COALESCE(?, phone),
      email         = COALESCE(?, email),
      address       = COALESCE(?, address),
      notes         = COALESCE(?, notes),
      credit_limit  = COALESCE(?, credit_limit),
      discount      = COALESCE(?, discount),
      is_active     = COALESCE(?, is_active),
      updated_at    = datetime('now','localtime')
    WHERE id = ?
  `).run(
    data.documentType ?? null,
    data.document     ?? null,
    data.name         ?? null,
    data.phone        ?? null,
    data.email        ?? null,
    data.address      ?? null,
    data.notes        ?? null,
    data.creditLimit  ?? null,
    data.discount     ?? null,
    data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
    data.id,
  )

  auditLog('UPDATE', 'clients', data.id, old, data)
  return getClient(data.id)
}

// ── Eliminar cliente (soft delete) ──────────────────────────
export function deleteClient(id: number): IpcResponse {
  const db = getSqlite()

  // Verificar que no tenga ventas, OTs activas o créditos pendientes
  const activeSales = db.prepare(`
    SELECT id FROM sales WHERE client_id = ? AND status != 'anulada' LIMIT 1
  `).get(id)
  if (activeSales) {
    return { success: false, error: 'No se puede eliminar: tiene ventas registradas' }
  }

  const activeWO = db.prepare(`
    SELECT id FROM work_orders WHERE client_id = ? AND status NOT IN ('entregado','anulado') LIMIT 1
  `).get(id)
  if (activeWO) {
    return { success: false, error: 'No se puede eliminar: tiene órdenes de trabajo activas' }
  }

  const pendingCredits = db.prepare(`
    SELECT id FROM credits WHERE client_id = ? AND balance > 0 LIMIT 1
  `).get(id)
  if (pendingCredits) {
    return { success: false, error: 'No se puede eliminar: tiene créditos pendientes' }
  }

  const row = db.prepare(`SELECT id FROM clients WHERE id = ? AND deleted_at IS NULL`).get(id)
  if (!row) return { success: false, error: 'Cliente no encontrado' }

  db.prepare(`UPDATE clients SET deleted_at = datetime('now','localtime') WHERE id = ?`).run(id)
  auditLog('DELETE', 'clients', id, null, null)

  return { success: true }
}

// ── Historial completo del cliente ────────────────────────────
export function getClientHistory(id: number): IpcResponse<{
  client: Client
  sales: Sale[]
  workOrders: WorkOrder[]
  credits: Credit[]
}> {
  const db = getSqlite()

  const clientRow = db.prepare(`
    SELECT * FROM clients WHERE id = ? AND deleted_at IS NULL
  `).get(id) as any
  if (!clientRow) return { success: false, error: 'Cliente no encontrado' }

  // Ventas del cliente (últimas 50)
  const salesRows = db.prepare(`
    SELECT s.*, u.full_name as user_name
    FROM sales s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.client_id = ?
    ORDER BY s.created_at DESC
    LIMIT 50
  `).all(id) as any[]

  // Órdenes de trabajo (últimas 50)
  const woRows = db.prepare(`
    SELECT wo.*, m.plate, m.brand, m.model, me.name as mechanic_name
    FROM work_orders wo
    LEFT JOIN motorcycles m ON wo.motorcycle_id = m.id
    LEFT JOIN mechanics me ON wo.mechanic_id = me.id
    WHERE wo.client_id = ?
    ORDER BY wo.created_at DESC
    LIMIT 50
  `).all(id) as any[]

  // Créditos
  const creditRows = db.prepare(`
    SELECT c.*, cl.name as client_name
    FROM credits c
    LEFT JOIN clients cl ON c.client_id = cl.id
    WHERE c.client_id = ?
    ORDER BY c.created_at DESC
  `).all(id) as any[]

  return {
    success: true,
    data: {
      client: mapClient(clientRow),
      sales: salesRows.map(r => ({
        id: r.id,
        invoiceNumber: r.invoice_number,
        clientId: r.client_id,
        clientName: r.client_name,
        userId: r.user_id,
        userName: r.user_name,
        status: r.status,
        paymentStatus: r.payment_status,
        subtotal: r.subtotal,
        discount: r.discount,
        tax: r.tax,
        total: r.total,
        paid: r.paid,
        change: r.change,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      workOrders: woRows.map(r => ({
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
        laborCost: r.labor_cost,
        partsCost: r.parts_cost,
        total: r.total,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      credits: creditRows.map(r => ({
        id: r.id,
        clientId: r.client_id,
        clientName: r.client_name,
        saleId: r.sale_id,
        workOrderId: r.work_order_id,
        invoiceNumber: r.invoice_number,
        originalAmount: r.original_amount,
        paidAmount: r.paid_amount,
        balance: r.balance,
        dueDate: r.due_date,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    },
  }
}

// ── Helpers ──────────────────────────────────────────────────
function mapClient(r: any): Client {
  return {
    id:           r.id,
    documentType: r.document_type,
    document:     r.document,
    name:         r.name,
    phone:        r.phone,
    email:        r.email,
    address:      r.address,
    notes:        r.notes,
    creditLimit:  r.credit_limit,
    discount:     r.discount,
    isActive:     Boolean(r.is_active),
    createdAt:    r.created_at,
    updatedAt:    r.updated_at,
  }
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
