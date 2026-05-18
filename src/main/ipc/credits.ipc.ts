import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import { listCredits, getCredit, payCredit, creditsAging } from '../services/credits/credit.service'

export function registerCreditsHandlers(): void {
    ipcMain.handle(IPC.CREDITS_LIST,  (_, params) => listCredits(params))
    ipcMain.handle(IPC.CREDITS_GET,   (_, id: number) => getCredit(id))
    ipcMain.handle(IPC.CREDITS_PAY,   (_, data) => payCredit(data))
    ipcMain.handle(IPC.CREDITS_AGING, () => creditsAging())
}