// src/renderer/src/pages/settings/components/CompanyTab.tsx
import { useState, useEffect } from 'react'

export default function CompanyTab() {
    const [settings, setSettings] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        setLoading(true)
        const res = await (window.api as any).getSettings?.()
        if (res?.success) {
            setSettings(res.data)
        }
        setLoading(false)
    }

    function update(key: string, value: string) {
        setSettings(s => ({ ...s, [key]: value }))
        setSaved(false)
    }

    async function handleSave() {
        setSaving(true)
        const res = await (window.api as any).updateSettings?.(settings)
        setSaving(false)
        if (res?.success) {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } else {
            alert(res?.error || 'Error al guardar')
        }
    }

    const fields = [
        { key: 'empresa_nombre', label: 'Nombre de la empresa', placeholder: 'Manuel Motos' },
        { key: 'empresa_nit', label: 'NIT', placeholder: '900.XXX.XXX-X' },
        { key: 'empresa_direccion', label: 'Dirección', placeholder: 'Calle 123 # 45-67' },
        { key: 'empresa_telefono', label: 'Teléfono', placeholder: '300 123 4567' },
        { key: 'empresa_ciudad', label: 'Ciudad', placeholder: 'Bogotá, Colombia' },
        { key: 'empresa_email', label: 'Correo electrónico', placeholder: 'contacto@manuelmotos.com' },
        { key: 'empresa_encargado', label: 'Encargado / responsable', placeholder: 'Nombre del encargado' },
    ]

    if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Cargando...</div>

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>🏢 Datos de la empresa</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Estos datos aparecerán en facturas y documentos impresos</p>

            {fields.map(f => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={styles.label}>{f.label}</label>
                    <input
                        value={settings[f.key] || ''}
                        onChange={e => update(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        style={styles.input}
                    />
                </div>
            ))}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ ...styles.btnPrimary, opacity: saving ? 0.6 : 1 }}
                >
                    {saving ? 'Guardando...' : '💾 Guardar cambios'}
                </button>
                {saved && (
                    <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>✓ Guardado correctamente</span>
                )}
            </div>
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
