// src/main/ipc/cash.ipc.ts
import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import {
  getCurrentCashSession,
  openCashSession,
  closeCashSession,
  listCashHistory,
  getCashSessionSummary,
} from '../services/cash/cash.service'

export function registerCashHandlers(): void {
  ipcMain.handle(IPC.CASH_CURRENT,  ()              => getCurrentCashSession())
  ipcMain.handle(IPC.CASH_OPEN,     (_, data)       => openCashSession(data))
  ipcMain.handle(IPC.CASH_CLOSE,    (_, data)       => closeCashSession(data))
  ipcMain.handle(IPC.CASH_HISTORY,  (_, params)     => listCashHistory(params))
  
  // Extra: resumen de sesión (no tiene constante dedicada, usamos CASH_CURRENT con ID)
  ipcMain.handle('cash:summary',    (_, sessionId)  => getCashSessionSummary(sessionId))
}