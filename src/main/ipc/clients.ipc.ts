// src/main/ipc/clients.ipc.ts
import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import {
  listClients,
  getClient,
  searchClients,
  createClient,
  updateClient,
  deleteClient,
  getClientHistory,
} from '../services/clients/client.service'

export function registerClientHandlers(): void {
  ipcMain.handle(IPC.CLIENTS_LIST,    (_, params) => listClients(params))
  ipcMain.handle(IPC.CLIENTS_GET,     (_, id)     => getClient(id))
  ipcMain.handle(IPC.CLIENTS_SEARCH,  (_, query)  => searchClients(query))
  ipcMain.handle(IPC.CLIENTS_CREATE,  (_, data)   => createClient(data))
  ipcMain.handle(IPC.CLIENTS_UPDATE,  (_, data)   => updateClient(data))
  ipcMain.handle(IPC.CLIENTS_DELETE,  (_, id)     => deleteClient(id))
  ipcMain.handle(IPC.CLIENTS_HISTORY, (_, id) => getClientHistory(id))
}