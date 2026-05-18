// src/main/ipc/mechanics.ipc.ts
import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import {
  getMechanicDaily,
  payPatio,
  settleMechanic,
  listSettlements,
} from '../services/mechanics/mechanic.service'

export function registerMechanicsHandlers(): void {
  ipcMain.handle(IPC.MECHANICS_DAILY,  (_, data) => getMechanicDaily(data))
  ipcMain.handle(IPC.MECHANICS_SETTLE, (_, data) => settleMechanic(data))
  
  // Extra handlers sin constantes dedicadas
  ipcMain.handle('mechanics:payPatio',    (_, data) => payPatio(data))
  ipcMain.handle('mechanics:settlements', (_, params) => listSettlements(params))
}