//src/main/database/schema/index.ts
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ============================================================
// HELPERS
// ============================================================
const timestamps = {
  createdAt: text('created_at').notNull().default(sql`(datetime('now','localtime'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now','localtime'))`),
}

// ============================================================
// USUARIOS Y ROLES
// ============================================================
export const users = sqliteTable('users', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  username:     text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName:     text('full_name').notNull(),
  role:         text('role', { enum: ['admin','cajero','mecanico','supervisor'] }).notNull().default('cajero'),
  isActive:     integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt:  text('last_login_at'),
  ...timestamps,
}, (t) => [
  index('idx_users_username').on(t.username),
  index('idx_users_role').on(t.role),
])

// ============================================================
// CATEGORÍAS
// ============================================================
export const categories = sqliteTable('categories', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  name:        text('name').notNull().unique(),
  description: text('description'),
  isActive:    integer('is_active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
})

// ============================================================
// PROVEEDORES
// ============================================================
export const suppliers = sqliteTable('suppliers', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  name:      text('name').notNull(),
  nit:       text('nit'),
  contact:   text('contact'),
  phone:     text('phone'),
  email:     text('email'),
  address:   text('address'),
  notes:     text('notes'),
  isActive:  integer('is_active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
}, (t) => [
  index('idx_suppliers_name').on(t.name),
  index('idx_suppliers_nit').on(t.nit),
])

// ============================================================
// PRODUCTOS
// ============================================================
export const products = sqliteTable('products', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  code:        text('code').notNull().unique(),
  barcode:     text('barcode'),
  name:        text('name').notNull(),
  description: text('description'),
  categoryId:  integer('category_id').references(() => categories.id),
  supplierId:  integer('supplier_id').references(() => suppliers.id),
  costPrice:   real('cost_price').notNull().default(0),
  salePrice:   real('sale_price').notNull().default(0),
  stock:       real('stock').notNull().default(0),
  minStock:    real('min_stock').notNull().default(3),
  unit:        text('unit').notNull().default('und'),
  status:      text('status', { enum: ['active','inactive'] }).notNull().default('active'),
  imagePath:   text('image_path'),
  deletedAt:   text('deleted_at'),
  ...timestamps,
}, (t) => [
  index('idx_products_name').on(t.name),
  index('idx_products_code').on(t.code),
  index('idx_products_barcode').on(t.barcode),
  index('idx_products_category').on(t.categoryId),
  index('idx_products_supplier').on(t.supplierId),
  index('idx_products_status').on(t.status),
])

// ============================================================
// MOVIMIENTOS DE INVENTARIO (KARDEX)
// ============================================================
export const stockMovements = sqliteTable('stock_movements', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  productId:   integer('product_id').notNull().references(() => products.id),
  type:        text('type', {
    enum: ['entrada','salida','ajuste_suma','ajuste_resta','devolucion','venta','compra']
  }).notNull(),
  quantity:    real('quantity').notNull(),
  costPrice:   real('cost_price'),
  salePrice:   real('sale_price'),
  stockBefore: real('stock_before').notNull(),
  stockAfter:  real('stock_after').notNull(),
  reference:   text('reference'),
  referenceId: integer('reference_id'),
  notes:       text('notes'),
  userId:      integer('user_id').notNull().references(() => users.id),
  createdAt:   text('created_at').notNull().default(sql`(datetime('now','localtime'))`),
}, (t) => [
  index('idx_movements_product').on(t.productId),
  index('idx_movements_type').on(t.type),
  index('idx_movements_date').on(t.createdAt),
  index('idx_movements_reference').on(t.reference),
])

// ============================================================
// CLIENTES
// ============================================================
export const clients = sqliteTable('clients', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  documentType: text('document_type', { enum: ['cedula','nit','pasaporte','otro'] }),
  document:     text('document'),
  name:         text('name').notNull(),
  phone:        text('phone'),
  email:        text('email'),
  address:      text('address'),
  notes:        text('notes'),
  creditLimit:  real('credit_limit').notNull().default(0),
  discount:     real('discount').notNull().default(0),
  isActive:     integer('is_active', { mode: 'boolean' }).notNull().default(true),
  deletedAt:    text('deleted_at'),
  ...timestamps,
}, (t) => [
  index('idx_clients_name').on(t.name),
  index('idx_clients_document').on(t.document),
  index('idx_clients_phone').on(t.phone),
])

// ============================================================
// SESIONES DE CAJA
// ============================================================
export const cashSessions = sqliteTable('cash_sessions', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  userId:          integer('user_id').notNull().references(() => users.id),
  status:          text('status', { enum: ['abierta','cerrada'] }).notNull().default('abierta'),
  openingBalance:  real('opening_balance').notNull().default(0),
  closingBalance:  real('closing_balance'),
  expectedBalance: real('expected_balance'),
  difference:      real('difference'),
  openedAt:        text('opened_at').notNull().default(sql`(datetime('now','localtime'))`),
  closedAt:        text('closed_at'),
  notes:           text('notes'),
}, (t) => [
  index('idx_cash_status').on(t.status),
  index('idx_cash_user').on(t.userId),
  index('idx_cash_opened').on(t.openedAt),
])

// ============================================================
// VENTAS
// ============================================================
export const sales = sqliteTable('sales', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  clientId:      integer('client_id').references(() => clients.id),
  clientName:    text('client_name'),
  userId:        integer('user_id').notNull().references(() => users.id),
  cashSessionId: integer('cash_session_id').references(() => cashSessions.id),
  workOrderId:   integer('work_order_id'),
  status:        text('status', { enum: ['completada','pendiente','anulada'] }).notNull().default('completada'),
  paymentStatus: text('payment_status', { enum: ['pagado','pendiente','parcial'] }).notNull().default('pagado'),
  subtotal:      real('subtotal').notNull().default(0),
  discount:      real('discount').notNull().default(0),
  tax:           real('tax').notNull().default(0),
  total:         real('total').notNull().default(0),
  paid:          real('paid').notNull().default(0),
  change:        real('change').notNull().default(0),
  notes:         text('notes'),
  cancelReason:  text('cancel_reason'),
  canceledBy:    integer('canceled_by').references(() => users.id),
  canceledAt:    text('canceled_at'),
  ...timestamps,
}, (t) => [
  index('idx_sales_invoice').on(t.invoiceNumber),
  index('idx_sales_client').on(t.clientId),
  index('idx_sales_user').on(t.userId),
  index('idx_sales_status').on(t.status),
  index('idx_sales_payment_status').on(t.paymentStatus),
  index('idx_sales_date').on(t.createdAt),
  index('idx_sales_cash_session').on(t.cashSessionId),
])

// ============================================================
// ITEMS DE VENTA
// ============================================================
export const saleItems = sqliteTable('sale_items', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  saleId:      integer('sale_id').notNull().references(() => sales.id),
  productId:   integer('product_id').references(() => products.id),
  productName: text('product_name').notNull(),
  productCode: text('product_code'),
  quantity:    real('quantity').notNull(),
  unitPrice:   real('unit_price').notNull(),
  costPrice:   real('cost_price').notNull().default(0),
  discount:    real('discount').notNull().default(0),
  subtotal:    real('subtotal').notNull(),
  isManual:    integer('is_manual', { mode: 'boolean' }).notNull().default(false),
}, (t) => [
  index('idx_sale_items_sale').on(t.saleId),
  index('idx_sale_items_product').on(t.productId),
])

// ============================================================
// PAGOS DE VENTA
// ============================================================
export const salePayments = sqliteTable('sale_payments', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  saleId:    integer('sale_id').notNull().references(() => sales.id),
  method:    text('method', {
    enum: ['efectivo','tarjeta','transferencia','nequi','daviplata','credito','otro']
  }).notNull(),
  amount:    real('amount').notNull(),
  reference: text('reference'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now','localtime'))`),
}, (t) => [
  index('idx_payments_sale').on(t.saleId),
  index('idx_payments_method').on(t.method),
])

// ============================================================
// PROVEEDORES — COMPRAS
// ============================================================
export const purchases = sqliteTable('purchases', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  supplierId:    integer('supplier_id').notNull().references(() => suppliers.id),
  userId:        integer('user_id').notNull().references(() => users.id),
  invoiceNumber: text('invoice_number'),
  status:        text('status', { enum: ['pendiente','recibida','parcial','anulada'] }).notNull().default('pendiente'),
  paymentStatus: text('payment_status', { enum: ['pagado','pendiente','parcial'] }).notNull().default('pendiente'),
  subtotal:      real('subtotal').notNull().default(0),
  tax:           real('tax').notNull().default(0),
  total:         real('total').notNull().default(0),
  paid:          real('paid').notNull().default(0),
  dueDate:       text('due_date'),
  notes:         text('notes'),
  receivedAt:    text('received_at'),
  ...timestamps,
}, (t) => [
  index('idx_purchases_supplier').on(t.supplierId),
  index('idx_purchases_status').on(t.status),
  index('idx_purchases_date').on(t.createdAt),
  index('idx_purchases_due').on(t.dueDate),
])

// ============================================================
// ITEMS DE COMPRA
// ============================================================
export const purchaseItems = sqliteTable('purchase_items', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  purchaseId:  integer('purchase_id').notNull().references(() => purchases.id),
  productId:   integer('product_id').notNull().references(() => products.id),
  productName: text('product_name').notNull(),
  quantity:    real('quantity').notNull(),
  unitCost:    real('unit_cost').notNull(),
  subtotal:    real('subtotal').notNull(),
}, (t) => [
  index('idx_purchase_items_purchase').on(t.purchaseId),
  index('idx_purchase_items_product').on(t.productId),
])

// ============================================================
// MOTOS
// ============================================================
export const motorcycles = sqliteTable('motorcycles', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  clientId:      integer('client_id').references(() => clients.id),
  plate:         text('plate').notNull(),
  brand:         text('brand').notNull(),
  model:         text('model').notNull(),
  year:          integer('year'),
  color:         text('color'),
  engineNumber:  text('engine_number'),
  chassisNumber: text('chassis_number'),
  notes:         text('notes'),
  deletedAt:     text('deleted_at'),
  ...timestamps,
}, (t) => [
  index('idx_motos_plate').on(t.plate),
  index('idx_motos_client').on(t.clientId),
  index('idx_motos_brand').on(t.brand),
])

// ============================================================
// MECÁNICOS
// ============================================================
export const mechanics = sqliteTable('mechanics', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  userId:    integer('user_id').references(() => users.id),
  name:      text('name').notNull(),
  document:  text('document'),
  phone:     text('phone'),
  specialty: text('specialty'),
  patioFee:  real('patio_fee').notNull().default(0),
  isActive:  integer('is_active', { mode: 'boolean' }).notNull().default(true),
  deletedAt: text('deleted_at'),
  ...timestamps,
}, (t) => [
  index('idx_mechanics_name').on(t.name),
])

// ============================================================
// ÓRDENES DE TRABAJO
// ============================================================
export const workOrders = sqliteTable('work_orders', {
  id:                integer('id').primaryKey({ autoIncrement: true }),
  orderNumber:       text('order_number').notNull().unique(),
  motorcycleId:      integer('motorcycle_id').notNull().references(() => motorcycles.id),
  clientId:          integer('client_id').references(() => clients.id),
  clientName:        text('client_name'),
  mechanicId:        integer('mechanic_id').references(() => mechanics.id),
  userId:            integer('user_id').notNull().references(() => users.id),
  status:            text('status', {
    enum: ['pendiente','en_proceso','finalizado','entregado','anulado']
  }).notNull().default('pendiente'),
  description:       text('description').notNull(),
  diagnosis:         text('diagnosis'),
  laborCost:         real('labor_cost').notNull().default(0),
  partsCost:         real('parts_cost').notNull().default(0),
  total:             real('total').notNull().default(0),
  estimatedDelivery: text('estimated_delivery'),
  deliveredAt:       text('delivered_at'),
  notes:             text('notes'),
  deletedAt:         text('deleted_at'),
  ...timestamps,
}, (t) => [
  index('idx_wo_number').on(t.orderNumber),
  index('idx_wo_moto').on(t.motorcycleId),
  index('idx_wo_mechanic').on(t.mechanicId),
  index('idx_wo_status').on(t.status),
  index('idx_wo_date').on(t.createdAt),
  index('idx_wo_client').on(t.clientId),
])

// ============================================================
// ITEMS DE ORDEN DE TRABAJO
// ============================================================
export const workOrderItems = sqliteTable('work_order_items', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  workOrderId: integer('work_order_id').notNull().references(() => workOrders.id),
  type:        text('type', { enum: ['repuesto','mano_obra','otro'] }).notNull(),
  productId:   integer('product_id').references(() => products.id),
  description: text('description').notNull(),
  quantity:    real('quantity').notNull().default(1),
  unitPrice:   real('unit_price').notNull().default(0),
  subtotal:    real('subtotal').notNull().default(0),
}, (t) => [
  index('idx_wo_items_order').on(t.workOrderId),
  index('idx_wo_items_product').on(t.productId),
])

// ============================================================
// LIQUIDACIONES DE MECÁNICOS
// ============================================================
export const mechanicSettlements = sqliteTable('mechanic_settlements', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  mechanicId:      integer('mechanic_id').notNull().references(() => mechanics.id),
  date:            text('date').notNull(),
  totalGenerated:  real('total_generated').notNull().default(0),
  patioFee:        real('patio_fee').notNull().default(0),
  netAmount:       real('net_amount').notNull().default(0),
  isPatioPaid:     integer('is_patio_paid', { mode: 'boolean' }).notNull().default(false),
  patioPaidAmount: real('patio_paid_amount').notNull().default(0),
  isSettled:       integer('is_settled', { mode: 'boolean' }).notNull().default(false),
  settledAmount:   real('settled_amount').notNull().default(0),
  settledBy:       integer('settled_by').references(() => users.id),
  notes:           text('notes'),
  ...timestamps,
}, (t) => [
  index('idx_settlements_mechanic').on(t.mechanicId),
  index('idx_settlements_date').on(t.date),
])

// ============================================================
// CRÉDITOS / CARTERA
// ============================================================
export const credits = sqliteTable('credits', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  clientId:       integer('client_id').notNull().references(() => clients.id),
  saleId:         integer('sale_id').references(() => sales.id),
  workOrderId:    integer('work_order_id').references(() => workOrders.id),
  invoiceNumber:  text('invoice_number').notNull(),
  originalAmount: real('original_amount').notNull(),
  paidAmount:     real('paid_amount').notNull().default(0),
  balance:        real('balance').notNull(),
  dueDate:        text('due_date').notNull(),
  status:         text('status', { enum: ['al_dia','proximo','vencido'] }).notNull().default('al_dia'),
  notes:          text('notes'),
  ...timestamps,
}, (t) => [
  index('idx_credits_client').on(t.clientId),
  index('idx_credits_status').on(t.status),
  index('idx_credits_due').on(t.dueDate),
  index('idx_credits_sale').on(t.saleId),
])

// ============================================================
// PAGOS DE CRÉDITO
// ============================================================
export const creditPayments = sqliteTable('credit_payments', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  creditId:  integer('credit_id').notNull().references(() => credits.id),
  amount:    real('amount').notNull(),
  method:    text('method', {
    enum: ['efectivo','tarjeta','transferencia','nequi','daviplata','credito','otro']
  }).notNull(),
  reference: text('reference'),
  notes:     text('notes'),
  userId:    integer('user_id').notNull().references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`(datetime('now','localtime'))`),
}, (t) => [
  index('idx_credit_payments_credit').on(t.creditId),
  index('idx_credit_payments_date').on(t.createdAt),
])

// ============================================================
// PLAN DE CUENTAS (PUC Colombia)
// ============================================================
export const accountingAccounts = sqliteTable('accounting_accounts', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  code:            text('code').notNull().unique(),
  name:            text('name').notNull(),
  type:            text('type', {
    enum: ['activo','pasivo','patrimonio','ingreso','gasto','costo']
  }).notNull(),
  parentCode:      text('parent_code'),
  isActive:        integer('is_active', { mode: 'boolean' }).notNull().default(true),
  allowsMovement:  integer('allows_movement', { mode: 'boolean' }).notNull().default(true),
  description:     text('description'),
}, (t) => [
  index('idx_accounts_code').on(t.code),
  index('idx_accounts_type').on(t.type),
  index('idx_accounts_parent').on(t.parentCode),
])

// ============================================================
// ASIENTOS CONTABLES
// ============================================================
export const journalEntries = sqliteTable('journal_entries', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  entryNumber:   text('entry_number').notNull().unique(),
  date:          text('date').notNull(),
  description:   text('description').notNull(),
  reference:     text('reference'),
  referenceType: text('reference_type'),
  referenceId:   integer('reference_id'),
  userId:        integer('user_id').notNull().references(() => users.id),
  createdAt:     text('created_at').notNull().default(sql`(datetime('now','localtime'))`),
}, (t) => [
  index('idx_journal_date').on(t.date),
  index('idx_journal_reference').on(t.reference),
  index('idx_journal_ref_type').on(t.referenceType),
])

// ============================================================
// LÍNEAS DE ASIENTO
// ============================================================
export const journalLines = sqliteTable('journal_lines', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  entryId:     integer('entry_id').notNull().references(() => journalEntries.id),
  accountCode: text('account_code').notNull().references(() => accountingAccounts.code),
  debit:       real('debit').notNull().default(0),
  credit:      real('credit').notNull().default(0),
  description: text('description'),
}, (t) => [
  index('idx_journal_lines_entry').on(t.entryId),
  index('idx_journal_lines_account').on(t.accountCode),
])

// ============================================================
// AUDITORÍA
// ============================================================
export const auditLogs = sqliteTable('audit_logs', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  userId:    integer('user_id').notNull().references(() => users.id),
  userName:  text('user_name').notNull(),
  action:    text('action').notNull(),
  module:    text('module').notNull(),
  recordId:  integer('record_id'),
  before:    text('before'),
  after:     text('after'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now','localtime'))`),
}, (t) => [
  index('idx_audit_user').on(t.userId),
  index('idx_audit_module').on(t.module),
  index('idx_audit_date').on(t.createdAt),
  index('idx_audit_action').on(t.action),
])

// ============================================================
// CONFIGURACIÓN DEL SISTEMA
// ============================================================
export const settings = sqliteTable('settings', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  key:       text('key').notNull().unique(),
  value:     text('value').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now','localtime'))`),
})

// ============================================================
// BACKUPS (registro)
// ============================================================
export const backupLogs = sqliteTable('backup_logs', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  fileName:  text('file_name').notNull(),
  filePath:  text('file_path').notNull(),
  fileSize:  integer('file_size').notNull().default(0),
  type:      text('type', { enum: ['auto','manual'] }).notNull().default('manual'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now','localtime'))`),
})