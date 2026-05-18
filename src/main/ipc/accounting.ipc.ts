import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import {
    getAccounts,
    createJournalEntry,
    getJournal,
    getLedger,
    getBalance,
    autoEntrySale,
    autoEntryPurchase,
    autoEntryCreditPayment,
} from '../services/accounting/accounting.service'

export function registerAccountingHandlers(): void {
    ipcMain.handle(IPC.ACCOUNTING_ACCOUNTS, () => getAccounts())
    ipcMain.handle(IPC.ACCOUNTING_JOURNAL,  (_, params) => getJournal(params))
    ipcMain.handle(IPC.ACCOUNTING_BALANCE, (_, params) => getBalance(params))
    
    // Extra handlers sin constantes dedicadas
    ipcMain.handle('accounting:createEntry', (_, data) => createJournalEntry(data))
    ipcMain.handle('accounting:ledger',    (_, data) => getLedger(data.accountCode, data))
    ipcMain.handle('accounting:autoSale',   (_, data) => autoEntrySale(data.saleId, data))
    ipcMain.handle('accounting:autoPurchase', (_, data) => autoEntryPurchase(data.purchaseId, data))
    ipcMain.handle('accounting:autoCreditPayment', (_, data) => autoEntryCreditPayment(data.paymentId, data))
}