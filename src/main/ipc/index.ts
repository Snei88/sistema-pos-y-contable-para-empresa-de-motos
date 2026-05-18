// src/main/ipc/index.ts
import { registerAuthHandlers }      from './auth.ipc'
import { registerInventoryHandlers } from './inventory.ipc'
import { registerClientHandlers }    from './clients.ipc'
import { registerCashHandlers }      from './cash.ipc'
import { registerSalesHandlers }     from './sales.ipc'
import { registerPurchaseHandlers }  from './purchases.ipc'
import { registerWorkshopHandlers }  from './workshop.ipc'
import { registerMechanicsHandlers } from './mechanics.ipc'
import { registerCreditsHandlers }   from './credits.ipc'
import { registerAccountingHandlers } from './accounting.ipc'
import { registerReportsHandlers }   from './reports.ipc'
import { registerSettingsHandlers }  from './settings.ipc'
import { registerDashboardHandlers } from './dashboard.ipc'
import { registerPdfHandlers }       from './pdf.ipc'

export function registerAllIpcHandlers(): void {
  registerAuthHandlers()
  registerInventoryHandlers()
  registerClientHandlers()
  registerCashHandlers()
  registerSalesHandlers()
  registerPurchaseHandlers()
  registerWorkshopHandlers()
  registerMechanicsHandlers()
  registerCreditsHandlers()
  registerAccountingHandlers()
  registerReportsHandlers()
  registerSettingsHandlers()
  registerDashboardHandlers()
  registerPdfHandlers()
  console.log('[IPC] Handlers registrados')
}
