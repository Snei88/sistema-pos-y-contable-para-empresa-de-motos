// src/main/services/mechanics/mechanic.service.ts
import { getSqlite } from '../../database/connection'
import { getCurrentSession } from '../auth/auth.service'
import type { IpcResponse, Mechanic, PaginatedResult } from '../../../shared/types/index'

// ============================================================
// MECÁNICOS — Liquidación diaria, pago de patio, reportes
// ============================================================

// ── Obtener reporte diario de un mecánico ─────────────────
export function getMechanicDaily(data: {
  mechanicId: number
  date: string
}): IpcResponse<{
  mechanic: Mechanic
  date: string
  workOrders: any[]
  sales: any[]
  totalLabor: number
  totalParts: number
  totalGenerated: number
  patioFee: number
  isPatioPaid: boolean
  patioPaidAmount: number
  isSettled: boolean
  settledAmount: number
  netAmount: number
}> {
  const db = getSqlite()

  const mechanic = db.prepare(`SELECT * FROM mechanics WHERE id = ?`).get(data.mechanicId) as any
  if (!mechanic) return { success: false, error: 'Mecánico no encontrado' }

  // OTs finalizadas ese día con items de mano de obra
  const workOrders = db.prepare(`
    SELECT wo.*, m.plate, m.brand, m.model
    FROM work_orders wo
    LEFT JOIN motorcycles m ON wo.motorcycle_id = m.id
    WHERE wo.mechanic_id = ? 
      AND date(wo.updated_at) = date(?)
      AND wo.status IN ('finalizado', 'entregado')
    ORDER BY wo.updated_at DESC
  `).all(data.mechanicId, data.date) as any[]

  // Calcular mano de obra de esas OTs
  let totalLabor = 0
  let totalParts = 0

  for (const wo of workOrders) {
    const items = db.prepare(`
      SELECT * FROM work_order_items WHERE work_order_id = ? AND type = 'mano_obra'
    `).all(wo.id) as any[]
    totalLabor += items.reduce((sum: number, item: any) => sum + item.subtotal, 0)

    const parts = db.prepare(`
      SELECT * FROM work_order_items WHERE work_order_id = ? AND type = 'repuesto'
    `).all(wo.id) as any[]
    totalParts += parts.reduce((sum: number, item: any) => sum + item.subtotal, 0)
  }

  // Ventas asociadas al mecánico (si se implementa campo mechanic_id en sales)
  // Por ahora buscamos ventas del día que mencionen al mecánico en notes o work_order_id
  const sales = db.prepare(`
    SELECT s.*, wo.order_number
    FROM sales s
    LEFT JOIN work_orders wo ON s.work_order_id = wo.id
    WHERE wo.mechanic_id = ? 
      AND date(s.created_at) = date(?)
      AND s.status = 'completada'
    ORDER BY s.created_at DESC
  `).all(data.mechanicId, data.date) as any[]

  const totalSales = sales.reduce((sum: number, s: any) => sum + s.total, 0)

  const totalGenerated = totalLabor + totalParts + totalSales
  const patioFee = mechanic.patio_fee || 0
  const netAmount = totalGenerated - patioFee

  // Verificar si ya hay liquidación registrada
  const settlement = db.prepare(`
    SELECT * FROM mechanic_settlements 
    WHERE mechanic_id = ? AND date = ?
  `).get(data.mechanicId, data.date) as any

  return {
    success: true,
    data: {
      mechanic: {
        id: mechanic.id,
        userId: mechanic.user_id,
        name: mechanic.name,
        document: mechanic.document,
        phone: mechanic.phone,
        specialty: mechanic.specialty,
        patioFee: mechanic.patio_fee,
        isActive: Boolean(mechanic.is_active),
        createdAt: mechanic.created_at,
        updatedAt: mechanic.updated_at,
      },
      date: data.date,
      workOrders: workOrders.map(wo => ({
        id: wo.id,
        orderNumber: wo.order_number,
        plate: wo.plate,
        brand: wo.brand,
        model: wo.model,
        description: wo.description,
        laborCost: wo.labor_cost,
        partsCost: wo.parts_cost,
        total: wo.total,
        status: wo.status,
      })),
      sales: sales.map(s => ({
        id: s.id,
        invoiceNumber: s.invoice_number,
        total: s.total,
        orderNumber: s.order_number,
      })),
      totalLabor,
      totalParts,
      totalGenerated,
      patioFee,
      isPatioPaid: settlement ? Boolean(settlement.is_patio_paid) : false,
      patioPaidAmount: settlement?.patio_paid_amount || 0,
      isSettled: settlement ? Boolean(settlement.is_settled) : false,
      settledAmount: settlement?.settled_amount || 0,
      netAmount,
    },
  }
}

// ── Marcar pago de patio ──────────────────────────────────
export function payPatio(data: {
  mechanicId: number
  date: string
  amount: number
  notes?: string
}): IpcResponse {
  const db = getSqlite()
  const session = getCurrentSession()
  if (!session) return { success: false, error: 'No hay sesión activa' }

  if (data.amount < 0) return { success: false, error: 'Monto no puede ser negativo' }

  // Buscar o crear registro del día
  let settlement = db.prepare(`
    SELECT id FROM mechanic_settlements WHERE mechanic_id = ? AND date = ?
  `).get(data.mechanicId, data.date) as any

  if (settlement) {
    db.prepare(`
      UPDATE mechanic_settlements SET
        is_patio_paid = 1,
        patio_paid_amount = ?,
        notes = COALESCE(?, notes),
        updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(data.amount, data.notes ?? null, settlement.id)
  } else {
    db.prepare(`
      INSERT INTO mechanic_settlements
        (mechanic_id, date, total_generated, patio_fee, net_amount, is_patio_paid, patio_paid_amount, notes)
      VALUES (?, ?, 0, 0, 0, 1, ?, ?)
    `).run(data.mechanicId, data.date, data.amount, data.notes ?? null)
  }

  auditLog('PAY_PATIO', 'mechanics', data.mechanicId, null, { date: data.date, amount: data.amount })

  return { success: true }
}

// ── Liquidar día del mecánico ──────────────────────────────
export function settleMechanic(data: {
  mechanicId: number
  date: string
  amount: number
  notes?: string
}): IpcResponse {
  const db = getSqlite()
  const session = getCurrentSession()
  if (!session) return { success: false, error: 'No hay sesión activa' }

  const daily = getMechanicDaily({ mechanicId: data.mechanicId, date: data.date })
  if (!daily.success) return daily

  const { totalGenerated, patioFee, netAmount, isPatioPaid } = daily.data!

  if (!isPatioPaid) {
    return { success: false, error: 'Debe pagar el patio antes de liquidar' }
  }

  if (data.amount > netAmount) {
    return { success: false, error: `La liquidación no puede exceder $${netAmount.toLocaleString('es-CO')}` }
  }

  // Buscar o crear registro
  let settlement = db.prepare(`
    SELECT id FROM mechanic_settlements WHERE mechanic_id = ? AND date = ?
  `).get(data.mechanicId, data.date) as any

  if (settlement) {
    db.prepare(`
      UPDATE mechanic_settlements SET
        total_generated = ?,
        patio_fee = ?,
        net_amount = ?,
        is_settled = 1,
        settled_amount = ?,
        settled_by = ?,
        notes = COALESCE(?, notes),
        updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(totalGenerated, patioFee, netAmount, data.amount, session.id, data.notes ?? null, settlement.id)
  } else {
    db.prepare(`
      INSERT INTO mechanic_settlements
        (mechanic_id, date, total_generated, patio_fee, net_amount, is_patio_paid, patio_paid_amount, is_settled, settled_amount, settled_by, notes)
      VALUES (?, ?, ?, ?, ?, 1, ?, 1, ?, ?, ?)
    `).run(data.mechanicId, data.date, totalGenerated, patioFee, netAmount, patioFee, data.amount, session.id, data.notes ?? null)
  }

  auditLog('SETTLE', 'mechanics', data.mechanicId, null, { date: data.date, amount: data.amount, netAmount })

  return { success: true }
}

// ── Reporte de liquidaciones por período ──────────────────
export function listSettlements(params?: {
  mechanicId?: number
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}): IpcResponse<PaginatedResult<any>> {
  const db = getSqlite()
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20
  const offset = (page - 1) * pageSize

  let where = 'WHERE 1=1'
  const args: unknown[] = []

  if (params?.mechanicId) {
    where += ` AND ms.mechanic_id = ?`
    args.push(params.mechanicId)
  }
  if (params?.startDate) {
    where += ` AND ms.date >= ?`
    args.push(params.startDate)
  }
  if (params?.endDate) {
    where += ` AND ms.date <= ?`
    args.push(params.endDate)
  }

  const total = (db.prepare(`SELECT COUNT(*) as c FROM mechanic_settlements ms ${where}`).get(...args) as { c: number }).c

  const rows = db.prepare(`
    SELECT ms.*, m.name as mechanic_name, u.full_name as settled_by_name
    FROM mechanic_settlements ms
    LEFT JOIN mechanics m ON ms.mechanic_id = m.id
    LEFT JOIN users u ON ms.settled_by = u.id
    ${where}
    ORDER BY ms.date DESC
    LIMIT ? OFFSET ?
  `).all(...args, pageSize, offset) as any[]

  return {
    success: true,
    data: {
      data: rows.map(r => ({
        id: r.id,
        mechanicId: r.mechanic_id,
        mechanicName: r.mechanic_name,
        date: r.date,
        totalGenerated: r.total_generated,
        patioFee: r.patio_fee,
        netAmount: r.net_amount,
        isPatioPaid: Boolean(r.is_patio_paid),
        patioPaidAmount: r.patio_paid_amount,
        isSettled: Boolean(r.is_settled),
        settledAmount: r.settled_amount,
        settledBy: r.settled_by_name,
        notes: r.notes,
        createdAt: r.created_at,
      })),
      total,
      page,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// ── Helpers ───────────────────────────────────────────────
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