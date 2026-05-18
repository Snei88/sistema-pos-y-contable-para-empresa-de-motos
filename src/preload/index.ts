//src\preload\index.ts
import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/constants/index'

// Expone la API de IPC al renderer de forma segura
contextBridge.exposeInMainWorld('api', {
  // Auth
  login:          (data: unknown) => ipcRenderer.invoke(IPC.AUTH_LOGIN, data),
  logout:         ()              => ipcRenderer.invoke(IPC.AUTH_LOGOUT),
  getSession:     ()              => ipcRenderer.invoke(IPC.AUTH_GET_SESSION),
  changePassword: (data: unknown) => ipcRenderer.invoke(IPC.AUTH_CHANGE_PASSWORD, data),

  // Configuración
  getSettings:     ()              => ipcRenderer.invoke('settings:get'),
  updateSettings:  (data: unknown) => ipcRenderer.invoke('settings:update', data),

  // Usuarios
  listUsers:   (params?: unknown) => ipcRenderer.invoke(IPC.USERS_LIST, params),
  createUser:  (data: unknown)    => ipcRenderer.invoke(IPC.USERS_CREATE, data),
  updateUser:  (data: unknown)    => ipcRenderer.invoke(IPC.USERS_UPDATE, data),
  deleteUser:  (id: number)       => ipcRenderer.invoke(IPC.USERS_DELETE, id),

  // Productos
  listProducts:    (params?: unknown) => ipcRenderer.invoke(IPC.PRODUCTS_LIST, params),
  getProduct:      (id: number)       => ipcRenderer.invoke(IPC.PRODUCTS_GET, id),
  createProduct:   (data: unknown)    => ipcRenderer.invoke(IPC.PRODUCTS_CREATE, data),
  updateProduct:   (data: unknown)    => ipcRenderer.invoke(IPC.PRODUCTS_UPDATE, data),
  deleteProduct:   (id: number)       => ipcRenderer.invoke(IPC.PRODUCTS_DELETE, id),
  adjustStock:     (data: unknown)    => ipcRenderer.invoke(IPC.PRODUCTS_ADJUST_STOCK, data),
  searchProducts:  (query: string)    => ipcRenderer.invoke(IPC.PRODUCTS_SEARCH, query),
  getLowStock:     ()                 => ipcRenderer.invoke(IPC.PRODUCTS_LOW_STOCK),

  // Categorías
  listCategories:  (params?: unknown) => ipcRenderer.invoke(IPC.CATEGORIES_LIST, params),
  createCategory:  (data: unknown)    => ipcRenderer.invoke(IPC.CATEGORIES_CREATE, data),
  updateCategory:  (data: unknown)    => ipcRenderer.invoke(IPC.CATEGORIES_UPDATE, data),
  deleteCategory:  (id: number)       => ipcRenderer.invoke(IPC.CATEGORIES_DELETE, id),

  // Proveedores
  listSuppliers:   (params?: unknown) => ipcRenderer.invoke(IPC.SUPPLIERS_LIST, params),
  createSupplier:  (data: unknown)    => ipcRenderer.invoke(IPC.SUPPLIERS_CREATE, data),
  updateSupplier:  (data: unknown)    => ipcRenderer.invoke(IPC.SUPPLIERS_UPDATE, data),
  deleteSupplier:  (id: number)       => ipcRenderer.invoke(IPC.SUPPLIERS_DELETE, id),

  // Movimientos
  listMovements:      (params?: unknown) => ipcRenderer.invoke(IPC.MOVEMENTS_LIST, params),
  movementsByProduct: (id: number)       => ipcRenderer.invoke(IPC.MOVEMENTS_BY_PRODUCT, id),

  // Clientes
  listClients:   (params?: unknown) => ipcRenderer.invoke(IPC.CLIENTS_LIST, params),
  getClient:     (id: number)       => ipcRenderer.invoke(IPC.CLIENTS_GET, id),
  createClient:  (data: unknown)    => ipcRenderer.invoke(IPC.CLIENTS_CREATE, data),
  updateClient:  (data: unknown)    => ipcRenderer.invoke(IPC.CLIENTS_UPDATE, data),
  deleteClient:  (id: number)       => ipcRenderer.invoke(IPC.CLIENTS_DELETE, id),
  searchClients: (query: string)    => ipcRenderer.invoke(IPC.CLIENTS_SEARCH, query),
  getClientHistory: (id: number)    => ipcRenderer.invoke('clients:history', id),

  // Ventas
  listSales:    (params?:unknown) => ipcRenderer.invoke(IPC.SALES_LIST, params),
  getSale:      (id: number)      => ipcRenderer.invoke(IPC.SALES_GET, id),
  createSale:   (data: unknown)   => ipcRenderer.invoke(IPC.SALES_CREATE, data),
  cancelSale:   (data: unknown)   => ipcRenderer.invoke(IPC.SALES_CANCEL, data),
  returnSale:   (data: unknown)    => ipcRenderer.invoke(IPC.SALES_RETURN, data),
  salesToday:   ()                => ipcRenderer.invoke(IPC.SALES_TODAY),

  // Caja
  openCash:      (data: unknown) => ipcRenderer.invoke(IPC.CASH_OPEN, data),
  closeCash:     (data: unknown) => ipcRenderer.invoke(IPC.CASH_CLOSE, data),
  currentCash:   ()              => ipcRenderer.invoke(IPC.CASH_CURRENT),
  cashHistory:   (params?:unknown)=> ipcRenderer.invoke(IPC.CASH_HISTORY, params),
  getCashSummary:(sessionId: number) => ipcRenderer.invoke('cash:summary', sessionId),

  // Compras
  listPurchases:   (params?:unknown)  => ipcRenderer.invoke(IPC.PURCHASES_LIST, params),
  getPurchase:     (id: number)       => ipcRenderer.invoke(IPC.PURCHASES_GET, id),
  createPurchase:  (data: unknown)    => ipcRenderer.invoke(IPC.PURCHASES_CREATE, data),
  receivePurchase: (data: unknown)    => ipcRenderer.invoke(IPC.PURCHASES_RECEIVE, data),
  updatePurchase:  (data: unknown)    => ipcRenderer.invoke(IPC.PURCHASES_UPDATE, data),
  cancelPurchase:  (id: number)       => ipcRenderer.invoke('purchases:cancel', id),

  // Motos
  listMotos:   (params?: unknown) => ipcRenderer.invoke(IPC.MOTOS_LIST, params),
  getMoto:     (id: number)       => ipcRenderer.invoke(IPC.MOTOS_GET, id),
  createMoto:  (data: unknown)    => ipcRenderer.invoke(IPC.MOTOS_CREATE, data),
  updateMoto:  (data: unknown)    => ipcRenderer.invoke(IPC.MOTOS_UPDATE, data),
  searchMotos: (query: string)    => ipcRenderer.invoke(IPC.MOTOS_SEARCH, query),

  // Órdenes de trabajo
  listWorkOrders:       (params?: unknown) => ipcRenderer.invoke(IPC.WORKORDERS_LIST, params),
  getWorkOrder:         (id: number)       => ipcRenderer.invoke(IPC.WORKORDERS_GET, id),
  createWorkOrder:      (data: unknown)    => ipcRenderer.invoke(IPC.WORKORDERS_CREATE, data),
  updateWorkOrder:      (data: unknown)    => ipcRenderer.invoke(IPC.WORKORDERS_UPDATE, data),
  changeWorkOrderStatus:(data: unknown)    => ipcRenderer.invoke(IPC.WORKORDERS_CHANGE_STATUS, data),

  // Mecánicos
  listMechanics:    (params?: unknown) => ipcRenderer.invoke(IPC.MECHANICS_LIST, params),
  createMechanic:   (data: unknown)    => ipcRenderer.invoke(IPC.MECHANICS_CREATE, data),
  updateMechanic:   (data: unknown)    => ipcRenderer.invoke(IPC.MECHANICS_UPDATE, data),
  // Mecánicos - liquidación
  mechanicsDaily:  (data: unknown)    => ipcRenderer.invoke(IPC.MECHANICS_DAILY, data),
  settleMechanic:  (data: unknown)    => ipcRenderer.invoke(IPC.MECHANICS_SETTLE, data),
  payPatio:        (data: unknown)    => ipcRenderer.invoke('mechanics:payPatio', data),
  listSettlements: (params?:unknown)  => ipcRenderer.invoke('mechanics:settlements', params),

  // Créditos
  listCredits:  (params?: unknown) => ipcRenderer.invoke(IPC.CREDITS_LIST, params),
  getCredit:    (id: number)       => ipcRenderer.invoke(IPC.CREDITS_GET, id),
  payCredit:    (data: unknown)    => ipcRenderer.invoke(IPC.CREDITS_PAY, data),
  creditsAging: ()                 => ipcRenderer.invoke(IPC.CREDITS_AGING),

  // Contabilidad
  getAccounts:  ()              => ipcRenderer.invoke(IPC.ACCOUNTING_ACCOUNTS),
  getJournal:   (params?:unknown)=> ipcRenderer.invoke(IPC.ACCOUNTING_JOURNAL, params),
  getBalance:   (params?:unknown)=> ipcRenderer.invoke(IPC.ACCOUNTING_BALANCE, params),
  
  // Extras contabilidad
  createEntry:  (data: unknown) => ipcRenderer.invoke('accounting:createEntry', data),
  getLedger:    (data: unknown) => ipcRenderer.invoke('accounting:ledger', data),
  autoEntrySale: (data: unknown) => ipcRenderer.invoke('accounting:autoSale', data),
  autoEntryPurchase: (data: unknown) => ipcRenderer.invoke('accounting:autoPurchase', data),
  autoEntryCreditPayment: (data: unknown) => ipcRenderer.invoke('accounting:autoCreditPayment', data),

  // Dashboard
  getDashboardKPIs:    (params?:unknown) => ipcRenderer.invoke(IPC.DASHBOARD_KPIS, params),
  getDashboardCharts:  (params?:unknown) => ipcRenderer.invoke(IPC.DASHBOARD_CHARTS, params),
  getDashboardAlerts:  ()               => ipcRenderer.invoke(IPC.DASHBOARD_ALERTS),
  getDashboardTop:     (params?:unknown) => ipcRenderer.invoke(IPC.DASHBOARD_TOP, params),

  // Exportación
  exportSales:     (params?:unknown) => ipcRenderer.invoke(IPC.EXPORT_SALES, params),
  exportInventory: (params?:unknown) => ipcRenderer.invoke(IPC.EXPORT_INVENTORY, params),
  exportPurchases: (params?:unknown) => ipcRenderer.invoke(IPC.EXPORT_PURCHASES, params),
  exportCredits:   (params?:unknown) => ipcRenderer.invoke(IPC.EXPORT_CREDITS, params),
  exportMechanics: (params?:unknown) => ipcRenderer.invoke(IPC.EXPORT_MECHANICS, params),
  exportKardex:    (params?:unknown) => ipcRenderer.invoke(IPC.EXPORT_KARDEX, params),
  exportCash:      (params?:unknown) => ipcRenderer.invoke(IPC.EXPORT_CASH, params),
  exportUsers:     (params?:unknown) => ipcRenderer.invoke(IPC.EXPORT_USERS, params),
  exportSuppliers: (params?:unknown) => ipcRenderer.invoke(IPC.EXPORT_SUPPLIERS, params),
  exportMotos:     (params?:unknown) => ipcRenderer.invoke(IPC.EXPORT_MOTOS, params),
  exportClients:   (params?:unknown) => ipcRenderer.invoke(IPC.EXPORT_CLIENTS, params),
  exportMechanicsList: ()            => ipcRenderer.invoke(IPC.EXPORT_MECHANICS_LIST),
  importInventory: ()                => ipcRenderer.invoke(IPC.IMPORT_INVENTORY),
  importClients:   ()                => ipcRenderer.invoke(IPC.IMPORT_CLIENTS),
  importPurchases: ()                => ipcRenderer.invoke(IPC.IMPORT_PURCHASES),
  importMechanics: ()                => ipcRenderer.invoke(IPC.IMPORT_MECHANICS),
  openExportFolder:()                => ipcRenderer.invoke('reports:openFolder'),

  // PDF
  printInvoice:   (saleId: number)      => ipcRenderer.invoke(IPC.PDF_INVOICE, saleId),
  sendInvoiceWhatsapp: (saleId: number) => ipcRenderer.invoke(IPC.PDF_INVOICE_WHATSAPP, saleId),
  sendPendingWhatsapp: (data: unknown)  => ipcRenderer.invoke(IPC.PDF_PENDING_WHATSAPP, data),
  printWorkOrder: (workOrderId: number) => ipcRenderer.invoke(IPC.PDF_WORKORDER, workOrderId),
  printReceipt:   (data: unknown)       => ipcRenderer.invoke(IPC.PDF_RECEIPT, data),

  // Backup
  createBackup:  ()              => ipcRenderer.invoke(IPC.BACKUP_CREATE),
  restoreBackup: (path: string)  => ipcRenderer.invoke(IPC.BACKUP_RESTORE, path),
  listBackups:   ()              => ipcRenderer.invoke(IPC.BACKUP_LIST),

  // Auditoría
  listAudit: (params?:unknown) => ipcRenderer.invoke(IPC.AUDIT_LIST, params),
})

// Tipos para TypeScript en el renderer
export type ApiType = any
