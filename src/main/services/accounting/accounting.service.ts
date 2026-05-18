import { getSqlite } from '../../database/connection'
import { getCurrentSession } from '../auth/auth.service'
import type { IpcResponse, AccountingAccount, JournalEntry, PaginatedResult } from '../../../shared/types/index'

// ============================================================
// CONTABILIDAD — PUC, asientos automáticos, libros, balance
// ============================================================

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

function nextEntryNumber(db: any): string {
    const year = new Date().getFullYear()
    const row = db.prepare(`SELECT COUNT(*) as c FROM journal_entries WHERE date >= ?`).get(`${year}-01-01`) as { c: number }
    return `A-${year}-${String(row.c + 1).padStart(5, '0')}`
}

// ── Obtener plan de cuentas ───────────────────────────────
export function getAccounts(): IpcResponse<AccountingAccount[]> {
    const db = getSqlite()
    const rows = db.prepare(`
        SELECT * FROM accounting_accounts ORDER BY code ASC
    `).all() as any[]

    return {
        success: true,
        data: rows.map(r => ({
            id: r.id,
            code: r.code,
            name: r.name,
            type: r.type,
            parentCode: r.parent_code,
            isActive: Boolean(r.is_active),
            allowsMovement: Boolean(r.allows_movement),
        })),
    }
}

// ── Crear asiento contable ────────────────────────────────
export function createJournalEntry(data: {
    date: string
    description: string
    reference?: string
    referenceType?: string
    referenceId?: number
    lines: { accountCode: string; debit: number; credit: number; description?: string }[]
}): IpcResponse<{ entryId: number; entryNumber: string }> {
    const db = getSqlite()
    const session = getCurrentSession()
    if (!session) return { success: false, error: 'No hay sesión activa' }

    if (!data.lines || data.lines.length < 2) {
        return { success: false, error: 'Un asiento requiere al menos 2 líneas' }
    }

    const totalDebit = data.lines.reduce((s, l) => s + (l.debit || 0), 0)
    const totalCredit = data.lines.reduce((s, l) => s + (l.credit || 0), 0)

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
        return { success: false, error: `Descuadre: Débito ${totalDebit} ≠ Crédito ${totalCredit}` }
    }

    if (totalDebit === 0) {
        return { success: false, error: 'El asiento no puede estar en cero' }
    }

    // Validar que las cuentas permitan movimiento
    for (const line of data.lines) {
        const acc = db.prepare(`SELECT allows_movement FROM accounting_accounts WHERE code = ?`).get(line.accountCode) as any
        if (!acc) return { success: false, error: `Cuenta ${line.accountCode} no existe` }
        if (!acc.allows_movement) return { success: false, error: `Cuenta ${line.accountCode} no permite movimientos directos` }
    }

    const entryNumber = nextEntryNumber(db)

    const entryId = db.transaction(() => {
        const result = db.prepare(`
            INSERT INTO journal_entries (entry_number, date, description, reference, reference_type, reference_id, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(entryNumber, data.date, data.description, data.reference ?? null, data.referenceType ?? null, data.referenceId ?? null, session.id)

        const eid = result.lastInsertRowid as number

        const lineStmt = db.prepare(`
            INSERT INTO journal_lines (entry_id, account_code, debit, credit, description)
            VALUES (?, ?, ?, ?, ?)
        `)

        for (const line of data.lines) {
            if (line.debit > 0 || line.credit > 0) {
                lineStmt.run(eid, line.accountCode, line.debit || 0, line.credit || 0, line.description ?? null)
            }
        }

        return eid
    })()

    auditLog('CREATE_ENTRY', 'accounting', entryId, null, { entryNumber, description: data.description })

    return { success: true, data: { entryId, entryNumber } }
}

// ── Asiento automático: VENTA ─────────────────────────────
export function autoEntrySale(saleId: number, data: {
    date: string
    subtotal: number
    tax: number
    total: number
    costOfGoods: number
    paymentMethod: string
    clientId?: number
}): IpcResponse {
    const lines: { accountCode: string; debit: number; credit: number; description: string }[] = []

    // Débito: Caja/Banco o Clientes
    if (data.paymentMethod === 'credito' && data.clientId) {
        lines.push({ accountCode: '1305', debit: data.total, credit: 0, description: `Venta a crédito #${saleId}` })
    } else {
        lines.push({ accountCode: '1105', debit: data.total, credit: 0, description: `Venta contado #${saleId}` })
    }

    // Crédito: Ingresos
    lines.push({ accountCode: '4135', debit: 0, credit: data.subtotal, description: `Ingreso por venta #${saleId}` })

    // Crédito: IVA
    if (data.tax > 0) {
        lines.push({ accountCode: '2408', debit: 0, credit: data.tax, description: `IVA generado venta #${saleId}` })
    }

    // Costo de ventas (si aplica)
    if (data.costOfGoods > 0) {
        lines.push({ accountCode: '6135', debit: data.costOfGoods, credit: 0, description: `Costo venta #${saleId}` })
        lines.push({ accountCode: '1435', debit: 0, credit: data.costOfGoods, description: `Salida inventario venta #${saleId}` })
    }

    return createJournalEntry({
        date: data.date,
        description: `Asiento automático - Venta #${saleId}`,
        reference: String(saleId),
        referenceType: 'sale',
        referenceId: saleId,
        lines,
    })
}

// ── Asiento automático: COMPRA ────────────────────────────
export function autoEntryPurchase(purchaseId: number, data: {
    date: string
    subtotal: number
    tax: number
    total: number
    isCredit: boolean
}): IpcResponse {
    const lines: { accountCode: string; debit: number; credit: number; description: string }[] = []

    // Débito: Inventario
    lines.push({ accountCode: '1435', debit: data.subtotal, credit: 0, description: `Compra #${purchaseId}` })

    // Débito: IVA descontable (si aplica)
    if (data.tax > 0) {
        lines.push({ accountCode: '2408', debit: data.tax, credit: 0, description: `IVA descontable compra #${purchaseId}` })
    }

    // Crédito: Proveedores o Caja
    if (data.isCredit) {
        lines.push({ accountCode: '2205', debit: 0, credit: data.total, description: `Cuenta por pagar compra #${purchaseId}` })
    } else {
        lines.push({ accountCode: '1105', debit: 0, credit: data.total, description: `Pago contado compra #${purchaseId}` })
    }

    return createJournalEntry({
        date: data.date,
        description: `Asiento automático - Compra #${purchaseId}`,
        reference: String(purchaseId),
        referenceType: 'purchase',
        referenceId: purchaseId,
        lines,
    })
}

// ── Asiento automático: PAGO CRÉDITO CLIENTE ──────────────
export function autoEntryCreditPayment(paymentId: number, data: {
    date: string
    amount: number
    method: string
    clientId: number
}): IpcResponse {
    const lines: { accountCode: string; debit: number; credit: number; description: string }[] = []

    // Débito: Caja/Banco
    const cashAccount = data.method === 'transferencia' ? '1110' : '1105'
    lines.push({ accountCode: cashAccount, debit: data.amount, credit: 0, description: `Recaudo crédito cliente ${data.clientId}` })

    // Crédito: Clientes
    lines.push({ accountCode: '1305', debit: 0, credit: data.amount, description: `Abono cuenta cliente ${data.clientId}` })

    return createJournalEntry({
        date: data.date,
        description: `Asiento automático - Abono crédito`,
        reference: String(paymentId),
        referenceType: 'credit_payment',
        referenceId: paymentId,
        lines,
    })
}

// ── Libro diario ────────────────────────────────────────
export function getJournal(params?: {
    startDate?: string
    endDate?: string
    accountCode?: string
    page?: number
    pageSize?: number
}): IpcResponse<PaginatedResult<JournalEntry>> {
    const db = getSqlite()
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    const offset = (page - 1) * pageSize

    let where = 'WHERE 1=1'
    const args: unknown[] = []

    if (params?.startDate) {
        where += ' AND je.date >= ?'
        args.push(params.startDate)
    }
    if (params?.endDate) {
        where += ' AND je.date <= ?'
        args.push(params.endDate)
    }
    if (params?.accountCode) {
        where += ` AND je.id IN (SELECT entry_id FROM journal_lines WHERE account_code = ?)`
        args.push(params.accountCode)
    }

    const total = (db.prepare(`SELECT COUNT(*) as c FROM journal_entries je ${where}`).get(...args) as { c: number }).c

    const rows = db.prepare(`
        SELECT je.*, u.full_name as user_name
        FROM journal_entries je
        LEFT JOIN users u ON je.user_id = u.id
        ${where}
        ORDER BY je.date DESC, je.entry_number DESC
        LIMIT ? OFFSET ?
    `).all(...args, pageSize, offset) as any[]

    const entries: JournalEntry[] = []

    for (const row of rows) {
        const lines = db.prepare(`
            SELECT jl.*, aa.name as account_name
            FROM journal_lines jl
            LEFT JOIN accounting_accounts aa ON jl.account_code = aa.code
            WHERE jl.entry_id = ?
            ORDER BY jl.debit DESC, jl.credit ASC
        `).all(row.id) as any[]

        entries.push({
            id: row.id,
            entryNumber: row.entry_number,
            date: row.date,
            description: row.description,
            reference: row.reference,
            referenceType: row.reference_type,
            userId: row.user_id,
            createdAt: row.created_at,
            lines: lines.map(l => ({
                id: l.id,
                entryId: l.entry_id,
                accountCode: l.account_code,
                accountName: l.account_name,
                debit: l.debit,
                credit: l.credit,
                description: l.description,
            })),
        })
    }

    return {
        success: true,
        data: {
            data: entries,
            total,
            page,
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize),
        },
    }
}

// ── Libro mayor por cuenta ────────────────────────────────
export function getLedger(accountCode: string, params?: {
    startDate?: string
    endDate?: string
}): IpcResponse<{
    account: AccountingAccount
    movements: { date: string; entryNumber: string; description: string; debit: number; credit: number; balance: number }[]
    totalDebit: number
    totalCredit: number
    finalBalance: number
}> {
    const db = getSqlite()

    const account = db.prepare(`SELECT * FROM accounting_accounts WHERE code = ?`).get(accountCode) as any
    if (!account) return { success: false, error: 'Cuenta no encontrada' }

    let where = 'WHERE jl.account_code = ?'
    const args: unknown[] = [accountCode]

    if (params?.startDate) {
        where += ' AND je.date >= ?'
        args.push(params.startDate)
    }
    if (params?.endDate) {
        where += ' AND je.date <= ?'
        args.push(params.endDate)
    }

    const rows = db.prepare(`
        SELECT je.date, je.entry_number, je.description, jl.debit, jl.credit, jl.description as line_desc
        FROM journal_lines jl
        JOIN journal_entries je ON jl.entry_id = je.id
        ${where}
        ORDER BY je.date ASC, je.entry_number ASC
    `).all(...args) as any[]

    let balance = 0
    const movements: { date: string; entryNumber: string; description: string; debit: number; credit: number; balance: number }[] = []
    let totalDebit = 0
    let totalCredit = 0

    const isDebitAccount = ['activo', 'gasto', 'costo'].includes(account.type)

    for (const row of rows) {
        totalDebit += row.debit
        totalCredit += row.credit

        if (isDebitAccount) {
            balance += row.debit - row.credit
        } else {
            balance += row.credit - row.debit
        }

        movements.push({
            date: row.date,
            entryNumber: row.entry_number,
            description: row.line_desc || row.description,
            debit: row.debit,
            credit: row.credit,
            balance,
        })
    }

    return {
        success: true,
        data: {
            account: {
                id: account.id,
                code: account.code,
                name: account.name,
                type: account.type,
                parentCode: account.parent_code,
                isActive: Boolean(account.is_active),
                allowsMovement: Boolean(account.allows_movement),
            },
            movements,
            totalDebit,
            totalCredit,
            finalBalance: balance,
        },
    }
}

// ── Balance general ───────────────────────────────────────
export function getBalance(params?: {
    date?: string
}): IpcResponse<{
    date: string
    activos: { code: string; name: string; balance: number }[]
    pasivos: { code: string; name: string; balance: number }[]
    patrimonio: { code: string; name: string; balance: number }[]
    totalActivos: number
    totalPasivos: number
    totalPatrimonio: number
    cuadre: boolean
}> {
    const db = getSqlite()
    const asOfDate = params?.date ?? todayColombia()

    const accounts = db.prepare(`
        SELECT aa.code, aa.name, aa.type, aa.allows_movement
        FROM accounting_accounts aa
        WHERE aa.allows_movement = 1 AND aa.is_active = 1
        ORDER BY aa.code ASC
    `).all() as any[]

    const activos: { code: string; name: string; balance: number }[] = []
    const pasivos: { code: string; name: string; balance: number }[] = []
    const patrimonio: { code: string; name: string; balance: number }[] = []

    let totalActivos = 0
    let totalPasivos = 0
    let totalPatrimonio = 0

    for (const acc of accounts) {
        const row = db.prepare(`
            SELECT COALESCE(SUM(jl.debit), 0) as total_debit, COALESCE(SUM(jl.credit), 0) as total_credit
            FROM journal_lines jl
            JOIN journal_entries je ON jl.entry_id = je.id
            WHERE jl.account_code = ? AND je.date <= ?
        `).get(acc.code, asOfDate) as any

        let balance = 0
        if (['activo', 'gasto', 'costo'].includes(acc.type)) {
            balance = row.total_debit - row.total_credit
        } else {
            balance = row.total_credit - row.total_debit
        }

        if (Math.abs(balance) < 0.01) continue

        const item = { code: acc.code, name: acc.name, balance }

        if (acc.type === 'activo') {
            activos.push(item)
            totalActivos += balance
        } else if (acc.type === 'pasivo') {
            pasivos.push(item)
            totalPasivos += balance
        } else if (acc.type === 'patrimonio') {
            patrimonio.push(item)
            totalPatrimonio += balance
        }
    }

    return {
        success: true,
        data: {
            date: asOfDate,
            activos,
            pasivos,
            patrimonio,
            totalActivos,
            totalPasivos,
            totalPatrimonio,
            cuadre: Math.abs(totalActivos - (totalPasivos + totalPatrimonio)) < 0.01,
        },
    }
}

function todayColombia(): string {
    return new Date().toISOString().split('T')[0]
}