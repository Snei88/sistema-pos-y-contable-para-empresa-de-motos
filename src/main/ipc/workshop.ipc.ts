// src/main/ipc/workshop.ipc.ts
import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import {
  listMotos,
  getMoto,
  searchMotos,
  createMoto,
  updateMoto,
  listWorkOrders,
  getWorkOrder,
  createWorkOrder,
  updateWorkOrder,
  changeWorkOrderStatus,
  listMechanics,
  createMechanic,
  updateMechanic,
} from '../services/workshop/workshop.service'

export function registerWorkshopHandlers(): void {
  // Motos
  ipcMain.handle(IPC.MOTOS_LIST,    (_, params) => listMotos(params))
  ipcMain.handle(IPC.MOTOS_GET,     (_, id)     => getMoto(id))
  ipcMain.handle(IPC.MOTOS_CREATE,  (_, data)   => createMoto(data))
  ipcMain.handle(IPC.MOTOS_UPDATE,  (_, data)   => updateMoto(data))
  ipcMain.handle(IPC.MOTOS_SEARCH,  (_, query)  => searchMotos(query))

  // Órdenes de trabajo
  ipcMain.handle(IPC.WORKORDERS_LIST,        (_, params) => listWorkOrders(params))
  ipcMain.handle(IPC.WORKORDERS_GET,         (_, id)     => getWorkOrder(id))
  ipcMain.handle(IPC.WORKORDERS_CREATE,      (_, data)   => createWorkOrder(data))
  ipcMain.handle(IPC.WORKORDERS_UPDATE,      (_, data)   => updateWorkOrder(data))
  ipcMain.handle(IPC.WORKORDERS_CHANGE_STATUS, (_, data) => changeWorkOrderStatus(data))

  // Mecánicos
  ipcMain.handle(IPC.MECHANICS_LIST,   (_, params) => listMechanics(params))
  ipcMain.handle(IPC.MECHANICS_CREATE, (_, data)   => createMechanic(data))
  ipcMain.handle(IPC.MECHANICS_UPDATE, (_, data)   => updateMechanic(data))
}