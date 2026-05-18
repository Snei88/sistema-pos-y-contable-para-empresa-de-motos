// src/main/ipc/inventory.ipc.ts
import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import {
  listProducts, getProduct, searchProducts, createProduct,
  updateProduct, deleteProduct, adjustStock, getLowStock,
  getMovementsByProduct, listCategories, createCategory,
  updateCategory, deleteCategory, listSuppliers, createSupplier,
  updateSupplier, deleteSupplier,
} from '../services/inventory/inventory.service'

export function registerInventoryHandlers(): void {
  ipcMain.handle(IPC.PRODUCTS_LIST,         (_, p)    => listProducts(p))
  ipcMain.handle(IPC.PRODUCTS_GET,          (_, id)   => getProduct(id))
  ipcMain.handle(IPC.PRODUCTS_SEARCH,       (_, q)    => searchProducts(q))
  ipcMain.handle(IPC.PRODUCTS_CREATE,       (_, data) => createProduct(data))
  ipcMain.handle(IPC.PRODUCTS_UPDATE,       (_, data) => updateProduct(data))
  ipcMain.handle(IPC.PRODUCTS_DELETE,       (_, id)   => deleteProduct(id))
  ipcMain.handle(IPC.PRODUCTS_ADJUST_STOCK, (_, data) => adjustStock(data))
  ipcMain.handle(IPC.PRODUCTS_LOW_STOCK,    ()        => getLowStock())
  ipcMain.handle(IPC.MOVEMENTS_BY_PRODUCT,  (_, id)   => getMovementsByProduct(id))

  ipcMain.handle(IPC.CATEGORIES_LIST,   ()        => listCategories())
  ipcMain.handle(IPC.CATEGORIES_CREATE, (_, data) => createCategory(data))
  ipcMain.handle(IPC.CATEGORIES_UPDATE, (_, data) => updateCategory(data))
  ipcMain.handle(IPC.CATEGORIES_DELETE, (_, id)   => deleteCategory(id))

  ipcMain.handle(IPC.SUPPLIERS_LIST,   (_, p)    => listSuppliers(p))
  ipcMain.handle(IPC.SUPPLIERS_CREATE, (_, data) => createSupplier(data))
  ipcMain.handle(IPC.SUPPLIERS_UPDATE, (_, data) => updateSupplier(data))
  ipcMain.handle(IPC.SUPPLIERS_DELETE, (_, id)   => deleteSupplier(id))
}