import { getSqlite } from '../../database/connection'
import { getCurrentSession } from '../auth/auth.service'
import type { IpcResponse, Credit, CreditPayment, PaginatedResult } from '../../../shared/types/index'

// ============================================================
// CARTERA / CRÉDITOS — Abonos, aging, alertas
// ============================================================

const DAY_MS = 86400000

function todayColombia(): string {
    return new Date().toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr + 'T00:00:00')
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
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

function recalcCreditStatus(credit: any): string {
    const today = todayColombia()
    const due = credit.due_date
    if (credit.balance <= 0) return 'al_dia'
    if (due < today) return 'vencido'
    if (due <= addDays(today, 5)) return 'proximo'
    return 'al_dia'
}

// ── Listar créditos con filtros ───────────────────────────
export function listCredits(params?: {
    clientId?: number
    status?: string
    search?: string
    page?: number
    pageSize?: number
}): IpcResponse<PaginatedResult<Credit>> {
    const db = getSqlite()
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    const offset = (page - 1) * pageSize

    let where = 'WHERE c.balance > 0'
    const args: unknown[] = []

    if (params?.clientId) {
        where += ' AND c.client_id = ?'
        args.push(params.clientId)
    }
    if (params?.status) {
        where += ' AND c.status = ?'
        args.push(params.status)
    }
    if (params?.search) {
        where += ` AND (cl.name LIKE ? OR c.invoice_number LIKE ?)`
        args.push(`%${params.search}%`, `%${params.search}%`)
    }

    const total = (db.prepare(`SELECT COUNT(*) as cnt FROM credits c LEFT JOIN clients cl ON c.client_id = cl.id ${where}`).get(...args) as { cnt: number }).cnt

    const rows = db.prepare(`
        SELECT 
            c.*,
            cl.name as client_name
        FROM credits c
        LEFT JOIN clients cl ON c.client_id = cl.id
        ${where}
        ORDER BY 
            CASE c.status 
                WHEN 'vencido' THEN 1 
                WHEN 'proximo' THEN 2 
                ELSE 3 
            END,
            c.due_date ASC
        LIMIT ? OFFSET ?
    `).all(...args, pageSize, offset) as any[]

    // Actualizar estados stale
    for (const row of rows) {
        const newStatus = recalcCreditStatus(row)
        if (newStatus !== row.status) {
            db.prepare(`UPDATE credits SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
                .run(newStatus, row.id)
            row.status = newStatus
        }
    }

    return {
        success: true,
        data: {
            data: rows.map(r => ({
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
            total,
            page,
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize),
        },
    }
}

// ── Obtener un crédito con sus pagos ──────────────────────
export function getCredit(id: number): IpcResponse<{ credit: Credit; payments: CreditPayment[] }> {
    const db = getSqlite()
    const credit = db.prepare(`
        SELECT c.*, cl.name as client_name 
        FROM credits c 
        LEFT JOIN clients cl ON c.client_id = cl.id 
        WHERE c.id = ?
    `).get(id) as any

    if (!credit) return { success: false, error: 'Crédito no encontrado' }

    const newStatus = recalcCreditStatus(credit)
    if (newStatus !== credit.status) {
        db.prepare(`UPDATE credits SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
            .run(newStatus, id)
        credit.status = newStatus
    }

    const payments = db.prepare(`
        SELECT cp.*, u.full_name as user_name
        FROM credit_payments cp
        LEFT JOIN users u ON cp.user_id = u.id
        WHERE cp.credit_id = ?
        ORDER BY cp.created_at DESC
    `).all(id) as any[]

    return {
        success: true,
        data: {
            credit: {
                id: credit.id,
                clientId: credit.client_id,
                clientName: credit.client_name,
                saleId: credit.sale_id,
                workOrderId: credit.work_order_id,
                invoiceNumber: credit.invoice_number,
                originalAmount: credit.original_amount,
                paidAmount: credit.paid_amount,
                balance: credit.balance,
                dueDate: credit.due_date,
                status: credit.status,
                createdAt: credit.created_at,
                updatedAt: credit.updated_at,
            },
            payments: payments.map(p => ({
                id: p.id,
                creditId: p.credit_id,
                amount: p.amount,
                method: p.method,
                reference: p.reference,
                notes: p.notes,
                userId: p.user_id,
                createdAt: p.created_at,
            })),
        },
    }
}

// ── Registrar abono ───────────────────────────────────────
export function payCredit(data: {
    creditId: number
    amount: number
    method: string
    reference?: string
    notes?: string
}): IpcResponse {
    const db = getSqlite()
    const session = getCurrentSession()
    if (!session) return { success: false, error: 'No hay sesión activa' }

    if (data.amount <= 0) return { success: false, error: 'El abono debe ser mayor a cero' }

    const credit = db.prepare(`SELECT * FROM credits WHERE id = ?`).get(data.creditId) as any
    if (!credit) return { success: false, error: 'Crédito no encontrado' }

    if (data.amount > credit.balance) {
        return { success: false, error: `El abono excede el saldo de ${credit.balance.toLocaleString('es-CO')}` }
    }

    const newPaid = credit.paid_amount + data.amount
    const newBalance = credit.original_amount - newPaid
    const newStatus = newBalance <= 0 ? 'al_dia' : recalcCreditStatus({ ...credit, balance: newBalance })

    db.transaction(() => {
        // Insertar pago
        db.prepare(`
            INSERT INTO credit_payments (credit_id, amount, method, reference, notes, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(data.creditId, data.amount, data.method, data.reference ?? null, data.notes ?? null, session.id)

        // Actualizar crédito
        db.prepare(`
            UPDATE credits SET
                paid_amount = ?,
                balance = ?,
                status = ?,
                updated_at = datetime('now','localtime')
            WHERE id = ?
        `).run(newPaid, newBalance, newStatus, data.creditId)

        // Si viene de una venta, actualizar payment_status de la venta
        if (credit.sale_id) {
            const sale = db.prepare(`SELECT total, paid FROM sales WHERE id = ?`).get(credit.sale_id) as any
            if (sale) {
                const newSalePaid = sale.paid + data.amount
                const saleStatus = newSalePaid >= sale.total ? 'pagado' : (newSalePaid > 0 ? 'parcial' : 'pendiente')
                db.prepare(`UPDATE sales SET paid = ?, payment_status = ? WHERE id = ?`)
                    .run(newSalePaid, saleStatus, credit.sale_id)
            }
        }
    })()

    auditLog('PAY_CREDIT', 'credits', data.creditId, { balance: credit.balance }, { balance: newBalance })

    return { success: true, message: 'Abono registrado correctamente' }
}

// ── Aging report ──────────────────────────────────────────
export function creditsAging(): IpcResponse<{
    totalPortfolio: number
    buckets: { label: string; count: number; amount: number; color: string }[]
    clients: { clientId: number; clientName: string; total: number; oldestDue: string }[]
}> {
    const db = getSqlite()
    const today = todayColombia()

    const allCredits = db.prepare(`
        SELECT c.*, cl.name as client_name
        FROM credits c
        LEFT JOIN clients cl ON c.client_id = cl.id
        WHERE c.balance > 0
        ORDER BY c.due_date ASC
    `).all() as any[]

    const buckets = [
        { label: 'Al día', min: -9999, max: 0, count: 0, amount: 0, color: '#10b981' },
        { label: '1-30 días', min: 1, max: 30, count: 0, amount: 0, color: '#f59e0b' },
        { label: '31-60 días', min: 31, max: 60, count: 0, amount: 0, color: '#f97316' },
        { label: '61-90 días', min: 61, max: 90, count: 0, amount: 0, color: '#ef4444' },
        { label: '90+ días', min: 91, max: 9999, count: 0, amount: 0, color: '#7f1d1d' },
    ]

    const clientMap = new Map<number, { clientId: number; clientName: string; total: number; oldestDue: string }>()

    let totalPortfolio = 0

    for (const c of allCredits) {
        const due = new Date(c.due_date + 'T00:00:00').getTime()
        const now = new Date(today + 'T00:00:00').getTime()
        const daysDiff = Math.floor((now - due) / DAY_MS)

        totalPortfolio += c.balance

        for (const b of buckets) {
            if (daysDiff >= b.min && daysDiff <= b.max) {
                b.count++
                b.amount += c.balance
                break
            }
        }

        const existing = clientMap.get(c.client_id)
        if (existing) {
            existing.total += c.balance
            if (c.due_date < existing.oldestDue) existing.oldestDue = c.due_date
        } else {
            clientMap.set(c.client_id, {
                clientId: c.client_id,
                clientName: c.client_name,
                total: c.balance,
                oldestDue: c.due_date,
            })
        }
    }

    return {
        success: true,
        data: {
            totalPortfolio,
            buckets,
            clients: Array.from(clientMap.values()).sort((a, b) => b.total - a.total),
        },
    }
}

// ── Crear crédito desde venta (llamado internamente) ─────
export function createCreditFromSale(data: {
    clientId: number
    saleId: number
    invoiceNumber: string
    originalAmount: number
    dueDate: string
}): IpcResponse {
    const db = getSqlite()

    db.prepare(`
        INSERT INTO credits (client_id, sale_id, invoice_number, original_amount, paid_amount, balance, due_date, status)
        VALUES (?, ?, ?, ?, 0, ?, ?, 'al_dia')
    `).run(data.clientId, data.saleId, data.invoiceNumber, data.originalAmount, data.originalAmount, data.dueDate)

    return { success: true }
}