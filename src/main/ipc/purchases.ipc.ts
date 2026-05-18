// src/main/ipc/purchases.ipc.ts
import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import {
  listPurchases,
  getPurchase,
  createPurchase,
  receivePurchase,
  payPurchase,
  cancelPurchase,
} from '../services/purchases/purchase.service'

export function registerPurchaseHandlers(): void {
  ipcMain.handle(IPC.PURCHASES_LIST,    (_, params) => listPurchases(params))
  ipcMain.handle(IPC.PURCHASES_GET,     (_, id)     => getPurchase(id))
  ipcMain.handle(IPC.PURCHASES_CREATE,  (_, data)   => createPurchase(data))
  ipcMain.handle(IPC.PURCHASES_RECEIVE, (_, data)   => receivePurchase(data))
  ipcMain.handle(IPC.PURCHASES_UPDATE,  (_, data)   => payPurchase(data))
  // Nota: PURCHASES_UPDATE lo uso para pagos; anulación separada
  ipcMain.handle('purchases:cancel',    (_, id)     => cancelPurchase(id))
}