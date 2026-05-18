// src/main/ipc/auth.ipc.ts
import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import { login, logout, getSession, getCurrentSession, changePassword } from '../services/auth/auth.service'

export function registerAuthHandlers(): void {
  ipcMain.handle(IPC.AUTH_LOGIN, (_event, { username, password }) => {
    return login(username, password)
  })

  ipcMain.handle(IPC.AUTH_LOGOUT, () => {
    return logout()
  })

  ipcMain.handle(IPC.AUTH_GET_SESSION, () => {
    return getSession()
  })

  ipcMain.handle(IPC.AUTH_CHANGE_PASSWORD, (_event, { oldPassword, currentPassword, newPassword }) => {
    const session = getCurrentSession()
    if (!session) return { success: false, error: 'No hay sesión activa' }

    return changePassword(session.id, currentPassword ?? oldPassword, newPassword)
  })
}
