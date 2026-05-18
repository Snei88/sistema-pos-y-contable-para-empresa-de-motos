// ============================================================
// CONSTANTES GLOBALES — Manuel Motos
//src/shared/constants/index.ts
// ============================================================

export const APP_NAME = 'Manuel Motos'
export const APP_VERSION = '1.0.0'
export const DB_FILE = 'manuelmotos.db'

// Rutas IPC (canales de comunicación main ↔ renderer)
export const IPC = {
  // Auth
  AUTH_LOGIN:          'auth:login',
  AUTH_LOGOUT:         'auth:logout',
  AUTH_GET_SESSION:    'auth:getSession',
  AUTH_CHANGE_PASSWORD:'auth:changePassword',

  // Usuarios
  USERS_LIST:          'users:list',
  USERS_CREATE:        'users:create',
  USERS_UPDATE:        'users:update',
  USERS_DELETE:        'users:delete',

  // Productos
  PRODUCTS_LIST:       'products:list',
  PRODUCTS_GET:        'products:get',
  PRODUCTS_CREATE:     'products:create',
  PRODUCTS_UPDATE:     'products:update',
  PRODUCTS_DELETE:     'products:delete',
  PRODUCTS_ADJUST_STOCK: 'products:adjustStock',
  PRODUCTS_SEARCH:     'products:search',
  PRODUCTS_LOW_STOCK:  'products:lowStock',

  // Categorías
  CATEGORIES_LIST:     'categories:list',
  CATEGORIES_CREATE:   'categories:create',
  CATEGORIES_UPDATE:   'categories:update',
  CATEGORIES_DELETE:   'categories:delete',

  // Proveedores
  SUPPLIERS_LIST:      'suppliers:list',
  SUPPLIERS_CREATE:    'suppliers:create',
  SUPPLIERS_UPDATE:    'suppliers:update',
  SUPPLIERS_DELETE:    'suppliers:delete',

  // Movimientos de inventario
  MOVEMENTS_LIST:      'movements:list',
  MOVEMENTS_BY_PRODUCT:'movements:byProduct',

  // Clientes
  CLIENTS_LIST:        'clients:list',
  CLIENTS_GET:         'clients:get',
  CLIENTS_CREATE:      'clients:create',
  CLIENTS_UPDATE:      'clients:update',
  CLIENTS_DELETE:      'clients:delete',
  CLIENTS_SEARCH:      'clients:search',
  CLIENTS_HISTORY:     'clients:history',

  // Ventas
  SALES_LIST:          'sales:list',
  SALES_GET:           'sales:get',
  SALES_CREATE:        'sales:create',
  SALES_CANCEL:        'sales:cancel',
  SALES_RETURN:        'sales:return',
  SALES_TODAY:         'sales:today',

  // Caja
  CASH_OPEN:           'cash:open',
  CASH_CLOSE:          'cash:close',
  CASH_CURRENT:        'cash:current',
  CASH_HISTORY:        'cash:history',

  // Compras
  PURCHASES_LIST:      'purchases:list',
  PURCHASES_GET:       'purchases:get',
  PURCHASES_CREATE:    'purchases:create',
  PURCHASES_UPDATE:    'purchases:update',
  PURCHASES_RECEIVE:   'purchases:receive',

  // Motos
  MOTOS_LIST:          'motos:list',
  MOTOS_GET:           'motos:get',
  MOTOS_CREATE:        'motos:create',
  MOTOS_UPDATE:        'motos:update',
  MOTOS_SEARCH:        'motos:search',

  // Órdenes de trabajo
  WORKORDERS_LIST:     'workorders:list',
  WORKORDERS_GET:      'workorders:get',
  WORKORDERS_CREATE:   'workorders:create',
  WORKORDERS_UPDATE:   'workorders:update',
  WORKORDERS_CHANGE_STATUS: 'workorders:changeStatus',

  // Mecánicos
  MECHANICS_LIST:      'mechanics:list',
  MECHANICS_CREATE:    'mechanics:create',
  MECHANICS_UPDATE:    'mechanics:update',
  MECHANICS_DAILY:     'mechanics:daily',
  MECHANICS_SETTLE:    'mechanics:settle',

  // Créditos
  CREDITS_LIST:        'credits:list',
  CREDITS_GET:         'credits:get',
  CREDITS_PAY:         'credits:pay',
  CREDITS_AGING:       'credits:aging',

  // Contabilidad
  ACCOUNTING_ACCOUNTS: 'accounting:accounts',
  ACCOUNTING_JOURNAL:  'accounting:journal',
  ACCOUNTING_BALANCE:  'accounting:balance',

  // Dashboard
  DASHBOARD_KPIS:      'dashboard:kpis',
  DASHBOARD_CHARTS:    'dashboard:charts',
  DASHBOARD_ALERTS:    'dashboard:alerts',
  DASHBOARD_TOP:       'dashboard:top',

  // Reportes / Exportación
  EXPORT_SALES:        'export:sales',
  EXPORT_INVENTORY:    'export:inventory',
  EXPORT_PURCHASES:    'export:purchases',
  EXPORT_CREDITS:      'export:credits',
  EXPORT_MECHANICS:    'export:mechanics',
  EXPORT_KARDEX:       'export:kardex',
  EXPORT_CASH:         'export:cash',
  EXPORT_USERS:        'export:users',
  EXPORT_SUPPLIERS:    'export:suppliers',
  EXPORT_MOTOS:        'export:motos',
  EXPORT_CLIENTS:      'export:clients',
  EXPORT_MECHANICS_LIST:'export:mechanicsList',
  IMPORT_INVENTORY:    'import:inventory',
  IMPORT_CLIENTS:      'import:clients',
  IMPORT_PURCHASES:    'import:purchases',
  IMPORT_MECHANICS:    'import:mechanics',

  // PDF
  PDF_INVOICE:         'pdf:invoice',
  PDF_INVOICE_WHATSAPP:'pdf:invoiceWhatsapp',
  PDF_PENDING_WHATSAPP:'pdf:pendingWhatsapp',
  PDF_WORKORDER:       'pdf:workorder',
  PDF_RECEIPT:         'pdf:receipt',

  // Backup
  BACKUP_CREATE:       'backup:create',
  BACKUP_RESTORE:      'backup:restore',
  BACKUP_LIST:         'backup:list',

  // Auditoría
  AUDIT_LIST:          'audit:list',
  
  // Resumen de caja
  CASH_SUMMARY:        'cash:summary',
} as const

// Métodos de pago (para UI)
export const PAYMENT_METHODS = [
  { value: 'efectivo',     label: 'Efectivo' },
  { value: 'tarjeta',      label: 'Tarjeta' },
  { value: 'transferencia',label: 'Transferencia' },
  { value: 'nequi',        label: 'Nequi' },
  { value: 'daviplata',    label: 'Daviplata' },
  { value: 'credito',      label: 'Crédito' },
  { value: 'otro',         label: 'Otro' },
] as const

// Estados de venta
export const SALE_STATUSES = [
  { value: 'completada', label: 'Completada', color: 'green' },
  { value: 'pendiente',  label: 'Pendiente',  color: 'yellow' },
  { value: 'anulada',    label: 'Anulada',    color: 'red' },
] as const

// Estados OT
export const WORK_ORDER_STATUSES = [
  { value: 'pendiente',   label: 'Pendiente',   color: 'gray' },
  { value: 'en_proceso',  label: 'En proceso',  color: 'blue' },
  { value: 'finalizado',  label: 'Finalizado',  color: 'green' },
  { value: 'entregado',   label: 'Entregado',   color: 'brand' },
  { value: 'anulado',     label: 'Anulado',     color: 'red' },
] as const

// Unidades de medida
export const UNITS = [
  { value: 'und',  label: 'Unidad' },
  { value: 'par',  label: 'Par' },
  { value: 'kit',  label: 'Kit' },
  { value: 'caja', label: 'Caja' },
  { value: 'lt',   label: 'Litro' },
  { value: 'ml',   label: 'Mililitro' },
  { value: 'mt',   label: 'Metro' },
  { value: 'gr',   label: 'Gramo' },
] as const

// Configuración de alertas de stock
export const DEFAULT_MIN_STOCK = 3
export const STOCK_CRITICAL = 1

// Configuración de créditos (días)
export const CREDIT_WARNING_DAYS = 5   // días antes del vencimiento
export const CREDIT_OVERDUE_DAYS = 0   // días después = vencido

// Formato de fechas Colombia
export const DATE_FORMAT = 'dd/MM/yyyy'
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm'
export const TIMEZONE = 'America/Bogota'

// IVA Colombia
export const IVA_RATE = 0.19  // 19%
export const IVA_LABEL = 'IVA 19%'

// Paginación por defecto
export const DEFAULT_PAGE_SIZE = 20

// Backup
export const BACKUP_INTERVAL_HOURS = 6
export const MAX_BACKUPS = 30

// Hotkeys POS
export const HOTKEYS = {
  SEARCH_PRODUCT:    'F2',
  NEW_SALE:          'F4',
  PROCESS_PAYMENT:   'F8',
  CANCEL_SALE:       'Escape',
  HOLD_SALE:         'F6',
  OPEN_CASH:         'F10',
  QUICK_CLIENT:      'F3',
  PRINT_LAST:        'F9',
  TOGGLE_SIDEBAR:    'F1',
  DISCOUNT:          'F5',
} as const
