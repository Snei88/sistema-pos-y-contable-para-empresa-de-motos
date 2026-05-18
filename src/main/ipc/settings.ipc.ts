//src/main/ipc/settings.ipc.ts
import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import {
    getSettings,
    updateSettings,
    listUsers,
    createUser,
    updateUser,
    deleteUser,
    listAudit,
    createBackup,
    listBackups,
    restoreBackup,
} from '../services/settings/settings.service'

export function registerSettingsHandlers(): void {
    // Configuración empresa
    ipcMain.handle('settings:get',    () => getSettings())
    ipcMain.handle('settings:update', (_, data) => updateSettings(data))

    // Usuarios
    ipcMain.handle(IPC.USERS_LIST,    () => listUsers())
    ipcMain.handle(IPC.USERS_CREATE,  (_, data) => createUser(data))
    ipcMain.handle(IPC.USERS_UPDATE,  (_, data) => updateUser(data))
    ipcMain.handle(IPC.USERS_DELETE,  (_, id)   => deleteUser(id))

    // Auditoría
    ipcMain.handle(IPC.AUDIT_LIST,    (_, params) => listAudit(params))

    // Backup
    ipcMain.handle(IPC.BACKUP_CREATE,  () => createBackup())
    ipcMain.handle(IPC.BACKUP_LIST,    () => listBackups())
    ipcMain.handle(IPC.BACKUP_RESTORE, (_, path) => restoreBackup(path))
}