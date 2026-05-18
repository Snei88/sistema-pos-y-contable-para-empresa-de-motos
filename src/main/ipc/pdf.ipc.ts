// src/main/ipc/pdf.ipc.ts
import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import { printInvoice, printWorkOrder, printReceipt, sendInvoiceWhatsapp, sendPendingWhatsapp } from '../services/sales/pdf.service'

export function registerPdfHandlers(): void {
  ipcMain.handle(IPC.PDF_INVOICE,   (_, saleId)      => printInvoice(saleId))
  ipcMain.handle(IPC.PDF_INVOICE_WHATSAPP, (_, saleId) => sendInvoiceWhatsapp(saleId))
  ipcMain.handle(IPC.PDF_PENDING_WHATSAPP, (_, data) => sendPendingWhatsapp(data))
  ipcMain.handle(IPC.PDF_WORKORDER, (_, workOrderId) => printWorkOrder(workOrderId))
  ipcMain.handle(IPC.PDF_RECEIPT,   (_, data)        => printReceipt(data))
}
