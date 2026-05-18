// ============================================================
// TIPOS COMPARTIDOS — Manuel Motos
//src/shared/types/index.ts
// Usados tanto en main (Node) como en renderer (React)
// ============================================================

// --- Roles y usuarios ---
export type UserRole = 'admin' | 'cajero' | 'mecanico' | 'supervisor'

export interface User {
  id: number
  username: string
  fullName: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type SessionUser = User

export interface AuthSession {
  user: User
  loginAt: string
}

// --- Respuesta genérica IPC ---
export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// --- Paginación ---
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// --- Productos / Inventario ---
export type ProductStatus = 'active' | 'inactive'
export type MovementType = 'entrada' | 'salida' | 'ajuste_suma' | 'ajuste_resta' | 'devolucion' | 'venta' | 'compra'

export interface Category {
  id: number
  name: string
  description?: string
  createdAt: string
}

export interface Supplier {
  id: number
  name: string
  nit?: string
  contact?: string
  phone?: string
  email?: string
  address?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: number
  code: string
  barcode?: string
  name: string
  description?: string
  categoryId?: number
  categoryName?: string
  supplierId?: number
  supplierName?: string
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  unit: string
  status: ProductStatus
  imagePath?: string
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: number
  productId: number
  productName: string
  type: MovementType
  quantity: number
  costPrice?: number
  salePrice?: number
  stockBefore: number
  stockAfter: number
  reference?: string
  notes?: string
  userId: number
  userName: string
  createdAt: string
}

// --- Clientes ---
export type DocumentType = 'cedula' | 'nit' | 'pasaporte' | 'otro'

export interface Client {
  id: number
  documentType?: DocumentType
  document?: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  creditLimit: number
  discount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// --- Ventas / POS ---
export type SaleStatus = 'completada' | 'pendiente' | 'anulada'
export type PaymentStatus = 'pagado' | 'pendiente' | 'parcial'
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'credito' | 'otro'

export interface SaleItem {
  id?: number
  saleId?: number
  productId?: number
  productName: string
  productCode?: string
  quantity: number
  unitPrice: number
  costPrice: number
  discount: number
  subtotal: number
  isManual: boolean
}

export interface SalePayment {
  id?: number
  saleId?: number
  method: PaymentMethod
  amount: number
  reference?: string
  createdAt?: string
}

export interface Sale {
  id: number
  invoiceNumber: string
  clientId?: number
  clientName?: string
  userId: number
  userName: string
  cashSessionId?: number
  workOrderId?: number
  status: SaleStatus
  paymentStatus: PaymentStatus
  subtotal: number
  discount: number
  tax: number
  total: number
  paid: number
  change: number
  notes?: string
  cancelReason?: string
  canceledBy?: number
  canceledAt?: string
  createdAt: string
  updatedAt: string
  items?: SaleItem[]
  payments?: SalePayment[]
}

// --- Caja ---
export type CashSessionStatus = 'abierta' | 'cerrada'

export interface CashSession {
  id: number
  userId: number
  userName: string
  status: CashSessionStatus
  openingBalance: number
  closingBalance?: number
  expectedBalance?: number
  difference?: number
  openedAt: string
  closedAt?: string
  notes?: string
}

// --- Compras ---
export type PurchaseStatus = 'pendiente' | 'recibida' | 'parcial' | 'anulada'
export type PurchasePaymentStatus = 'pagado' | 'pendiente' | 'parcial'

export interface PurchaseItem {
  id?: number
  purchaseId?: number
  productId: number
  productName?: string
  quantity: number
  unitCost: number
  subtotal: number
}

export interface Purchase {
  id: number
  supplierId: number
  supplierName?: string
  userId: number
  userName?: string
  invoiceNumber?: string
  status: PurchaseStatus
  paymentStatus: PurchasePaymentStatus
  subtotal: number
  tax: number
  total: number
  paid: number
  dueDate?: string
  notes?: string
  receivedAt?: string
  createdAt: string
  updatedAt: string
  items?: PurchaseItem[]
}

// --- Taller / Motos ---
export interface Motorcycle {
  id: number
  clientId?: number
  clientName?: string
  plate: string
  brand: string
  model: string
  year?: number
  color?: string
  engineNumber?: string
  chassisNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type WorkOrderStatus = 'pendiente' | 'en_proceso' | 'finalizado' | 'entregado' | 'anulado'

export interface WorkOrderItem {
  id?: number
  workOrderId?: number
  type: 'repuesto' | 'mano_obra' | 'otro'
  productId?: number
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface WorkOrder {
  id: number
  orderNumber: string
  motorcycleId: number
  clientId?: number
  clientName?: string
  plate?: string
  brand?: string
  model?: string
  mechanicId?: number
  mechanicName?: string
  userId: number
  status: WorkOrderStatus
  description: string
  diagnosis?: string
  laborCost: number
  partsCost: number
  total: number
  estimatedDelivery?: string
  deliveredAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
  items?: WorkOrderItem[]
}

// --- Mecánicos ---
export interface Mechanic {
  id: number
  userId?: number
  name: string
  document?: string
  phone?: string
  specialty?: string
  patioFee: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MechanicDailyRecord {
  id: number
  mechanicId: number
  mechanicName: string
  date: string
  totalGenerated: number
  patioFee: number
  netAmount: number
  isPatioPaid: boolean
  patioPaidAmount: number
  isSettled: boolean
  settledAmount: number
  notes?: string
}

// --- Créditos / Cartera ---
export type CreditStatus = 'al_dia' | 'proximo' | 'vencido'

export interface Credit {
  id: number
  clientId: number
  clientName: string
  saleId?: number
  workOrderId?: number
  invoiceNumber: string
  originalAmount: number
  paidAmount: number
  balance: number
  dueDate: string
  status: CreditStatus
  createdAt: string
  updatedAt: string
}

export interface CreditPayment {
  id: number
  creditId: number
  amount: number
  method: PaymentMethod
  reference?: string
  notes?: string
  userId: number
  createdAt: string
}

// --- Contabilidad ---
export interface AccountingAccount {
  id: number
  code: string
  name: string
  type: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto' | 'costo'
  parentCode?: string
  isActive: boolean
  allowsMovement: boolean
}

export interface JournalEntry {
  id: number
  entryNumber: string
  date: string
  description: string
  reference?: string
  referenceType?: string
  userId: number
  createdAt: string
  lines?: JournalLine[]
}

export interface JournalLine {
  id?: number
  entryId?: number
  accountCode: string
  accountName?: string
  debit: number
  credit: number
  description?: string
}

// --- Dashboard KPIs ---
export interface DashboardKPIs {
  salesToday: number
  salesYesterday: number
  salesVariation: number
  salesMTD: number
  transactionsToday: number
  averageTicket: number
  avgTicket: number
  grossMargin: number
  unitsSoldToday: number
  cashBalance: number
  pendingCredits: number
  lowStockCount: number
  outOfStockCount: number
  activeWorkOrders: number
  overdueCredits: number
}

export interface SalesChartPoint {
  label: string
  sales: number
  cost: number
  transactions: number
}

// --- Auditoría ---
export interface AuditLog {
  id: number
  userId: number
  userName: string
  action: string
  module: string
  recordId?: number
  before?: string
  after?: string
  ip?: string
  createdAt: string
}

// --- Alertas ---
export type AlertType = 'stock_bajo' | 'agotado' | 'credito_vencido' | 'caja_descuadrada' | 'anulacion'
export type AlertSeverity = 'info' | 'warning' | 'error'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  data?: unknown
  createdAt: string
  isRead: boolean
}