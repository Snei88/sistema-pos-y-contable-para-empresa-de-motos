// src/main/services/cash/cash.service.ts
import { getSqlite } from '../../database/connection'
import { getCurrentSession } from '../auth/auth.service'
import type { IpcResponse, CashSession, PaginatedResult } from '../../../shared/types/index'

// ============================================================
// CAJA — Apertura, cierre, sesión activa, cuadre
// ============================================================

// ── Obtener sesión de caja activa del usuario actual ───────
export function getCurrentCashSession(): IpcResponse<CashSession | null> {
  const db      = getSqlite()
  const session = getCurrentSession()
  if (!session) return { success: false, error: 'No hay sesión de usuario activa' }

  const row = db.prepare(`
    SELECT cs.*, u.full_name as user_name
    FROM cash_sessions cs
    LEFT JOIN users u ON cs.user_id = u.id
    WHERE cs.user_id = ? AND cs.status = 'abierta'
    ORDER BY cs.opened_at DESC
    LIMIT 1
  `).get(session.id) as any

  return {
    success: true,
    data: row ? mapCashSession(row) : null,
  }
}

// ── Abrir caja ───────────────────────────────────────────────
export function openCashSession(data: {
  openingBalance: number
  notes?: string
}): IpcResponse<CashSession> {
  const db      = getSqlite()
  const session = getCurrentSession()
  if (!session) return { success: false, error: 'No hay sesión de usuario activa' }

  // Validar que no haya otra caja abierta para este usuario
  const existing = db.prepare(`
    SELECT id FROM cash_sessions WHERE user_id = ? AND status = 'abierta'
  `).get(session.id)
  if (existing) {
    return { success: false, error: 'Ya tienes una caja abierta. Ciérrala antes de abrir otra.' }
  }

  // Validar fondo inicial
  if (data.openingBalance < 0) {
    return { success: false, error: 'El fondo inicial no puede ser negativo' }
  }

  const result = db.prepare(`
    INSERT INTO cash_sessions (user_id, status, opening_balance, notes)
    VALUES (?, 'abierta', ?, ?)
  `).run(session.id, data.openingBalance, data.notes ?? null)

  const sessionId = result.lastInsertRowid as number

  auditLog('CASH_OPEN', 'cash', sessionId, null, {
    openingBalance: data.openingBalance,
    userId: session.id,
  })

  return getCashSessionById(sessionId)
}

// ── Cerrar caja ──────────────────────────────────────────────
export function closeCashSession(data: {
  closingBalance: number
  notes?: string
}): IpcResponse<CashSession> {
  const db      = getSqlite()
  const session = getCurrentSession()
  if (!session) return { success: false, error: 'No hay sesión de usuario activa' }

  // Obtener caja abierta
  const cashRow = db.prepare(`
    SELECT * FROM cash_sessions WHERE user_id = ? AND status = 'abierta'
  `).get(session.id) as any
  if (!cashRow) {
    return { success: false, error: 'No hay caja abierta para cerrar' }
  }

  // Calcular saldo esperado: fondo inicial + ventas en efectivo - devoluciones en efectivo
  const salesInCash = db.prepare(`
    SELECT COALESCE(SUM(sp.amount), 0) as total
    FROM sale_payments sp
    JOIN sales s ON sp.sale_id = s.id
    WHERE s.cash_session_id = ? AND sp.method = 'efectivo' AND s.status = 'completada'
  `).get(cashRow.id) as { total: number }

  const refundsInCash = db.prepare(`
    SELECT COALESCE(SUM(sp.amount), 0) as total
    FROM sale_payments sp
    JOIN sales s ON sp.sale_id = s.id
    WHERE s.cash_session_id = ? AND sp.method = 'efectivo' AND s.status = 'anulada'
  `).get(cashRow.id) as { total: number }

  const expectedBalance = cashRow.opening_balance + (salesInCash.total || 0) - (refundsInCash.total || 0)
  const difference = data.closingBalance - expectedBalance

  db.prepare(`
    UPDATE cash_sessions SET
      status           = 'cerrada',
      closing_balance  = ?,
      expected_balance = ?,
      difference       = ?,
      closed_at        = datetime('now','localtime'),
      notes            = COALESCE(?, notes)
    WHERE id = ?
  `).run(data.closingBalance, expectedBalance, difference, data.notes ?? null, cashRow.id)

  auditLog('CASH_CLOSE', 'cash', cashRow.id, cashRow, {
    closingBalance: data.closingBalance,
    expectedBalance,
    difference,
  })

  return getCashSessionById(cashRow.id)
}

// ── Obtener sesión por ID ───────────────────────────────────
export function getCashSessionById(id: number): IpcResponse<CashSession> {
  const db = getSqlite()
  const row = db.prepare(`
    SELECT cs.*, u.full_name as user_name
    FROM cash_sessions cs
    LEFT JOIN users u ON cs.user_id = u.id
    WHERE cs.id = ?
  `).get(id) as any

  if (!row) return { success: false, error: 'Sesión de caja no encontrada' }
  return { success: true, data: mapCashSession(row) }
}

// ── Historial de cierres ─────────────────────────────────────
export function listCashHistory(params?: {
  userId?: number
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}): IpcResponse<PaginatedResult<CashSession>> {
  const db       = getSqlite()
  const page     = params?.page     ?? 1
  const pageSize = params?.pageSize ?? 20
  const offset   = (page - 1) * pageSize

  let where = 'WHERE 1=1'
  const args: unknown[] = []

  if (params?.userId) {
    where += ` AND cs.user_id = ?`
    args.push(params.userId)
  }
  if (params?.startDate) {
    where += ` AND date(cs.opened_at) >= ?`
    args.push(params.startDate)
  }
  if (params?.endDate) {
    where += ` AND date(cs.opened_at) <= ?`
    args.push(params.endDate)
  }

  const total = (db.prepare(`
    SELECT COUNT(*) as c FROM cash_sessions cs ${where}
  `).get(...args) as { c: number }).c

  const rows = db.prepare(`
    SELECT cs.*, u.full_name as user_name
    FROM cash_sessions cs
    LEFT JOIN users u ON cs.user_id = u.id
    ${where}
    ORDER BY cs.opened_at DESC
    LIMIT ? OFFSET ?
  `).all(...args, pageSize, offset) as any[]

  return {
    success: true,
    data: {
      data: rows.map(mapCashSession),
      total,
      page,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// ── Resumen de ventas por método de pago en sesión activa ────
export function getCashSessionSummary(sessionId: number): IpcResponse<{
  session: CashSession
  paymentsByMethod: { method: string; amount: number; count: number }[]
  salesCount: number
  totalSales: number
  totalReturns: number
}> {
  const db = getSqlite()

  const sessionRes = getCashSessionById(sessionId)
  if (!sessionRes.success) {
    return { success: false, error: sessionRes.error }
  }

  // Pagos por método
  const payments = db.prepare(`
    SELECT 
      sp.method,
      COALESCE(SUM(sp.amount), 0) as amount,
      COUNT(*) as count
    FROM sale_payments sp
    JOIN sales s ON sp.sale_id = s.id
    WHERE s.cash_session_id = ? AND s.status = 'completada'
    GROUP BY sp.method
    ORDER BY amount DESC
  `).all(sessionId) as any[]

  // Totales
  const salesStats = db.prepare(`
    SELECT 
      COUNT(*) as sales_count,
      COALESCE(SUM(total), 0) as total_sales,
      COALESCE(SUM(CASE WHEN status = 'anulada' THEN total ELSE 0 END), 0) as total_returns
    FROM sales
    WHERE cash_session_id = ? AND status IN ('completada', 'anulada')
  `).get(sessionId) as any

  return {
    success: true,
    data: {
      session: sessionRes.data!,
      paymentsByMethod: payments.map(p => ({
        method: p.method,
        amount: p.amount,
        count: p.count,
      })),
      salesCount: salesStats.sales_count,
      totalSales: salesStats.total_sales,
      totalReturns: salesStats.total_returns,
    },
  }
}

// ── Helpers ──────────────────────────────────────────────────
function mapCashSession(r: any): CashSession {
  return {
    id:              r.id,
    userId:          r.user_id,
    userName:        r.user_name,
    status:          r.status,
    openingBalance:  r.opening_balance,
    closingBalance:  r.closing_balance,
    expectedBalance: r.expected_balance,
    difference:      r.difference,
    openedAt:        r.opened_at,
    closedAt:        r.closed_at,
    notes:           r.notes,
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