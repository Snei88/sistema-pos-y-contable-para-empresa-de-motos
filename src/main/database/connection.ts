//src\main\database\connection.ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import * as schema from './schema/index'

// ============================================================
// CONEXIÓN SQLITE + DRIZZLE
// ============================================================

let _db: ReturnType<typeof drizzle> | null = null
let _sqlite: Database.Database | null = null

function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  const dataDir = join(userDataPath, 'data')
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
  return join(dataDir, 'manuelmotos.db')
}

export function getDb() {
  if (_db) return _db

  const dbPath = getDbPath()
  console.log('[DB] Abriendo base de datos en:', dbPath)

  _sqlite = new Database(dbPath)

  // Optimizaciones SQLite para escritorio
  _sqlite.pragma('journal_mode = WAL')
  _sqlite.pragma('synchronous = NORMAL')
  _sqlite.pragma('foreign_keys = ON')
  _sqlite.pragma('temp_store = MEMORY')
  _sqlite.pragma('mmap_size = 30000000')
  _sqlite.pragma('cache_size = -16000')

  _db = drizzle(_sqlite, { schema })
  return _db
}

export function getSqlite(): Database.Database {
  if (!_sqlite) getDb()
  return _sqlite!
}

export function closeDb(): void {
  if (_sqlite) {
    _sqlite.close()
    _sqlite = null
    _db = null
    console.log('[DB] Conexión cerrada')
  }
}