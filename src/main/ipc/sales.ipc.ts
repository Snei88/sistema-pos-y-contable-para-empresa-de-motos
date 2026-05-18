// src/main/ipc/sales.ipc.ts
import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import {
  listSales,
  getSale,
  createSale,
  cancelSale,
  getSalesToday,
} from '../services/sales/sales.service'

export function registerSalesHandlers(): void {
  ipcMain.handle(IPC.SALES_LIST,   (_, params) => listSales(params))
  ipcMain.handle(IPC.SALES_GET,    (_, id)     => getSale(id))
  ipcMain.handle(IPC.SALES_CREATE, (_, data)   => createSale(data))
  ipcMain.handle(IPC.SALES_CANCEL, (_, data)   => cancelSale(data))
  ipcMain.handle(IPC.SALES_RETURN, (_, data)   => cancelSale(data))
  ipcMain.handle(IPC.SALES_TODAY,  ()          => getSalesToday())
}