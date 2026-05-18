import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import {
    exportSales,
    exportInventory,
    exportPurchases,
    exportCredits,
    exportMechanics,
    exportKardex,
    exportCash,
    exportUsers,
    exportSuppliers,
    exportMotos,
    exportClients,
    exportMechanicsList,
    importInventory,
    importClients,
    importPurchases,
    importMechanics,
    openExportFolder,
} from '../services/reports/report.service'

export function registerReportsHandlers(): void {
    ipcMain.handle(IPC.EXPORT_SALES,     (_, params) => exportSales(params))
    ipcMain.handle(IPC.EXPORT_INVENTORY, (_, params) => exportInventory(params))
    ipcMain.handle(IPC.EXPORT_PURCHASES, (_, params) => exportPurchases(params))
    ipcMain.handle(IPC.EXPORT_CREDITS,   (_, params) => exportCredits(params))
    ipcMain.handle(IPC.EXPORT_MECHANICS, (_, params) => exportMechanics(params))
    ipcMain.handle(IPC.EXPORT_KARDEX,    (_, params) => exportKardex(params))
    ipcMain.handle(IPC.EXPORT_CASH,      (_, params) => exportCash(params))
    ipcMain.handle(IPC.EXPORT_USERS,     () => exportUsers())
    ipcMain.handle(IPC.EXPORT_SUPPLIERS, (_, params) => exportSuppliers(params))
    ipcMain.handle(IPC.EXPORT_MOTOS,     (_, params) => exportMotos(params))
    ipcMain.handle(IPC.EXPORT_CLIENTS,   (_, params) => exportClients(params))
    ipcMain.handle(IPC.EXPORT_MECHANICS_LIST, () => exportMechanicsList())
    ipcMain.handle(IPC.IMPORT_INVENTORY, () => importInventory())
    ipcMain.handle(IPC.IMPORT_CLIENTS,   () => importClients())
    ipcMain.handle(IPC.IMPORT_PURCHASES, () => importPurchases())
    ipcMain.handle(IPC.IMPORT_MECHANICS, () => importMechanics())
    
    // Extra
    ipcMain.handle('reports:openFolder', () => openExportFolder())
}
