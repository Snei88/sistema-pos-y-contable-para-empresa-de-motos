//src\main\index.ts
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getDb, closeDb } from './database/connection'
import { runMigrations } from './database/migrations/init'
import { runSeeds } from './database/seeds/index'
import { registerAllIpcHandlers } from './ipc/index'

function getWindowIconPath(): string {
  const candidates = [
    join(__dirname, '../../resources/icon.png'),
    join(process.resourcesPath, 'app.asar.unpacked/resources/icon.png'),
    join(app.getAppPath(), 'resources/icon.png'),
  ]

  return candidates.find(existsSync) ?? candidates[0]
}

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width:          1280,
    height:         800,
    minWidth:       1024,
    minHeight:      600,
    show:           false,
    autoHideMenuBar: true,
    title:          'Manuel Motos',
    icon:           getWindowIconPath(),
    webPreferences: {
      preload:        join(__dirname, '../preload/index.mjs'),
      sandbox:        false,
      contextIsolation: true,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Interceptar navegaciones fuera del hash router (defensa contra file:///A:/cash)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Permitir solo URLs con hash o el index.html base
    if (!url.includes('#') && !url.endsWith('index.html') && url.startsWith('file://')) {
      console.warn('[Security] Navegación bloqueada:', url)
      event.preventDefault()
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer crash:', details)
  })
  
  mainWindow.webContents.on('console-message', (_event, level, message, _line, _sourceId) => {
    if (level === 2) console.error('[Renderer]', message) // Solo errores
  })

  return mainWindow
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.manuelmotos.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Inicializar base de datos
  try {
    getDb()
    runMigrations()
    runSeeds()
    console.log('[APP] Base de datos lista')
  } catch (err) {
    console.error('[APP] Error inicializando DB:', err)
  }

  // Registrar handlers IPC
  registerAllIpcHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDb()
  if (process.platform !== 'darwin') app.quit()
})
