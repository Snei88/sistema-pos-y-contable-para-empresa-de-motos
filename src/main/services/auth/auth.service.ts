// src/main/services/auth/auth.service.ts
import crypto from 'crypto'
import { getSqlite } from '../../database/connection'
import type { IpcResponse, SessionUser } from '../../../shared/types/index'

// Sesión en memoria (proceso main)
let _session: SessionUser | null = null

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// ── Login ────────────────────────────────────────────────────
export function login(
  username: string,
  password: string
): IpcResponse<SessionUser> {
  const db = getSqlite()

  const user = db.prepare(`
    SELECT id, username, password_hash, full_name, role, is_active, updated_at, created_at
    FROM users
    WHERE username = ? AND is_active = 1
  `).get(username) as {
    id: number; username: string; password_hash: string
    full_name: string; role: string; is_active: number
    updated_at: string; created_at: string
  } | undefined

  if (!user) {
    return { success: false, error: 'Usuario no encontrado o inactivo' }
  }

  if (user.password_hash !== hashPassword(password)) {
    return { success: false, error: 'Contraseña incorrecta' }
  }

  // Actualizar último login
  db.prepare(`UPDATE users SET last_login_at = datetime('now','localtime') WHERE id = ?`)
    .run(user.id)

  _session = {
    id:          user.id,
    username:    user.username,
    fullName:    user.full_name,
    role:        user.role as SessionUser['role'],
    isActive:    Boolean(user.is_active),
    createdAt:   user.created_at,
    updatedAt:   user.updated_at,
  }

  return { success: true, data: _session }
}

// ── Logout ───────────────────────────────────────────────────
export function logout(): IpcResponse {
  _session = null
  return { success: true }
}

// ── Sesión actual ────────────────────────────────────────────
export function getSession(): IpcResponse<SessionUser | null> {
  return { success: true, data: _session }
}

// ── Cambiar contraseña ────────────────────────────────────────
export function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): IpcResponse {
  const db = getSqlite()

  const user = db.prepare(`SELECT password_hash FROM users WHERE id = ?`)
    .get(userId) as { password_hash: string } | undefined

  if (!user) return { success: false, error: 'Usuario no encontrado' }

  if (user.password_hash !== hashPassword(currentPassword)) {
    return { success: false, error: 'Contraseña actual incorrecta' }
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' }
  }

  db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
    .run(hashPassword(newPassword), userId)

  return { success: true }
}

// ── Exportar sesión para uso interno (sin IPC) ───────────────
export function getCurrentSession(): SessionUser | null {
  return _session
}