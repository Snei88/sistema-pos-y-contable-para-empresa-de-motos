// src/renderer/src/pages/settings/components/UsersTab.tsx
import { useState, useEffect, useCallback } from 'react'
import type { User, UserRole } from '../../../../../shared/types/index'
import { IconDownload, IconSpinner } from '../../../components/shared/Icons'

export default function UsersTab() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await window.api.listUsers()
        if (res.success && res.data) {
            setUsers(res.data)
        }
        setLoading(false)
    }, [])

    useEffect(() => { load() }, [load])

    async function handleSave(data: any) {
        const res = editingUser
            ? await window.api.updateUser({ ...data, id: editingUser.id })
            : await (window.api as any).createUser?.(data)
        if (res?.success) {
            setShowForm(false)
            setEditingUser(null)
            load()
        } else {
            alert(res?.error || 'Error al guardar usuario')
        }
    }

    async function handleExport() {
        setExporting(true)
        const res = await window.api.exportUsers()
        setExporting(false)

        if (res.success) {
            const data = res.data as { filePath?: string; count?: number } | undefined
            alert(`Excel exportado correctamente (${data?.count ?? users.length} usuarios).\n${data?.filePath ?? ''}`)
        } else {
            alert(res.error || 'Error al exportar usuarios')
        }
    }

    const roles = [
        { value: 'admin', label: 'Administrador' },
        { value: 'supervisor', label: 'Supervisor' },
        { value: 'cajero', label: 'Cajero' },
        { value: 'mecanico', label: 'Mecánico' },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>👥 Gestión de usuarios</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleExport} disabled={exporting || loading} style={{ ...styles.btnSecondary, opacity: exporting || loading ? 0.6 : 1 }}>
                        {exporting ? <><IconSpinner size={14} /> Exportando...</> : <><IconDownload size={14} /> Exportar Excel</>}
                    </button>
                    <button onClick={() => { setEditingUser(null); setShowForm(true) }} style={styles.btnPrimary}>
                        + Nuevo usuario
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Cargando...</div>
            ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No hay usuarios registrados</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {users.map(u => (
                        <div key={u.id} style={styles.userRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={styles.avatar}>{u.fullName.charAt(0).toUpperCase()}</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{u.fullName}</div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>{u.username} • {roles.find(r => r.value === u.role)?.label}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => { setEditingUser(u); setShowForm(true) }}
                                style={{ ...styles.btnAction, background: '#fef3c7', color: '#92400e' }}
                            >
                                Editar
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <UserFormModal
                    user={editingUser}
                    roles={roles}
                    onSave={handleSave}
                    onClose={() => { setShowForm(false); setEditingUser(null) }}
                />
            )}
        </div>
    )
}

function UserFormModal({ user, roles, onSave, onClose }: {
    user: User | null
    roles: { value: string; label: string }[]
    onSave: (data: any) => void
    onClose: () => void
}) {
    const [form, setForm] = useState<{
        username: string; fullName: string; role: UserRole; password: string; confirmPassword: string
    }>({
        username: user?.username || '',
        fullName: user?.fullName || '',
        role: (user?.role || 'cajero') as UserRole,
        password: '',
        confirmPassword: '',
    })
    const [saving, setSaving] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!user && form.password !== form.confirmPassword) {
            alert('Las contraseñas no coinciden')
            return
        }
        if (!user && form.password.length < 4) {
            alert('La contraseña debe tener al menos 4 caracteres')
            return
        }
        setSaving(true)
        await onSave({
            ...form,
            password: user ? undefined : form.password,
        })
        setSaving(false)
    }

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <div style={modalStyles.header}>
                    <h3 style={modalStyles.title}>{user ? 'Editar usuario' : 'Nuevo usuario'}</h3>
                    <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
                </div>
                <form onSubmit={handleSubmit} style={modalStyles.body}>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Nombre completo *</label>
                        <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} style={modalStyles.input} required />
                    </div>
                    {!user && (
                        <div style={modalStyles.field}>
                            <label style={modalStyles.label}>Usuario *</label>
                            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} style={modalStyles.input} required />
                        </div>
                    )}
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Rol *</label>
                        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))} style={modalStyles.input}>
                            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                    {!user && (
                        <>
                            <div style={modalStyles.field}>
                                <label style={modalStyles.label}>Contraseña *</label>
                                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={modalStyles.input} required />
                            </div>
                            <div style={modalStyles.field}>
                                <label style={modalStyles.label}>Confirmar contraseña *</label>
                                <input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} style={modalStyles.input} required />
                            </div>
                        </>
                    )}
                    <button type="submit" disabled={saving} style={{ ...modalStyles.btnPrimary, opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Guardando...' : (user ? 'Actualizar' : 'Crear usuario')}
                    </button>
                </form>
            </div>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    btnPrimary: {
        background: '#0f172a', color: '#fff', border: 'none',
        borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
    },
    btnSecondary: {
        display: 'flex', alignItems: 'center', gap: 6,
        background: '#fff', color: '#334155', border: '1px solid #cbd5e1',
        borderRadius: 8, padding: '10px 14px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
    },
    userRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14,
    },
    avatar: {
        width: 40, height: 40, borderRadius: 10, background: '#0f172a', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 700,
    },
    btnAction: {
        border: 'none', borderRadius: 6, padding: '6px 14px',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
    },
}

const modalStyles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    },
    modal: {
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
    },
    title: { margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' },
    closeBtn: {
        background: 'none', border: 'none', fontSize: 24, color: '#94a3b8',
        cursor: 'pointer', width: 32, height: 32,
    },
    body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
    field: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { fontSize: 12, fontWeight: 600, color: '#334155', textTransform: 'uppercase' },
    input: {
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '10px 12px', fontSize: 14, outline: 'none',
    },
    btnPrimary: {
        background: '#0f172a', color: '#fff', border: 'none',
        borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
    },
}
