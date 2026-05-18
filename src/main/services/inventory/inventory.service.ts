// src/main/services/inventory/inventory.service.ts
import { getSqlite } from '../../database/connection'
import { getCurrentSession } from '../auth/auth.service'
import type { IpcResponse, Product, StockMovement } from '../../../shared/types/index'

// ── Listar productos ─────────────────────────────────────────
export function listProducts(params?: {
  search?:     string
  categoryId?: number
  supplierId?: number
  status?:     string
  lowStock?:   boolean
  page?:       number
  pageSize?:   number
}): IpcResponse<{ items: Product[]; total: number }> {
  const db       = getSqlite()
  const page     = params?.page     ?? 1
  const pageSize = params?.pageSize ?? 20
  const offset   = (page - 1) * pageSize

  let where  = 'WHERE p.deleted_at IS NULL'
  const args: unknown[] = []

  if (params?.search) {
    where += ` AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)`
    const q = `%${params.search}%`
    args.push(q, q, q)
  }
  if (params?.categoryId) {
    where += ` AND p.category_id = ?`
    args.push(params.categoryId)
  }
  if (params?.supplierId) {
    where += ` AND p.supplier_id = ?`
    args.push(params.supplierId)
  }
  if (params?.status) {
    where += ` AND p.status = ?`
    args.push(params.status)
  }
  if (params?.lowStock) {
    where += ` AND p.stock <= p.min_stock`
  }

  const total = (db.prepare(`
    SELECT COUNT(*) as c FROM products p ${where}
  `).get(...args) as { c: number }).c

  const items = db.prepare(`
    SELECT p.*,
           c.name as category_name,
           s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers  s ON p.supplier_id  = s.id
    ${where}
    ORDER BY p.name ASC
    LIMIT ? OFFSET ?
  `).all(...args, pageSize, offset) as any[]

  return {
    success: true,
    data: {
      total,
      items: items.map(mapProduct),
    },
  }
}

// ── Obtener producto por ID ───────────────────────────────────
export function getProduct(id: number): IpcResponse<Product> {
  const db = getSqlite()
  const row = db.prepare(`
    SELECT p.*, c.name as category_name, s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers  s ON p.supplier_id  = s.id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `).get(id) as any

  if (!row) return { success: false, error: 'Producto no encontrado' }
  return { success: true, data: mapProduct(row) }
}

// ── Buscar productos (POS) ───────────────────────────────────
export function searchProducts(query: string): IpcResponse<Product[]> {
  const db = getSqlite()
  const q  = `%${query}%`
  const rows = db.prepare(`
    SELECT p.*, c.name as category_name, s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers  s ON p.supplier_id  = s.id
    WHERE p.deleted_at IS NULL AND p.status = 'active'
      AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)
    ORDER BY p.name ASC
    LIMIT 20
  `).all(q, q, q) as any[]

  return { success: true, data: rows.map(mapProduct) }
}

// ── Crear producto ───────────────────────────────────────────
export function createProduct(data: {
  code:        string
  barcode?:    string
  name:        string
  description?: string
  categoryId?: number
  supplierId?: number
  costPrice:   number
  salePrice:   number
  stock?:      number
  minStock?:   number
  unit?:       string
  status?:     string
}): IpcResponse<Product> {
  const db      = getSqlite()
  const session = getCurrentSession()

  // Validaciones
  if (!data.code?.trim()) return { success: false, error: 'El código es requerido' }
  if (!data.name?.trim()) return { success: false, error: 'El nombre es requerido' }
  if (data.costPrice < 0)  return { success: false, error: 'El costo no puede ser negativo' }
  if (data.salePrice < 0)  return { success: false, error: 'El precio no puede ser negativo' }

  // Verificar código único
  const exists = db.prepare(`SELECT id FROM products WHERE code = ? AND deleted_at IS NULL`).get(data.code)
  if (exists) return { success: false, error: 'Ya existe un producto con ese código' }

  const stock    = data.stock    ?? 0
  const minStock = data.minStock ?? 3

  const result = db.prepare(`
    INSERT INTO products
      (code, barcode, name, description, category_id, supplier_id,
       cost_price, sale_price, stock, min_stock, unit, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.code.trim(),
    data.barcode   ?? null,
    data.name.trim(),
    data.description ?? null,
    data.categoryId  ?? null,
    data.supplierId  ?? null,
    data.costPrice,
    data.salePrice,
    stock,
    minStock,
    data.unit   ?? 'und',
    data.status ?? 'active',
  )

  const productId = result.lastInsertRowid as number

  // Registrar movimiento inicial si hay stock
  if (stock > 0) {
    db.prepare(`
      INSERT INTO stock_movements
        (product_id, type, quantity, cost_price, stock_before, stock_after, reference, user_id)
      VALUES (?, 'entrada', ?, ?, 0, ?, 'Stock inicial', ?)
    `).run(productId, stock, data.costPrice, stock, session?.id ?? 1)
  }

  // Auditoría
  auditLog('CREATE', 'inventory', productId, null, data)

  return getProduct(productId)
}

// ── Actualizar producto ──────────────────────────────────────
export function updateProduct(data: {
  id:           number
  code?:        string
  barcode?:     string
  name?:        string
  description?: string
  categoryId?:  number | null
  supplierId?:  number | null
  costPrice?:   number
  salePrice?:   number
  minStock?:    number
  unit?:        string
  status?:      string
}): IpcResponse<Product> {
  const db  = getSqlite()
  const old = db.prepare(`SELECT * FROM products WHERE id = ? AND deleted_at IS NULL`).get(data.id) as any
  if (!old) return { success: false, error: 'Producto no encontrado' }

  if (data.code && data.code !== old.code) {
    const dup = db.prepare(`SELECT id FROM products WHERE code = ? AND id != ? AND deleted_at IS NULL`)
      .get(data.code, data.id)
    if (dup) return { success: false, error: 'Código ya en uso' }
  }

  db.prepare(`
    UPDATE products SET
      code        = COALESCE(?, code),
      barcode     = ?,
      name        = COALESCE(?, name),
      description = ?,
      category_id = ?,
      supplier_id = ?,
      cost_price  = COALESCE(?, cost_price),
      sale_price  = COALESCE(?, sale_price),
      min_stock   = COALESCE(?, min_stock),
      unit        = COALESCE(?, unit),
      status      = COALESCE(?, status),
      updated_at  = datetime('now','localtime')
    WHERE id = ?
  `).run(
    data.code        ?? null,
    data.barcode     ?? old.barcode,
    data.name        ?? null,
    data.description ?? old.description,
    data.categoryId  !== undefined ? data.categoryId : old.category_id,
    data.supplierId  !== undefined ? data.supplierId : old.supplier_id,
    data.costPrice   ?? null,
    data.salePrice   ?? null,
    data.minStock    ?? null,
    data.unit        ?? null,
    data.status      ?? null,
    data.id,
  )

  auditLog('UPDATE', 'inventory', data.id, old, data)
  return getProduct(data.id)
}

// ── Eliminar (soft delete) ───────────────────────────────────
export function deleteProduct(id: number): IpcResponse {
  const db  = getSqlite()
  const row = db.prepare(`SELECT id FROM products WHERE id = ? AND deleted_at IS NULL`).get(id)
  if (!row) return { success: false, error: 'Producto no encontrado' }

  db.prepare(`UPDATE products SET deleted_at = datetime('now','localtime') WHERE id = ?`).run(id)
  auditLog('DELETE', 'inventory', id, null, null)
  return { success: true }
}

// ── Ajuste de stock ──────────────────────────────────────────
export function adjustStock(data: {
  productId: number
  type:      'ajuste_suma' | 'ajuste_resta'
  quantity:  number
  notes?:    string
}): IpcResponse<Product> {
  const db      = getSqlite()
  const session = getCurrentSession()

  if (data.quantity <= 0) return { success: false, error: 'La cantidad debe ser mayor a 0' }

  const product = db.prepare(`SELECT * FROM products WHERE id = ? AND deleted_at IS NULL`)
    .get(data.productId) as any
  if (!product) return { success: false, error: 'Producto no encontrado' }

  const stockBefore = product.stock
  const stockAfter  = data.type === 'ajuste_suma'
    ? stockBefore + data.quantity
    : stockBefore - data.quantity

  if (stockAfter < 0) return { success: false, error: 'Stock insuficiente para este ajuste' }

  db.prepare(`UPDATE products SET stock = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
    .run(stockAfter, data.productId)

  db.prepare(`
    INSERT INTO stock_movements
      (product_id, type, quantity, cost_price, stock_before, stock_after, notes, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.productId,
    data.type,
    data.quantity,
    product.cost_price,
    stockBefore,
    stockAfter,
    data.notes ?? null,
    session?.id ?? 1,
  )

  return getProduct(data.productId)
}

// ── Stock bajo ───────────────────────────────────────────────
export function getLowStock(): IpcResponse<Product[]> {
  const db = getSqlite()
  const rows = db.prepare(`
    SELECT p.*, c.name as category_name, s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers  s ON p.supplier_id  = s.id
    WHERE p.deleted_at IS NULL AND p.status = 'active' AND p.stock <= p.min_stock
    ORDER BY p.stock ASC
    LIMIT 50
  `).all() as any[]

  return { success: true, data: rows.map(mapProduct) }
}

// ── Movimientos por producto (Kardex) ────────────────────────
export function getMovementsByProduct(productId: number): IpcResponse<StockMovement[]> {
  const db = getSqlite()
  const rows = db.prepare(`
    SELECT sm.*, u.full_name as user_name, p.name as product_name
    FROM stock_movements sm
    LEFT JOIN users u ON sm.user_id = u.id
    LEFT JOIN products p ON sm.product_id = p.id
    WHERE sm.product_id = ?
    ORDER BY sm.created_at DESC
    LIMIT 100
  `).all(productId) as any[]

  return {
    success: true,
    data: rows.map(r => ({
      id:          r.id,
      productId:   r.product_id,
      productName: r.product_name,
      type:        r.type,
      quantity:    r.quantity,
      costPrice:   r.cost_price,
      salePrice:   r.sale_price,
      stockBefore: r.stock_before,
      stockAfter:  r.stock_after,
      reference:   r.reference,
      notes:       r.notes,
      userId:      r.user_id,
      userName:    r.user_name,
      createdAt:   r.created_at,
    })),
  }
}

// ── Categorías ───────────────────────────────────────────────
export function listCategories(): IpcResponse<{ id: number; name: string; description: string | null; isActive: boolean }[]> {
  const db   = getSqlite()
  const rows = db.prepare(`SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC`).all() as any[]
  return {
    success: true,
    data: rows.map(r => ({ id: r.id, name: r.name, description: r.description, isActive: Boolean(r.is_active) })),
  }
}

export function createCategory(data: { name: string; description?: string }): IpcResponse {
  const db = getSqlite()
  if (!data.name?.trim()) return { success: false, error: 'Nombre requerido' }
  const exists = db.prepare(`SELECT id FROM categories WHERE name = ?`).get(data.name.trim())
  if (exists) return { success: false, error: 'Categoría ya existe' }
  db.prepare(`INSERT INTO categories (name, description) VALUES (?, ?)`).run(data.name.trim(), data.description ?? null)
  return { success: true }
}

export function updateCategory(data: { id: number; name?: string; description?: string; isActive?: boolean }): IpcResponse {
  const db = getSqlite()
  db.prepare(`
    UPDATE categories SET
      name        = COALESCE(?, name),
      description = COALESCE(?, description),
      is_active   = COALESCE(?, is_active),
      updated_at  = datetime('now','localtime')
    WHERE id = ?
  `).run(data.name ?? null, data.description ?? null, data.isActive !== undefined ? (data.isActive ? 1 : 0) : null, data.id)
  return { success: true }
}

export function deleteCategory(id: number): IpcResponse {
  const db = getSqlite()
  const inUse = db.prepare(`SELECT id FROM products WHERE category_id = ? AND deleted_at IS NULL LIMIT 1`).get(id)
  if (inUse) return { success: false, error: 'Categoría en uso, no se puede eliminar' }
  db.prepare(`UPDATE categories SET is_active = 0 WHERE id = ?`).run(id)
  return { success: true }
}

// ── Proveedores ──────────────────────────────────────────────
export function listSuppliers(params?: { search?: string }): IpcResponse<any[]> {
  const db = getSqlite()
  let where = 'WHERE is_active = 1'
  const args: unknown[] = []
  if (params?.search) {
    where += ` AND (name LIKE ? OR nit LIKE ?)`
    args.push(`%${params.search}%`, `%${params.search}%`)
  }
  const rows = db.prepare(`SELECT * FROM suppliers ${where} ORDER BY name ASC`).all(...args)
  return { success: true, data: rows }
}

export function createSupplier(data: {
  name: string; nit?: string; contact?: string
  phone?: string; email?: string; address?: string; notes?: string
}): IpcResponse {
  const db = getSqlite()
  if (!data.name?.trim()) return { success: false, error: 'Nombre requerido' }
  db.prepare(`
    INSERT INTO suppliers (name, nit, contact, phone, email, address, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(data.name.trim(), data.nit ?? null, data.contact ?? null,
         data.phone ?? null, data.email ?? null, data.address ?? null, data.notes ?? null)
  return { success: true }
}

export function updateSupplier(data: {
  id: number; name?: string; nit?: string; contact?: string
  phone?: string; email?: string; address?: string; notes?: string; isActive?: boolean
}): IpcResponse {
  const db = getSqlite()
  db.prepare(`
    UPDATE suppliers SET
      name      = COALESCE(?, name),
      nit       = COALESCE(?, nit),
      contact   = COALESCE(?, contact),
      phone     = COALESCE(?, phone),
      email     = COALESCE(?, email),
      address   = COALESCE(?, address),
      notes     = COALESCE(?, notes),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(data.name ?? null, data.nit ?? null, data.contact ?? null,
         data.phone ?? null, data.email ?? null, data.address ?? null,
         data.notes ?? null, data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
         data.id)
  return { success: true }
}

export function deleteSupplier(id: number): IpcResponse {
  const db = getSqlite()
  const inUse = db.prepare(`SELECT id FROM products WHERE supplier_id = ? AND deleted_at IS NULL LIMIT 1`).get(id)
  if (inUse) return { success: false, error: 'Proveedor en uso, no se puede eliminar' }
  db.prepare(`UPDATE suppliers SET is_active = 0 WHERE id = ?`).run(id)
  return { success: true }
}

// ── Helpers internos ─────────────────────────────────────────
function mapProduct(r: any): Product {
  return {
    id:           r.id,
    code:         r.code,
    barcode:      r.barcode,
    name:         r.name,
    description:  r.description,
    categoryId:   r.category_id,
    categoryName: r.category_name,
    supplierId:   r.supplier_id,
    supplierName: r.supplier_name,
    costPrice:    r.cost_price,
    salePrice:    r.sale_price,
    stock:        r.stock,
    minStock:     r.min_stock,
    unit:         r.unit,
    status:       r.status,
    imagePath:    r.image_path,
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
    action, module, recordId,
    before ? JSON.stringify(before) : null,
    after  ? JSON.stringify(after)  : null,
  )
}