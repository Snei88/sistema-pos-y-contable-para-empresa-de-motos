// src/renderer/src/pages/settings/components/SecurityTab.tsx
import { useState } from 'react'

export default function SecurityTab() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [changing, setChanging] = useState(false)
    const [changed, setChanged] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            alert('Las contraseñas no coinciden')
            return
        }
        if (newPassword.length < 6) {
            alert('La nueva contraseña debe tener al menos 6 caracteres')
            return
        }

        setChanging(true)
        const res = await window.api.changePassword({ oldPassword: currentPassword, newPassword })
        setChanging(false)

        if (res.success) {
            setChanged(true)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setChanged(false), 3000)
        } else {
            alert(res.error || 'Error al cambiar contraseña')
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>🔐 Cambiar contraseña</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Actualice su contraseña de acceso al sistema</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={styles.label}>Contraseña actual *</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={styles.label}>Nueva contraseña *</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={styles.label}>Confirmar nueva contraseña *</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button
                        type="submit"
                        disabled={changing}
                        style={{ ...styles.btnPrimary, opacity: changing ? 0.6 : 1 }}
                    >
                        {changing ? 'Cambiando...' : '🔐 Cambiar contraseña'}
                    </button>
                    {changed && (
                        <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>✓ Contraseña actualizada</span>
                    )}
                </div>
            </form>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    label: { fontSize: 12, fontWeight: 600, color: '#334155', textTransform: 'uppercase' },
    input: {
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '10px 12px', fontSize: 14, outline: 'none',
    },
    btnPrimary: {
        background: '#0f172a', color: '#fff', border: 'none',
        borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
    },
}
