// Extiende Window para que TypeScript reconozca window.api
import type {
  IpcResponse, PaginatedResult,
  User, Product, Category, Supplier, StockMovement,
  Client, Sale, CashSession, Purchase, Motorcycle,
  WorkOrder, Mechanic, Credit, CreditPayment,
  AccountingAccount, JournalEntry, AuditLog,
  DashboardKPIs, SalesChartPoint, Alert,
} from '../../../shared/types'


interface ProductListResult {
  items: Product[]
  total: number
  page: number
  pageSize: number
}

declare global {
  interface Window {
    appConfirm?: (
      message: string,
      options?: {
        title?: string
        confirmText?: string
        cancelText?: string
        variant?: 'info' | 'success' | 'warning' | 'error'
      }
    ) => Promise<boolean>
    api: {
      // Auth
      login:          (data: { username: string; password: string }) => Promise<IpcResponse<User>>
      logout:         () => Promise<IpcResponse>
      getSession:     () => Promise<IpcResponse<User>>
      changePassword: (data: { oldPassword: string; newPassword: string }) => Promise<IpcResponse>

      // Configuración
      getSettings:     ()               => Promise<IpcResponse<Record<string, string>>>
      updateSettings:  (data: unknown)  => Promise<IpcResponse>

      // Usuarios
      listUsers:   (params?: unknown) => Promise<IpcResponse<User[]>>
      createUser:  (data: unknown)    => Promise<IpcResponse<User>>
      updateUser:  (data: unknown)    => Promise<IpcResponse<User>>
      deleteUser:  (id: number)       => Promise<IpcResponse>

      // Productos
      listProducts:   (params?: unknown) => Promise<IpcResponse<ProductListResult>>
      getProduct:     (id: number)       => Promise<IpcResponse<Product>>
      createProduct:  (data: unknown)    => Promise<IpcResponse<Product>>
      updateProduct:  (data: unknown)    => Promise<IpcResponse<Product>>
      deleteProduct:  (id: number)       => Promise<IpcResponse>
      adjustStock:    (data: unknown)    => Promise<IpcResponse>
      searchProducts: (query: string)    => Promise<IpcResponse<Product[]>>
      getLowStock:    ()                 => Promise<IpcResponse<Product[]>>

      // Categorías
      listCategories:  (params?: unknown) => Promise<IpcResponse<Category[]>>
      createCategory:  (data: unknown)    => Promise<IpcResponse<Category>>
      updateCategory:  (data: unknown)    => Promise<IpcResponse<Category>>
      deleteCategory:  (id: number)       => Promise<IpcResponse>

      // Proveedores
      listSuppliers:  (params?: unknown) => Promise<IpcResponse<Supplier[]>>
      createSupplier: (data: unknown)    => Promise<IpcResponse<Supplier>>
      updateSupplier: (data: unknown)    => Promise<IpcResponse<Supplier>>
      deleteSupplier: (id: number)       => Promise<IpcResponse>

      // Movimientos
      listMovements:      (params?: unknown) => Promise<IpcResponse<PaginatedResult<StockMovement>>>
      movementsByProduct: (id: number)       => Promise<IpcResponse<StockMovement[]>>

      // Clientes
      listClients:   (params?: unknown) => Promise<IpcResponse<PaginatedResult<Client>>>
      getClient:     (id: number)       => Promise<IpcResponse<Client>>
      createClient:  (data: unknown)    => Promise<IpcResponse<Client>>
      updateClient:  (data: unknown)    => Promise<IpcResponse<Client>>
      deleteClient:  (id: number)       => Promise<IpcResponse>
      searchClients: (query: string)    => Promise<IpcResponse<Client[]>>

      // Ventas
      listSales:  (params?: unknown) => Promise<IpcResponse<PaginatedResult<Sale>>>
      getSale:    (id: number)       => Promise<IpcResponse<Sale>>
      createSale: (data: unknown)    => Promise<IpcResponse<Sale>>
      cancelSale: (data: unknown)    => Promise<IpcResponse>
      returnSale: (data: unknown)    => Promise<IpcResponse>
      salesToday: ()                 => Promise<IpcResponse<Sale[]>>

      // Caja
      openCash:    (data: unknown)    => Promise<IpcResponse<CashSession>>
      closeCash:   (data: unknown)    => Promise<IpcResponse<CashSession>>
      currentCash: ()                 => Promise<IpcResponse<CashSession>>
      cashHistory: (params?: unknown) => Promise<IpcResponse<PaginatedResult<CashSession>>>

      // Compras
      listPurchases:   (params?: unknown) => Promise<IpcResponse<PaginatedResult<Purchase>>>
      getPurchase:     (id: number)       => Promise<IpcResponse<Purchase>>
      createPurchase:  (data: unknown)    => Promise<IpcResponse<Purchase>>
      updatePurchase:  (data: unknown)    => Promise<IpcResponse<Purchase>>
      receivePurchase: (data: unknown)    => Promise<IpcResponse<Purchase>>
      payPurchase:     (data: unknown)    => Promise<IpcResponse>

      // Motos
      listMotos:   (params?: unknown) => Promise<IpcResponse<PaginatedResult<Motorcycle>>>
      getMoto:     (id: number)       => Promise<IpcResponse<Motorcycle>>
      createMoto:  (data: unknown)    => Promise<IpcResponse<Motorcycle>>
      updateMoto:  (data: unknown)    => Promise<IpcResponse<Motorcycle>>
      searchMotos: (query: string)    => Promise<IpcResponse<Motorcycle[]>>

      // Órdenes de trabajo
      listWorkOrders:        (params?: unknown) => Promise<IpcResponse<PaginatedResult<WorkOrder>>>
      getWorkOrder:          (id: number)       => Promise<IpcResponse<WorkOrder>>
      createWorkOrder:       (data: unknown)    => Promise<IpcResponse<WorkOrder>>
      updateWorkOrder:       (data: unknown)    => Promise<IpcResponse<WorkOrder>>
      changeWorkOrderStatus: (data: unknown)    => Promise<IpcResponse<WorkOrder>>

      // Mecánicos
      listMechanics:   (params?: unknown) => Promise<IpcResponse<Mechanic[]>>
      createMechanic:  (data: unknown)    => Promise<IpcResponse<Mechanic>>
      updateMechanic:  (data: unknown)    => Promise<IpcResponse<Mechanic>>
      mechanicsDaily:  (date: unknown)    => Promise<IpcResponse<any>>
      settleMechanic:  (data: unknown)    => Promise<IpcResponse>
      payPatio:        (data: unknown)    => Promise<IpcResponse>
      listSettlements: (params?: unknown) => Promise<IpcResponse<PaginatedResult<any>>>

      // Créditos
      listCredits:  (params?: unknown) => Promise<IpcResponse<PaginatedResult<Credit>>>
      getCredit:    (id: number)       => Promise<IpcResponse<{ credit: Credit; payments: CreditPayment[] }>>
      payCredit:    (data: unknown)    => Promise<IpcResponse>
      creditsAging: ()                 => Promise<IpcResponse<any>>

      // Contabilidad
      getAccounts:             ()               => Promise<IpcResponse<AccountingAccount[]>>
      getJournal:              (params?:unknown) => Promise<IpcResponse<PaginatedResult<JournalEntry>>>
      getBalance:              (params?:unknown) => Promise<IpcResponse<any>>
      createEntry:             (data: unknown)   => Promise<IpcResponse<{ entryId: number; entryNumber: string }>>
      getLedger:               (data: unknown)   => Promise<IpcResponse<any>>
      autoEntrySale:           (data: unknown)   => Promise<IpcResponse>
      autoEntryPurchase:       (data: unknown)   => Promise<IpcResponse>
      autoEntryCreditPayment:  (data: unknown)   => Promise<IpcResponse>

      // Dashboard
      getDashboardKPIs:   (params?:unknown) => Promise<IpcResponse<DashboardKPIs>>
      getDashboardCharts: (params?:unknown) => Promise<IpcResponse<SalesChartPoint[]>>
      getDashboardAlerts: ()               => Promise<IpcResponse<Alert[]>>
      getDashboardTop:    (params?:unknown) => Promise<IpcResponse<{ topProducts: any[]; topMechanics: any[] }>>

      // Exportación
      exportSales:      (params?:unknown) => Promise<IpcResponse>
      exportInventory:  (params?:unknown) => Promise<IpcResponse>
      exportPurchases:  (params?:unknown) => Promise<IpcResponse>
      exportCredits:    (params?:unknown) => Promise<IpcResponse>
      exportMechanics:  (params?:unknown) => Promise<IpcResponse>
      exportKardex:     (params?:unknown) => Promise<IpcResponse>
      exportCash:       (params?:unknown) => Promise<IpcResponse>
      exportUsers:      (params?:unknown) => Promise<IpcResponse>
      exportSuppliers:  (params?:unknown) => Promise<IpcResponse>
      exportMotos:      (params?:unknown) => Promise<IpcResponse>
      exportClients:    (params?:unknown) => Promise<IpcResponse>
      exportMechanicsList: ()             => Promise<IpcResponse>
      importInventory:  ()                => Promise<IpcResponse>
      importClients:    ()                => Promise<IpcResponse>
      importPurchases:  ()                => Promise<IpcResponse>
      importMechanics:  ()                => Promise<IpcResponse>
      openExportFolder: ()               => Promise<IpcResponse>

      // PDF
      printInvoice:   (saleId: number)      => Promise<IpcResponse>
      sendInvoiceWhatsapp: (saleId: number) => Promise<IpcResponse>
      sendPendingWhatsapp: (data: unknown)  => Promise<IpcResponse>
      printWorkOrder: (workOrderId: number) => Promise<IpcResponse>
      printReceipt:   (data: unknown)       => Promise<IpcResponse>

      // Backup
      createBackup:  ()             => Promise<IpcResponse<{ filePath: string }>>
      restoreBackup: (path: string) => Promise<IpcResponse>
      listBackups:   ()             => Promise<IpcResponse<any[]>>

      // Auditoría
      listAudit: (params?:unknown) => Promise<IpcResponse<PaginatedResult<AuditLog>>>
    }
  }
}

export {}
