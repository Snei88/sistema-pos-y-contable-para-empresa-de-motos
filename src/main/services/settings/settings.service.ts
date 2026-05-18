import { getSqlite } from '../../database/connection'
import { getCurrentSession } from '../auth/auth.service'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync } from 'fs'
import type { IpcResponse, User } from '../../../shared/types/index'

// ============================================================
// CONFIGURACIÓN — Empresa, usuarios, backup
// ============================================================

function auditLog(action: string, module: string, recordId: number, before: any, after: any): void {
    const db = getSqlite()
    const session = getCurrentSession()
    db.prepare(`
        INSERT INTO audit_logs (user_id, user_name, action, module, record_id, before, after)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        session?.id ?? 1,
        session?.fullName ?? 'Sistema',
        action,
        module,
        recordId,
        before ? JSON.stringify(before) : null,
        after ? JSON.stringify(after) : null,
    )
}

// ── Obtener configuración ─────────────────────────────────
export function getSettings(): IpcResponse<Record<string, string>> {
    const db = getSqlite()
    const rows = db.prepare(`SELECT key, value FROM settings`).all() as any[]

    const settings: Record<string, string> = {}
    for (const row of rows) {
        settings[row.key] = row.value
    }

    return { success: true, data: settings }
}

// ── Actualizar configuración ───────────────────────────────
export function updateSettings(data: Record<string, string>): IpcResponse {
    const db = getSqlite()
    const session = getCurrentSession()
    if (!session) return { success: false, error: 'No hay sesión activa' }

    if (session.role !== 'admin') {
        return { success: false, error: 'Solo administradores pueden modificar configuración' }
    }

    const stmt = db.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, datetime('now','localtime'))
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = datetime('now','localtime')
    `)

    const saveSettings = db.transaction((entries: [string, string][]) => {
        for (const [key, value] of entries) {
            stmt.run(key, value ?? '')
        }
    })

    saveSettings(Object.entries(data))

    auditLog('UPDATE_SETTINGS', 'settings', 0, null, data)

    return { success: true, message: 'Configuración actualizada' }
}

// ── Listar usuarios ───────────────────────────────────────
export function listUsers(): IpcResponse<User[]> {
    const db = getSqlite()
    const rows = db.prepare(`
        SELECT id, username, full_name, role, is_active, created_at, updated_at
        FROM users
        WHERE is_active = 1
        ORDER BY full_name ASC
    `).all() as any[]

    return {
        success: true,
        data: rows.map(r => ({
            id: r.id,
            username: r.username,
            fullName: r.full_name,
            role: r.role,
            isActive: Boolean(r.is_active),
            createdAt: r.created_at,
            updatedAt: r.updated_at,
        })),
    }
}

// ── Crear usuario ─────────────────────────────────────────
export function createUser(data: {
    username: string
    password: string
    fullName: string
    role: string
}): IpcResponse {
    const db = getSqlite()
    const session = getCurrentSession()
    if (!session) return { success: false, error: 'No hay sesión activa' }

    if (session.role !== 'admin') {
        return { success: false, error: 'Solo administradores pueden crear usuarios' }
    }

    if (!data.username || !data.password || !data.fullName) {
        return { success: false, error: 'Todos los campos son requeridos' }
    }

    const existing = db.prepare(`SELECT id FROM users WHERE username = ?`).get(data.username)
    if (existing) return { success: false, error: 'El usuario ya existe' }

    const crypto = require('crypto')
    const hash = crypto.createHash('sha256').update(data.password).digest('hex')

    db.prepare(`
        INSERT INTO users (username, password_hash, full_name, role, is_active)
        VALUES (?, ?, ?, ?, 1)
    `).run(data.username, hash, data.fullName, data.role)

    auditLog('CREATE_USER', 'users', 0, null, { username: data.username, fullName: data.fullName, role: data.role })

    return { success: true, message: 'Usuario creado correctamente' }
}

// ── Actualizar usuario ────────────────────────────────────
export function updateUser(data: {
    id: number
    fullName?: string
    role?: string
    isActive?: boolean
    password?: string
}): IpcResponse {
    const db = getSqlite()
    const session = getCurrentSession()
    if (!session) return { success: false, error: 'No hay sesión activa' }

    if (session.role !== 'admin') {
        return { success: false, error: 'Solo administradores pueden editar usuarios' }
    }

    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(data.id) as any
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    const updates: string[] = []
    const args: unknown[] = []

    if (data.fullName) { updates.push('full_name = ?'); args.push(data.fullName) }
    if (data.role) { updates.push('role = ?'); args.push(data.role) }
    if (data.isActive !== undefined) { updates.push('is_active = ?'); args.push(data.isActive ? 1 : 0) }
    if (data.password) {
        const crypto = require('crypto')
        const hash = crypto.createHash('sha256').update(data.password).digest('hex')
        updates.push('password_hash = ?'); args.push(hash)
    }

    if (updates.length === 0) return { success: false, error: 'Nada que actualizar' }

    args.push(data.id)
    db.prepare(`UPDATE users SET ${updates.join(', ')}, updated_at = datetime('now','localtime') WHERE id = ?`).run(...args)

    auditLog('UPDATE_USER', 'users', data.id, { fullName: user.full_name, role: user.role }, data)

    return { success: true, message: 'Usuario actualizado' }
}

// ── Eliminar usuario (soft delete) ───────────────────────
export function deleteUser(id: number): IpcResponse {
    const db = getSqlite()
    const session = getCurrentSession()
    if (!session) return { success: false, error: 'No hay sesión activa' }
    if (session.role !== 'admin') return { success: false, error: 'Solo administradores pueden eliminar usuarios' }
    if (session.id === id) return { success: false, error: 'No puedes eliminar tu propio usuario' }

    const user = db.prepare(`SELECT id FROM users WHERE id = ? AND is_active = 1`).get(id)
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    db.prepare(`UPDATE users SET is_active = 0, updated_at = datetime('now','localtime') WHERE id = ?`).run(id)
    auditLog('DELETE_USER', 'users', id, null, { isActive: false })
    return { success: true, message: 'Usuario desactivado' }
}

// ── Listar auditoría ──────────────────────────────────────
export function listAudit(params?: {
    module?: string
    userId?: number
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
}): IpcResponse<{ data: any[]; total: number; page: number; totalPages: number }> {
    const db = getSqlite()
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 30
    const offset = (page - 1) * pageSize

    let where = 'WHERE 1=1'
    const args: unknown[] = []

    if (params?.module) { where += ' AND a.module = ?'; args.push(params.module) }
    if (params?.userId) { where += ' AND a.user_id = ?'; args.push(params.userId) }
    if (params?.startDate) { where += ' AND date(a.created_at) >= ?'; args.push(params.startDate) }
    if (params?.endDate) { where += ' AND date(a.created_at) <= ?'; args.push(params.endDate) }

    const total = (db.prepare(`SELECT COUNT(*) as c FROM audit_logs a ${where}`).get(...args) as { c: number }).c

    const rows = db.prepare(`
        SELECT a.*, u.full_name as user_name_full
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ${where}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
    `).all(...args, pageSize, offset) as any[]

    return {
        success: true,
        data: {
            data: rows.map(r => ({
                id: r.id,
                userId: r.user_id,
                userName: r.user_name,
                action: r.action,
                module: r.module,
                recordId: r.record_id,
                before: r.before,
                after: r.after,
                createdAt: r.created_at,
            })),
            total,
            page,
            totalPages: Math.ceil(total / pageSize),
        },
    }
}

// ── Cambiar contraseña propia ─────────────────────────────
export function changePassword(data: {
    currentPassword: string
    newPassword: string
}): IpcResponse {
    const db = getSqlite()
    const session = getCurrentSession()
    if (!session) return { success: false, error: 'No hay sesión activa' }

    const crypto = require('crypto')
    const currentHash = crypto.createHash('sha256').update(data.currentPassword).digest('hex')
    const newHash = crypto.createHash('sha256').update(data.newPassword).digest('hex')

    const user = db.prepare(`SELECT id FROM users WHERE id = ? AND password_hash = ?`).get(session.id, currentHash)
    if (!user) return { success: false, error: 'Contraseña actual incorrecta' }

    db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
        .run(newHash, session.id)

    return { success: true, message: 'Contraseña actualizada' }
}

// ── Crear backup ──────────────────────────────────────────
export function createBackup(): IpcResponse<{ filePath: string }> {
    const db = getSqlite()
    const dbPath = join(app.getPath('userData'), 'data', 'manuelmotos.db')
    
    const backupDir = join(app.getPath('userData'), 'backups')
    if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `manuelmotos_backup_${timestamp}.db`
    const filePath = join(backupDir, fileName)

    // Cerrar conexión temporalmente para copia segura
    copyFileSync(dbPath, filePath)

    // Limpiar backups antiguos (mantener últimos 30)
    const files = readdirSync(backupDir)
        .filter(f => f.startsWith('manuelmotos_backup_'))
        .map(f => ({ name: f, path: join(backupDir, f), stat: statSync(join(backupDir, f)) }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime())

    if (files.length > 30) {
        for (const old of files.slice(30)) {
            unlinkSync(old.path)
        }
    }

    db.prepare(`
        INSERT INTO backup_logs (file_name, file_path, file_size, type)
        VALUES (?, ?, ?, 'manual')
    `).run(fileName, filePath, statSync(filePath).size)

    return { success: true, data: { filePath } }
}

// ── Listar backups ────────────────────────────────────────
export function listBackups(): IpcResponse<{ fileName: string; filePath: string; createdAt: string; size: number; type: string }[]> {
    const db = getSqlite()
    const rows = db.prepare(`
        SELECT file_name, file_path, file_size, type, created_at
        FROM backup_logs
        ORDER BY created_at DESC
        LIMIT 50
    `).all() as any[]

    return {
        success: true,
        data: rows.map(r => ({
            fileName: r.file_name,
            filePath: r.file_path,
            createdAt: r.created_at,
            size: r.file_size,
            type: r.type,
        })),
    }
}

// ── Restaurar backup ──────────────────────────────────────
export function restoreBackup(filePath: string): IpcResponse {
    const session = getCurrentSession()
    if (!session || session.role !== 'admin') {
        return { success: false, error: 'Solo administradores pueden restaurar backups' }
    }

    if (!existsSync(filePath)) {
        return { success: false, error: 'Archivo de backup no encontrado' }
    }

    const dbPath = join(app.getPath('userData'), 'data', 'manuelmotos.db')
    const backupDir = join(app.getPath('userData'), 'backups')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safetyCopy = join(backupDir, `manuelmotos_pre_restore_${timestamp}.db`)

    // Copia de seguridad del estado actual antes de restaurar
    copyFileSync(dbPath, safetyCopy)

    try {
        copyFileSync(filePath, dbPath)
        return { success: true, message: 'Backup restaurado. Reinicie la aplicación.' }
    } catch (err: any) {
        // Intentar recuperar desde la copia de seguridad
        if (existsSync(safetyCopy)) {
            copyFileSync(safetyCopy, dbPath)
        }
        return { success: false, error: `Error al restaurar: ${err.message}` }
    }
}
