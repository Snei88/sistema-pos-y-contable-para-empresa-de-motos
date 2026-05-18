import { getSqlite } from '../../database/connection'
import type { IpcResponse } from '../../../shared/types/index'
import * as XLSX from 'xlsx'

// ============================================================
// REPORTES + EXPORTACIÓN EXCEL
// ============================================================

function formatDateColombia(d: string): string {
    return new Date(d).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
}

function formatDateTimeColombia(d: string): string {
    return new Date(d).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
}

function xlsx(): typeof XLSX {
    return ((XLSX as any).default ?? XLSX) as typeof XLSX
}

function buildWorkbook(sheetName: string, headers: string[], rows: any[][]): XLSX.WorkBook {
    const lib = xlsx()
    const ws = lib.utils.aoa_to_sheet([headers, ...rows])
    const wb = lib.utils.book_new()
    lib.utils.book_append_sheet(wb, ws, sheetName)
    return wb
}

function saveWorkbook(wb: XLSX.WorkBook, fileName: string): string {
    const { app } = require('electron')
    const { join } = require('path')
    const exportDir = join(app.getPath('downloads'), 'manuel-motos-reportes')
    if (!require('fs').existsSync(exportDir)) {
        require('fs').mkdirSync(exportDir, { recursive: true })
    }
    const filePath = join(exportDir, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`)
    xlsx().writeFile(wb, filePath)
    return filePath
}

type ImportResult = { filePath: string; imported: number; skipped: number; duplicates: number; errors: string[] }

function pickExcelFile(): string | null {
    const { dialog } = require('electron')
    const result = dialog.showOpenDialogSync({
        title: 'Seleccionar archivo Excel',
        properties: ['openFile'],
        filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }],
    })
    return result?.[0] ?? null
}

function readExcelRows(filePath: string): Record<string, unknown>[] {
    const lib = xlsx()
    const wb = lib.readFile(filePath)
    const sheet = wb.Sheets[wb.SheetNames[0]]
    return lib.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[]
}

function normalizeKey(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function cell(row: Record<string, unknown>, names: string[]): string {
    const wanted = new Set(names.map(normalizeKey))
    const found = Object.entries(row).find(([key]) => wanted.has(normalizeKey(key)))
    return found ? String(found[1] ?? '').trim() : ''
}

function num(value: string, fallback = 0): number {
    if (!value) return fallback
    const parsed = Number(String(value).replace(/\$/g, '').replace(/\./g, '').replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeDocumentType(value: string): string | null {
    const key = normalizeKey(value)
    if (!key) return null
    if (['cedula', 'cc', 'ciudadania', 'cedulaciudadania'].includes(key)) return 'cedula'
    if (['nit', 'nif'].includes(key)) return 'nit'
    if (['pasaporte', 'passport'].includes(key)) return 'pasaporte'
    return 'otro'
}

function normalizePurchaseStatus(value: string): string {
    const key = normalizeKey(value)
    if (['recibida', 'recibido', 'received'].includes(key)) return 'recibida'
    if (['parcial', 'partial'].includes(key)) return 'parcial'
    if (['anulada', 'anulado', 'cancelada', 'cancelado'].includes(key)) return 'anulada'
    return 'pendiente'
}

function normalizePaymentStatus(value: string): string {
    const key = normalizeKey(value)
    if (['pagado', 'pagada', 'paid'].includes(key)) return 'pagado'
    if (['parcial', 'partial'].includes(key)) return 'parcial'
    return 'pendiente'
}

function yesNo(value: unknown): string {
    return value ? 'Sí' : 'No'
}

// ── Exportar Ventas ───────────────────────────────────────
export function exportSales(params?: {
    startDate?: string
    endDate?: string
    status?: string
    paymentStatus?: string
}): IpcResponse<{ filePath: string; count: number }> {
    const db = getSqlite()
    let where = 'WHERE 1=1'
    const args: unknown[] = []

    if (params?.startDate) { where += ' AND date(s.created_at) >= ?'; args.push(params.startDate) }
    if (params?.endDate) { where += ' AND date(s.created_at) <= ?'; args.push(params.endDate) }
    if (params?.status) { where += ' AND s.status = ?'; args.push(params.status) }
    if (params?.paymentStatus) { where += ' AND s.payment_status = ?'; args.push(params.paymentStatus) }

    const rows = db.prepare(`
        SELECT 
            s.invoice_number, s.created_at, s.status, s.payment_status,
            cl.name as client_name, u.full_name as user_name,
            s.subtotal, s.discount, s.tax, s.total, s.paid, s.change
        FROM sales s
        LEFT JOIN clients cl ON s.client_id = cl.id
        LEFT JOIN users u ON s.user_id = u.id
        ${where}
        ORDER BY s.created_at DESC
    `).all(...args) as any[]

    const headers = ['Factura', 'Fecha', 'Estado', 'Pago', 'Cliente', 'Cajero', 'Subtotal', 'Descuento', 'IVA', 'Total', 'Pagado', 'Cambio']
    const data = rows.map(r => [
        r.invoice_number,
        formatDateTimeColombia(r.created_at),
        r.status,
        r.payment_status,
        r.client_name || 'Ocasional',
        r.user_name,
        r.subtotal,
        r.discount,
        r.tax,
        r.total,
        r.paid,
        r.change,
    ])

    const wb = buildWorkbook('Ventas', headers, data)
    const filePath = saveWorkbook(wb, 'ventas')

    return { success: true, data: { filePath, count: rows.length } }
}

// ── Exportar Inventario ───────────────────────────────────
export function exportInventory(params?: {
    search?: string
    categoryId?: number
    status?: string
    lowStock?: boolean
}): IpcResponse<{ filePath: string; count: number }> {
    const db = getSqlite()
    let where = 'WHERE p.deleted_at IS NULL'
    const args: unknown[] = []

    if (params?.search) {
        where += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)'
        const q = `%${params.search}%`
        args.push(q, q, q)
    }
    if (params?.categoryId) { where += ' AND p.category_id = ?'; args.push(params.categoryId) }
    if (params?.status) { where += ' AND p.status = ?'; args.push(params.status) }
    if (params?.lowStock) { where += ' AND p.stock <= p.min_stock' }

    const rows = db.prepare(`
        SELECT 
            p.code, p.barcode, p.name, c.name as category, s.name as supplier,
            p.cost_price, p.sale_price, p.stock, p.min_stock, p.unit, p.status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ${where}
        ORDER BY p.name ASC
    `).all(...args) as any[]

    const headers = ['Código', 'Barcode', 'Nombre', 'Categoría', 'Proveedor', 'Costo', 'Precio Venta', 'Stock', 'Stock Mín', 'Unidad', 'Estado']
    const data = rows.map(r => [
        r.code, r.barcode, r.name, r.category || '-', r.supplier || '-',
        r.cost_price, r.sale_price, r.stock, r.min_stock, r.unit, r.status,
    ])

    const wb = buildWorkbook('Inventario', headers, data)
    const filePath = saveWorkbook(wb, 'inventario')

    return { success: true, data: { filePath, count: rows.length } }
}

// ── Exportar Compras ──────────────────────────────────────
export function exportUsers(): IpcResponse<{ filePath: string; count: number }> {
    const db = getSqlite()
    const rows = db.prepare(`
        SELECT username, full_name, role, is_active, created_at, updated_at, last_login_at
        FROM users
        WHERE is_active = 1
        ORDER BY full_name ASC
    `).all() as any[]

    const roleLabels: Record<string, string> = {
        admin: 'Administrador',
        supervisor: 'Supervisor',
        cajero: 'Cajero',
        mecanico: 'Mecánico',
    }
    const headers = ['Usuario', 'Nombre completo', 'Rol', 'Activo', 'Creado', 'Actualizado', 'Último ingreso']
    const data = rows.map(r => [
        r.username,
        r.full_name,
        roleLabels[r.role] ?? r.role,
        r.is_active ? 'Sí' : 'No',
        formatDateTimeColombia(r.created_at),
        formatDateTimeColombia(r.updated_at),
        r.last_login_at ? formatDateTimeColombia(r.last_login_at) : '-',
    ])

    const wb = buildWorkbook('Usuarios', headers, data)
    const filePath = saveWorkbook(wb, 'usuarios')

    return { success: true, data: { filePath, count: rows.length } }
}

export function exportClients(params?: { search?: string }): IpcResponse<{ filePath: string; count: number }> {
    const db = getSqlite()
    let where = 'WHERE deleted_at IS NULL'
    const args: unknown[] = []

    if (params?.search) {
        where += ' AND (name LIKE ? OR document LIKE ? OR phone LIKE ?)'
        const q = `%${params.search}%`
        args.push(q, q, q)
    }

    const rows = db.prepare(`
        SELECT document_type, document, name, phone, email, address, notes, credit_limit, discount, is_active, created_at, updated_at
        FROM clients
        ${where}
        ORDER BY name ASC
    `).all(...args) as any[]

    const headers = ['Tipo documento', 'Documento', 'Nombre', 'Teléfono', 'Email', 'Dirección', 'Notas', 'Límite crédito', 'Descuento', 'Activo', 'Creado', 'Actualizado']
    const data = rows.map(r => [
        r.document_type || '-',
        r.document || '-',
        r.name,
        r.phone || '-',
        r.email || '-',
        r.address || '-',
        r.notes || '-',
        r.credit_limit,
        r.discount,
        yesNo(r.is_active),
        formatDateTimeColombia(r.created_at),
        formatDateTimeColombia(r.updated_at),
    ])

    const wb = buildWorkbook('Clientes', headers, data)
    const filePath = saveWorkbook(wb, 'clientes')

    return { success: true, data: { filePath, count: rows.length } }
}

export function importInventory(): IpcResponse<ImportResult> {
    const filePath = pickExcelFile()
    if (!filePath) return { success: false, error: 'Importación cancelada' }

    const db = getSqlite()
    const rows = readExcelRows(filePath)
    const result: ImportResult = { filePath, imported: 0, skipped: 0, duplicates: 0, errors: [] }

    const findCategory = db.prepare(`SELECT id FROM categories WHERE lower(name) = lower(?) AND is_active = 1`)
    const createCategory = db.prepare(`INSERT INTO categories (name) VALUES (?)`)
    const findSupplier = db.prepare(`SELECT id FROM suppliers WHERE lower(name) = lower(?) AND is_active = 1`)
    const createSupplier = db.prepare(`INSERT INTO suppliers (name) VALUES (?)`)
    const findProduct = db.prepare(`SELECT id FROM products WHERE deleted_at IS NULL AND (lower(name) = lower(?) OR code = ?)`)
    const insertProduct = db.prepare(`
        INSERT INTO products (code, barcode, name, category_id, supplier_id, cost_price, sale_price, stock, min_stock, unit, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const tx = db.transaction(() => {
        rows.forEach((row, index) => {
            const name = cell(row, ['nombre', 'producto', 'name'])
            const code = cell(row, ['codigo', 'código', 'code']) || `IMP-${Date.now()}-${index + 1}`
            if (!name) { result.skipped++; result.errors.push(`Fila ${index + 2}: nombre requerido`); return }
            if (findProduct.get(name, code)) { result.duplicates++; return }

            let categoryId: number | null = null
            const category = cell(row, ['categoria', 'categoría', 'category'])
            if (category) {
                let found = findCategory.get(category) as { id: number } | undefined
                if (!found) {
                    const created = createCategory.run(category)
                    found = { id: created.lastInsertRowid as number }
                }
                categoryId = found.id
            }

            let supplierId: number | null = null
            const supplier = cell(row, ['proveedor', 'supplier'])
            if (supplier && supplier !== '-') {
                let found = findSupplier.get(supplier) as { id: number } | undefined
                if (!found) {
                    const created = createSupplier.run(supplier)
                    found = { id: created.lastInsertRowid as number }
                }
                supplierId = found.id
            }

            insertProduct.run(
                code,
                cell(row, ['barcode', 'codigo barras', 'código barras']) || null,
                name,
                categoryId,
                supplierId,
                num(cell(row, ['costo', 'cost_price', 'costo unitario']), 0),
                num(cell(row, ['precio venta', 'precio', 'sale_price']), 0),
                num(cell(row, ['stock', 'existencias']), 0),
                num(cell(row, ['stock min', 'stock mínimo', 'min_stock']), 3),
                cell(row, ['unidad', 'unit']) || 'und',
                cell(row, ['estado', 'status']) || 'active',
            )
            result.imported++
        })
    })

    tx()
    return { success: true, data: result }
}

export function importClients(): IpcResponse<ImportResult> {
    const filePath = pickExcelFile()
    if (!filePath) return { success: false, error: 'Importación cancelada' }

    const db = getSqlite()
    const rows = readExcelRows(filePath)
    const result: ImportResult = { filePath, imported: 0, skipped: 0, duplicates: 0, errors: [] }
    const findClient = db.prepare(`SELECT id FROM clients WHERE deleted_at IS NULL AND (lower(name) = lower(?) OR (document IS NOT NULL AND document = ?))`)
    const insertClient = db.prepare(`
        INSERT INTO clients (document_type, document, name, phone, email, address, notes, credit_limit, discount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const tx = db.transaction(() => {
        rows.forEach((row, index) => {
            const name = cell(row, ['nombre', 'cliente', 'name'])
            const document = cell(row, ['documento', 'cedula', 'cédula', 'nit'])
            if (!name) { result.skipped++; result.errors.push(`Fila ${index + 2}: nombre requerido`); return }
            if (findClient.get(name, document || '__sin_documento__')) { result.duplicates++; return }
            insertClient.run(
                normalizeDocumentType(cell(row, ['tipo documento', 'document_type', 'tipo'])),
                document || null,
                name,
                cell(row, ['telefono', 'teléfono', 'phone']) || null,
                cell(row, ['email', 'correo']) || null,
                cell(row, ['direccion', 'dirección', 'address']) || null,
                cell(row, ['notas', 'notes']) || null,
                num(cell(row, ['limite credito', 'límite crédito', 'credit_limit']), 0),
                num(cell(row, ['descuento', 'discount']), 0),
            )
            result.imported++
        })
    })

    tx()
    return { success: true, data: result }
}

export function exportSuppliers(params?: { search?: string }): IpcResponse<{ filePath: string; count: number }> {
    const db = getSqlite()
    let where = 'WHERE is_active = 1'
    const args: unknown[] = []

    if (params?.search) {
        where += ' AND (name LIKE ? OR nit LIKE ? OR contact LIKE ? OR phone LIKE ? OR email LIKE ?)'
        const q = `%${params.search}%`
        args.push(q, q, q, q, q)
    }

    const rows = db.prepare(`
        SELECT name, nit, contact, phone, email, address, notes, created_at, updated_at
        FROM suppliers
        ${where}
        ORDER BY name ASC
    `).all(...args) as any[]

    const headers = ['Nombre', 'NIT', 'Contacto', 'Teléfono', 'Email', 'Dirección', 'Notas', 'Creado', 'Actualizado']
    const data = rows.map(r => [
        r.name,
        r.nit || '-',
        r.contact || '-',
        r.phone || '-',
        r.email || '-',
        r.address || '-',
        r.notes || '-',
        formatDateTimeColombia(r.created_at),
        formatDateTimeColombia(r.updated_at),
    ])

    const wb = buildWorkbook('Proveedores', headers, data)
    const filePath = saveWorkbook(wb, 'proveedores')

    return { success: true, data: { filePath, count: rows.length } }
}

export function exportMotos(params?: { search?: string }): IpcResponse<{ filePath: string; count: number }> {
    const db = getSqlite()
    let where = 'WHERE m.deleted_at IS NULL'
    const args: unknown[] = []

    if (params?.search) {
        where += ' AND (m.plate LIKE ? OR m.brand LIKE ? OR m.model LIKE ? OR c.name LIKE ?)'
        const q = `%${params.search}%`
        args.push(q, q, q, q)
    }

    const rows = db.prepare(`
        SELECT
            m.plate, m.brand, m.model, m.year, m.color, m.engine_number, m.chassis_number,
            c.name as client_name, m.notes, m.created_at, m.updated_at
        FROM motorcycles m
        LEFT JOIN clients c ON m.client_id = c.id
        ${where}
        ORDER BY m.created_at DESC
    `).all(...args) as any[]

    const headers = ['Placa', 'Marca', 'Modelo', 'Año', 'Color', 'N° Motor', 'N° Chasis', 'Propietario', 'Notas', 'Creado', 'Actualizado']
    const data = rows.map(r => [
        r.plate,
        r.brand,
        r.model,
        r.year || '-',
        r.color || '-',
        r.engine_number || '-',
        r.chassis_number || '-',
        r.client_name || '-',
        r.notes || '-',
        formatDateTimeColombia(r.created_at),
        formatDateTimeColombia(r.updated_at),
    ])

    const wb = buildWorkbook('Motos', headers, data)
    const filePath = saveWorkbook(wb, 'motos')

    return { success: true, data: { filePath, count: rows.length } }
}

export function exportPurchases(params?: {
    search?: string
    startDate?: string
    endDate?: string
    status?: string
    supplierId?: number
}): IpcResponse<{ filePath: string; count: number }> {
    const db = getSqlite()
    let where = 'WHERE 1=1'
    const args: unknown[] = []

    if (params?.search) {
        where += ' AND (p.invoice_number LIKE ? OR s.name LIKE ?)'
        const q = `%${params.search}%`
        args.push(q, q)
    }
    if (params?.startDate) { where += ' AND date(p.created_at) >= ?'; args.push(params.startDate) }
    if (params?.endDate) { where += ' AND date(p.created_at) <= ?'; args.push(params.endDate) }
    if (params?.status) { where += ' AND p.status = ?'; args.push(params.status) }
    if (params?.supplierId) { where += ' AND p.supplier_id = ?'; args.push(params.supplierId) }

    const rows = db.prepare(`
        SELECT 
            p.invoice_number, p.created_at, p.status, p.payment_status,
            s.name as supplier, u.full_name as user_name,
            p.subtotal, p.tax, p.total, p.paid
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        LEFT JOIN users u ON p.user_id = u.id
        ${where}
        ORDER BY p.created_at DESC
    `).all(...args) as any[]

    const headers = ['Factura', 'Fecha', 'Estado', 'Pago', 'Proveedor', 'Usuario', 'Subtotal', 'IVA', 'Total', 'Pagado']
    const data = rows.map(r => [
        r.invoice_number || '-', formatDateTimeColombia(r.created_at), r.status, r.payment_status,
        r.supplier, r.user_name, r.subtotal, r.tax, r.total, r.paid,
    ])

    const wb = buildWorkbook('Compras', headers, data)
    const filePath = saveWorkbook(wb, 'compras')

    return { success: true, data: { filePath, count: rows.length } }
}

export function importPurchases(): IpcResponse<ImportResult> {
    const filePath = pickExcelFile()
    if (!filePath) return { success: false, error: 'Importación cancelada' }

    const db = getSqlite()
    const rows = readExcelRows(filePath)
    const result: ImportResult = { filePath, imported: 0, skipped: 0, duplicates: 0, errors: [] }
    const sessionUser = db.prepare(`SELECT id FROM users WHERE is_active = 1 ORDER BY id LIMIT 1`).get() as { id: number } | undefined
    const userId = sessionUser?.id ?? 1

    const findSupplier = db.prepare(`SELECT id FROM suppliers WHERE lower(name) = lower(?) AND is_active = 1`)
    const createSupplier = db.prepare(`INSERT INTO suppliers (name) VALUES (?)`)
    const findProduct = db.prepare(`SELECT id FROM products WHERE deleted_at IS NULL AND (code = ? OR lower(name) = lower(?))`)
    const findPurchase = db.prepare(`SELECT id FROM purchases WHERE invoice_number = ? AND supplier_id = ?`)
    const insertPurchase = db.prepare(`
        INSERT INTO purchases (supplier_id, user_id, invoice_number, status, payment_status, subtotal, tax, total, paid, due_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const insertItem = db.prepare(`
        INSERT INTO purchase_items (purchase_id, product_id, product_name, quantity, unit_cost, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
    `)

    const grouped = new Map<string, { supplierName: string; invoice: string; dueDate: string; notes: string; rows: Record<string, unknown>[] }>()
    rows.forEach((row, index) => {
        const supplierName = cell(row, ['proveedor', 'supplier'])
        const invoice = cell(row, ['factura', 'invoice', 'invoice_number', 'numero factura', 'número factura'])
        if (!supplierName) { result.skipped++; result.errors.push(`Fila ${index + 2}: proveedor requerido`); return }
        const key = `${supplierName.toLowerCase()}|${invoice || `sin-factura-${index}`}`
        const current = grouped.get(key) ?? {
            supplierName,
            invoice,
            dueDate: cell(row, ['vencimiento', 'due_date']),
            notes: cell(row, ['notas', 'notes']),
            rows: [],
        }
        current.rows.push(row)
        grouped.set(key, current)
    })

    const tx = db.transaction(() => {
        grouped.forEach((group) => {
            let supplier = findSupplier.get(group.supplierName) as { id: number } | undefined
            if (!supplier) {
                const created = createSupplier.run(group.supplierName)
                supplier = { id: created.lastInsertRowid as number }
            }
            if (group.invoice && findPurchase.get(group.invoice, supplier.id)) { result.duplicates++; return }

            const items: { productId: number; productName: string; quantity: number; unitCost: number; subtotal: number }[] = []
            group.rows.forEach((row) => {
                const productRef = cell(row, ['codigo producto', 'código producto', 'codigo', 'código', 'producto', 'product'])
                const quantity = num(cell(row, ['cantidad', 'quantity']), 0)
                const unitCost = num(cell(row, ['costo unitario', 'unit_cost', 'costo']), 0)
                const hasItemData = Boolean(productRef) || quantity > 0 || unitCost > 0
                if (!hasItemData) return

                const product = findProduct.get(productRef, productRef) as { id: number } | undefined
                if (!product || quantity <= 0) {
                    result.skipped++
                    return
                }
                const productName = cell(row, ['producto', 'product']) || productRef
                items.push({ productId: product.id, productName, quantity, unitCost, subtotal: quantity * unitCost })
            })

            const firstRow = group.rows[0]
            const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
            const totalFromSheet = num(cell(firstRow, ['total']), 0)
            const tax = num(cell(firstRow, ['iva', 'tax']), itemsSubtotal > 0 ? itemsSubtotal * 0.19 : 0)
            const subtotal = itemsSubtotal || num(cell(firstRow, ['subtotal']), Math.max(0, totalFromSheet - tax))
            const total = totalFromSheet || subtotal + tax
            if (total <= 0 && subtotal <= 0 && items.length === 0) {
                result.skipped++
                result.errors.push(`Compra ${group.invoice || group.supplierName}: sin total ni items válidos`)
                return
            }

            const paid = num(cell(firstRow, ['pagado', 'paid']), 0)
            const status = normalizePurchaseStatus(cell(firstRow, ['estado', 'status']))
            const paymentStatus = normalizePaymentStatus(cell(firstRow, ['pago', 'payment_status', 'estado pago']))
            const purchase = insertPurchase.run(
                supplier.id,
                userId,
                group.invoice || null,
                status,
                paymentStatus,
                subtotal,
                tax,
                total,
                paid,
                group.dueDate || null,
                group.notes || null,
            )
            const purchaseId = purchase.lastInsertRowid as number
            items.forEach(item => insertItem.run(purchaseId, item.productId, item.productName, item.quantity, item.unitCost, item.subtotal))
            result.imported++
        })
    })

    tx()
    return { success: true, data: result }
}

// ── Exportar Cartera ──────────────────────────────────────
export function exportCredits(params?: {
    status?: string
}): IpcResponse<{ filePath: string; count: number }> {
    const db = getSqlite()
    let where = 'WHERE c.balance > 0'
    const args: unknown[] = []

    if (params?.status) { where += ' AND c.status = ?'; args.push(params.status) }

    const rows = db.prepare(`
        SELECT 
            c.invoice_number, c.created_at, c.due_date, c.status,
            cl.name as client_name, cl.document,
            c.original_amount, c.paid_amount, c.balance
        FROM credits c
        LEFT JOIN clients cl ON c.client_id = cl.id
        ${where}
        ORDER BY c.due_date ASC
    `).all(...args) as any[]

    const headers = ['Factura', 'Fecha Venta', 'Vencimiento', 'Estado', 'Cliente', 'Documento', 'Monto Original', 'Pagado', 'Saldo']
    const data = rows.map(r => [
        r.invoice_number, formatDateColombia(r.created_at), formatDateColombia(r.due_date),
        r.status, r.client_name, r.document || '-', r.original_amount, r.paid_amount, r.balance,
    ])

    const wb = buildWorkbook('Cartera', headers, data)
    const filePath = saveWorkbook(wb, 'cartera')

    return { success: true, data: { filePath, count: rows.length } }
}

// ── Exportar Mecánicos ────────────────────────────────────
export function exportMechanics(params?: {
    mechanicId?: number
    startDate?: string
    endDate?: string
}): IpcResponse<{ filePath: string; count: number }> {
    const db = getSqlite()
    let where = 'WHERE 1=1'
    const args: unknown[] = []

    if (params?.mechanicId) { where += ' AND ms.mechanic_id = ?'; args.push(params.mechanicId) }
    if (params?.startDate) { where += ' AND ms.date >= ?'; args.push(params.startDate) }
    if (params?.endDate) { where += ' AND ms.date <= ?'; args.push(params.endDate) }

    const rows = db.prepare(`
        SELECT 
            ms.date, m.name as mechanic_name,
            ms.total_generated, ms.patio_fee, ms.net_amount,
            ms.is_patio_paid, ms.patio_paid_amount,
            ms.is_settled, ms.settled_amount
        FROM mechanic_settlements ms
        LEFT JOIN mechanics m ON ms.mechanic_id = m.id
        ${where}
        ORDER BY ms.date DESC
    `).all(...args) as any[]

    const headers = ['Fecha', 'Mecánico', 'Total Generado', 'Patio', 'Neto', 'Patio Pagado', 'Monto Patio', 'Liquidado', 'Monto Liquidado']
    const data = rows.map(r => [
        r.date, r.mechanic_name, r.total_generated, r.patio_fee, r.net_amount,
        r.is_patio_paid ? 'Sí' : 'No', r.patio_paid_amount,
        r.is_settled ? 'Sí' : 'No', r.settled_amount,
    ])

    const wb = buildWorkbook('Mecanicos', headers, data)
    const filePath = saveWorkbook(wb, 'mecanicos')

    return { success: true, data: { filePath, count: rows.length } }
}

export function exportMechanicsList(): IpcResponse<{ filePath: string; count: number }> {
    const db = getSqlite()
    const rows = db.prepare(`
        SELECT name, document, phone, specialty, patio_fee, is_active, created_at, updated_at
        FROM mechanics
        WHERE deleted_at IS NULL
        ORDER BY name ASC
    `).all() as any[]

    const headers = ['Nombre', 'Documento', 'Teléfono', 'Especialidad', 'Patio', 'Activo', 'Creado', 'Actualizado']
    const data = rows.map(r => [
        r.name,
        r.document || '-',
        r.phone || '-',
        r.specialty || '-',
        r.patio_fee,
        yesNo(r.is_active),
        formatDateTimeColombia(r.created_at),
        formatDateTimeColombia(r.updated_at),
    ])

    const wb = buildWorkbook('Mecanicos', headers, data)
    const filePath = saveWorkbook(wb, 'mecanicos')

    return { success: true, data: { filePath, count: rows.length } }
}

export function importMechanics(): IpcResponse<ImportResult> {
    const filePath = pickExcelFile()
    if (!filePath) return { success: false, error: 'Importación cancelada' }

    const db = getSqlite()
    const rows = readExcelRows(filePath)
    const result: ImportResult = { filePath, imported: 0, skipped: 0, duplicates: 0, errors: [] }
    const findMechanic = db.prepare(`SELECT id FROM mechanics WHERE deleted_at IS NULL AND lower(name) = lower(?)`)
    const insertMechanic = db.prepare(`
        INSERT INTO mechanics (name, document, phone, specialty, patio_fee)
        VALUES (?, ?, ?, ?, ?)
    `)

    const tx = db.transaction(() => {
        rows.forEach((row, index) => {
            const name = cell(row, ['nombre', 'mecanico', 'mecánico', 'name'])
            if (!name) { result.skipped++; result.errors.push(`Fila ${index + 2}: nombre requerido`); return }
            if (findMechanic.get(name)) { result.duplicates++; return }
            insertMechanic.run(
                name,
                cell(row, ['documento', 'cedula', 'cédula']) || null,
                cell(row, ['telefono', 'teléfono', 'phone']) || null,
                cell(row, ['especialidad', 'specialty']) || null,
                num(cell(row, ['patio', 'patio_fee', 'tarifa patio']), 0),
            )
            result.imported++
        })
    })

    tx()
    return { success: true, data: result }
}

// ── Exportar Kardex ───────────────────────────────────────
export function exportKardex(params?: {
    productId?: number
    startDate?: string
    endDate?: string
}): IpcResponse<{ filePath: string; count: number }> {
    const db = getSqlite()
    let where = 'WHERE 1=1'
    const args: unknown[] = []

    if (params?.productId) { where += ' AND sm.product_id = ?'; args.push(params.productId) }
    if (params?.startDate) { where += ' AND date(sm.created_at) >= ?'; args.push(params.startDate) }
    if (params?.endDate) { where += ' AND date(sm.created_at) <= ?'; args.push(params.endDate) }

    const rows = db.prepare(`
        SELECT 
            sm.created_at, sm.type, p.name as product_name, p.code,
            sm.quantity, sm.cost_price, sm.sale_price,
            sm.stock_before, sm.stock_after,
            sm.reference, u.full_name as user_name, sm.notes
        FROM stock_movements sm
        LEFT JOIN products p ON sm.product_id = p.id
        LEFT JOIN users u ON sm.user_id = u.id
        ${where}
        ORDER BY sm.created_at DESC
    `).all(...args) as any[]

    const headers = ['Fecha', 'Tipo', 'Producto', 'Código', 'Cantidad', 'Costo', 'Precio Venta', 'Stock Antes', 'Stock Después', 'Referencia', 'Usuario', 'Notas']
    const data = rows.map(r => [
        formatDateTimeColombia(r.created_at), r.type, r.product_name, r.code,
        r.quantity, r.cost_price || '-', r.sale_price || '-',
        r.stock_before, r.stock_after, r.reference || '-', r.user_name, r.notes || '-',
    ])

    const wb = buildWorkbook('Kardex', headers, data)
    const filePath = saveWorkbook(wb, 'kardex')

    return { success: true, data: { filePath, count: rows.length } }
}

// ── Exportar Caja ─────────────────────────────────────────
export function exportCash(params?: {
    startDate?: string
    endDate?: string
    userId?: number
}): IpcResponse<{ filePath: string; count: number }> {
    const db = getSqlite()
    let where = 'WHERE 1=1'
    const args: unknown[] = []

    if (params?.startDate) { where += ' AND date(cs.opened_at) >= ?'; args.push(params.startDate) }
    if (params?.endDate) { where += ' AND date(cs.opened_at) <= ?'; args.push(params.endDate) }
    if (params?.userId) { where += ' AND cs.user_id = ?'; args.push(params.userId) }

    const rows = db.prepare(`
        SELECT 
            cs.opened_at, cs.closed_at, cs.status,
            u.full_name as user_name,
            cs.opening_balance, cs.closing_balance, cs.expected_balance, cs.difference,
            cs.notes
        FROM cash_sessions cs
        LEFT JOIN users u ON cs.user_id = u.id
        ${where}
        ORDER BY cs.opened_at DESC
    `).all(...args) as any[]

    const headers = ['Apertura', 'Cierre', 'Estado', 'Cajero', 'Fondo Inicial', 'Cierre Real', 'Cierre Esperado', 'Diferencia', 'Notas']
    const data = rows.map(r => [
        formatDateTimeColombia(r.opened_at),
        r.closed_at ? formatDateTimeColombia(r.closed_at) : 'Abierta',
        r.status, r.user_name,
        r.opening_balance, r.closing_balance || '-', r.expected_balance || '-',
        r.difference || '-', r.notes || '-',
    ])

    const wb = buildWorkbook('Caja', headers, data)
    const filePath = saveWorkbook(wb, 'caja')

    return { success: true, data: { filePath, count: rows.length } }
}

// ── Abrir archivo exportado ───────────────────────────────
export function openExportFolder(): IpcResponse {
    const { app } = require('electron')
    const { join } = require('path')
    const exportDir = join(app.getPath('downloads'), 'manuel-motos-reportes')
    require('child_process').execSync(`start "" "${exportDir}"`)
    return { success: true }
}
