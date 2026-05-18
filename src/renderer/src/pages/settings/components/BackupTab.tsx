// src/renderer/src/pages/settings/components/BackupTab.tsx
import { useState, useEffect, useCallback } from 'react'

interface BackupRow {
    fileName: string
    filePath: string
    createdAt: string
    size: number
    type: string
}

export default function BackupTab() {
    const [backups, setBackups] = useState<BackupRow[]>([])
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)
    const [restoring, setRestoring] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        const res = await window.api.listBackups()
        if (res.success && res.data) {
            setBackups(res.data)
        }
        setLoading(false)
    }, [])

    useEffect(() => { load() }, [load])

    async function handleCreate() {
        setCreating(true)
        setSuccessMsg('')
        const res = await window.api.createBackup()
        setCreating(false)
        if (res.success) {
            setSuccessMsg('Backup creado exitosamente')
            setTimeout(() => setSuccessMsg(''), 4000)
            load()
        } else {
            setSuccessMsg('Error: ' + (res.error || 'No se pudo crear el backup'))
            setTimeout(() => setSuccessMsg(''), 5000)
        }
    }

    async function handleRestore(filePath: string) {
        const confirmed = await window.appConfirm?.(
            'Esto reemplazará la base de datos actual.\n\n¿Está seguro de restaurar este backup?',
            {
                title: 'Restaurar backup',
                confirmText: 'Restaurar',
                variant: 'warning',
            },
        )
        if (!confirmed) return
        setRestoring(true)
        const res = await window.api.restoreBackup(filePath)
        setRestoring(false)
        if (res.success) {
            alert('Backup restaurado. Reinicie la aplicación para aplicar los cambios.')
        } else {
            alert(res.error || 'Error al restaurar')
        }
    }

    function formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    function formatDate(d: string): string {
        return new Date(d).toLocaleString('es-CO')
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>💾 Copias de seguridad</h3>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                    onClick={handleCreate}
                    disabled={creating}
                    style={{ ...styles.btnPrimary, opacity: creating ? 0.6 : 1 }}
                >
                    {creating ? 'Creando...' : '⬇️ Crear backup ahora'}
                </button>
                <button onClick={load} style={styles.btnSecondary}>🔄 Actualizar lista</button>
                {successMsg && (
                    <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: successMsg.startsWith('Error') ? '#dc2626' : '#16a34a',
                    }}>
                        {successMsg.startsWith('Error') ? '✗' : '✓'} {successMsg}
                    </span>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Cargando...</div>
            ) : backups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💾</div>
                    <p>No hay backups registrados</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {backups.map(b => (
                        <div key={b.filePath} style={styles.backupRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ fontSize: 24 }}>📦</div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{b.fileName}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                        {formatDate(b.createdAt)} • {formatSize(b.size)} • {b.type === 'auto' ? 'Automático' : 'Manual'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRestore(b.filePath)}
                                disabled={restoring}
                                style={{ ...styles.btnRestore, opacity: restoring ? 0.6 : 1 }}
                            >
                                Restaurar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    btnPrimary: {
        background: '#10b981', color: '#fff', border: 'none',
        borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
    },
    btnSecondary: {
        background: '#f1f5f9', color: '#475569', border: 'none',
        borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
    },
    backupRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14,
    },
    btnRestore: {
        background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
        borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    },
}
