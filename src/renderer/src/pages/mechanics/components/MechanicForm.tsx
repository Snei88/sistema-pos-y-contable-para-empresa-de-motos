// src/renderer/src/pages/mechanics/components/MechanicForm.tsx
import { useState, useEffect } from 'react'
import type { Mechanic } from '../../../../../shared/types/index'

interface Props {
    mechanic: Mechanic | null
    onSave: (data: any) => Promise<void>
    onClose: () => void
}

export default function MechanicForm({ mechanic, onSave, onClose }: Props) {
    const [form, setForm] = useState({
        name: '',
        document: '',
        phone: '',
        specialty: '',
        patioFee: 0,
        isActive: true,
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (mechanic) {
            setForm({
                name: mechanic.name,
                document: mechanic.document || '',
                phone: mechanic.phone || '',
                specialty: mechanic.specialty || '',
                patioFee: mechanic.patioFee,
                isActive: mechanic.isActive,
            })
        }
    }, [mechanic])

    function validate(): boolean {
        const e: Record<string, string> = {}
        if (!form.name.trim()) e.name = 'Nombre requerido'
        if (form.patioFee < 0) e.patioFee = 'No puede ser negativo'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        if (!validate()) return
        setSaving(true)
        await onSave(form)
        setSaving(false)
    }

    const update = (field: string, value: any) => {
        setForm(f => ({ ...f, [field]: value }))
        if (errors[field]) setErrors(err => { const n = { ...err }; delete n[field]; return n })
    }

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={styles.title}>{mechanic ? 'Editar mecánico' : 'Nuevo mecánico'}</h3>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.field}>
                        <label style={styles.label}>Nombre completo *</label>
                        <input
                            value={form.name}
                            onChange={e => update('name', e.target.value)}
                            style={{ ...styles.input, borderColor: errors.name ? '#ef4444' : '#e2e8f0' }}
                        />
                        {errors.name && <span style={styles.error}>{errors.name}</span>}
                    </div>

                    <div style={styles.grid2}>
                        <div style={styles.field}>
                            <label style={styles.label}>Documento</label>
                            <input
                                value={form.document}
                                onChange={e => update('document', e.target.value)}
                                placeholder="Cédula"
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Teléfono</label>
                            <input
                                value={form.phone}
                                onChange={e => update('phone', e.target.value)}
                                placeholder="300 123 4567"
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <div style={styles.grid2}>
                        <div style={styles.field}>
                            <label style={styles.label}>Especialidad</label>
                            <input
                                value={form.specialty}
                                onChange={e => update('specialty', e.target.value)}
                                placeholder="Ej: Motores, Eléctrico"
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Pago de patio diario ($)</label>
                            <input
                                type="number"
                                value={form.patioFee}
                                onChange={e => update('patioFee', parseFloat(e.target.value) || 0)}
                                style={{ ...styles.input, borderColor: errors.patioFee ? '#ef4444' : '#e2e8f0' }}
                            />
                            {errors.patioFee && <span style={styles.error}>{errors.patioFee}</span>}
                        </div>
                    </div>

                    {mechanic && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#475569' }}>
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={e => update('isActive', e.target.checked)}
                                style={{ accentColor: '#10b981' }}
                            />
                            Mecánico activo
                        </label>
                    )}

                    <div style={styles.actions}>
                        <button type="button" onClick={onClose} style={styles.btnSecondary}>Cancelar</button>
                        <button type="submit" disabled={saving} style={styles.btnPrimary}>
                            {saving ? 'Guardando...' : (mechanic ? 'Guardar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
    },
    modal: {
        background: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 460,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: '1px solid #f1f5f9',
    },
    title: {
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
        color: '#0f172a',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: 24,
        color: '#94a3b8',
        cursor: 'pointer',
        width: 32,
        height: 32,
    },
    form: {
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    grid2: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: 600,
        color: '#334155',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
    },
    input: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 14,
        color: '#0f172a',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    },
    error: {
        fontSize: 12,
        color: '#ef4444',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
        paddingTop: 16,
        borderTop: '1px solid #f1f5f9',
    },
    btnSecondary: {
        background: '#f1f5f9',
        color: '#475569',
        border: 'none',
        borderRadius: 8,
        padding: '10px 20px',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
    },
    btnPrimary: {
        background: '#10b981',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '10px 20px',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
}
