// src/renderer/src/pages/workshop/components/MotoForm.tsx
import { useState } from 'react'

interface Props {
    onSave: (data: any) => Promise<void>
    onClose: () => void
}

export default function MotoForm({ onSave, onClose }: Props) {
    const [plate, setPlate] = useState('')
    const [brand, setBrand] = useState('')
    const [model, setModel] = useState('')
    const [year, setYear] = useState('')
    const [color, setColor] = useState('')
    const [engineNumber, setEngineNumber] = useState('')
    const [chassisNumber, setChassisNumber] = useState('')
    const [notes, setNotes] = useState('')
    const [clientSearch, setClientSearch] = useState('')
    const [clientResults, setClientResults] = useState<any[]>([])
    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    async function searchClients(query: string) {
        if (query.length < 2) { setClientResults([]); return }
        const res = await window.api.searchClients(query)
        if (res.success && res.data) setClientResults(res.data)
    }

    function selectClient(client: any): void {
        setSelectedClient(client)
        setClientSearch('')
        setClientResults([])
    }

    function validate(): boolean {
        const e: Record<string, string> = {}
        if (!plate.trim()) e.plate = 'Placa requerida'
        if (!brand.trim()) e.brand = 'Marca requerida'
        if (!model.trim()) e.model = 'Modelo requerido'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        if (!validate()) return

        setSaving(true)
        await onSave({
            plate: plate.trim().toUpperCase(),
            brand: brand.trim(),
            model: model.trim(),
            year: year ? parseInt(year) : undefined,
            color: color.trim() || undefined,
            engineNumber: engineNumber.trim() || undefined,
            chassisNumber: chassisNumber.trim() || undefined,
            notes: notes.trim() || undefined,
            clientId: selectedClient?.id,
        })
        setSaving(false)
    }

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={styles.title}>Registrar moto</h3>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Cliente */}
                    <div style={styles.field}>
                        <label style={styles.label}>Propietario (opcional)</label>
                        {!selectedClient ? (
                            <div style={{ position: 'relative' }}>
                                <input
                                    value={clientSearch}
                                    onChange={e => { setClientSearch(e.target.value); searchClients(e.target.value) }}
                                    placeholder="Buscar cliente..."
                                    style={styles.input}
                                />
                                {clientResults.length > 0 && (
                                    <div style={styles.dropdown}>
                                        {clientResults.map(c => (
                                            <div key={c.id} onClick={() => selectClient(c)} style={styles.resultItem}>
                                                <span style={{ fontWeight: 500 }}>{c.name}</span>
                                                <span style={{ color: '#64748b', fontSize: 12 }}>{c.document || c.phone || ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={styles.selectedClient}>
                                <span style={{ fontWeight: 600 }}>{selectedClient.name}</span>
                                <button type="button" onClick={() => setSelectedClient(null)} style={styles.changeBtn}>Cambiar</button>
                            </div>
                        )}
                    </div>

                    <div style={styles.grid2}>
                        <div style={styles.field}>
                            <label style={styles.label}>Placa *</label>
                            <input
                                value={plate}
                                onChange={e => setPlate(e.target.value)}
                                placeholder="ABC123"
                                style={{ ...styles.input, textTransform: 'uppercase', borderColor: errors.plate ? '#ef4444' : '#e2e8f0' }}
                            />
                            {errors.plate && <span style={styles.error}>{errors.plate}</span>}
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Año</label>
                            <input
                                type="number"
                                value={year}
                                onChange={e => setYear(e.target.value)}
                                placeholder="2020"
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <div style={styles.grid2}>
                        <div style={styles.field}>
                            <label style={styles.label}>Marca *</label>
                            <input
                                value={brand}
                                onChange={e => setBrand(e.target.value)}
                                placeholder="Honda, Yamaha, etc."
                                style={{ ...styles.input, borderColor: errors.brand ? '#ef4444' : '#e2e8f0' }}
                            />
                            {errors.brand && <span style={styles.error}>{errors.brand}</span>}
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Modelo *</label>
                            <input
                                value={model}
                                onChange={e => setModel(e.target.value)}
                                placeholder="CB190, NMAX, etc."
                                style={{ ...styles.input, borderColor: errors.model ? '#ef4444' : '#e2e8f0' }}
                            />
                            {errors.model && <span style={styles.error}>{errors.model}</span>}
                        </div>
                    </div>

                    <div style={styles.grid2}>
                        <div style={styles.field}>
                            <label style={styles.label}>Color</label>
                            <input
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                placeholder="Rojo, Negro, etc."
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>N° Motor</label>
                            <input
                                value={engineNumber}
                                onChange={e => setEngineNumber(e.target.value)}
                                placeholder="Opcional"
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>N° Chasis</label>
                        <input
                            value={chassisNumber}
                            onChange={e => setChassisNumber(e.target.value)}
                            placeholder="Opcional"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Notas</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Observaciones sobre la moto..."
                            rows={2}
                            style={{ ...styles.input, resize: 'vertical' }}
                        />
                    </div>

                    <div style={styles.actions}>
                        <button type="button" onClick={onClose} style={styles.btnSecondary}>Cancelar</button>
                        <button type="submit" disabled={saving} style={styles.btnPrimary}>
                            {saving ? 'Guardando...' : 'Registrar moto'}
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
        maxWidth: 480,
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
    dropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        maxHeight: 200,
        overflow: 'auto',
        zIndex: 100,
        marginTop: 4,
    },
    resultItem: {
        padding: '10px 12px',
        cursor: 'pointer',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
    },
    selectedClient: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: '#ecfdf5',
        borderRadius: 8,
        border: '1px solid #a7f3d0',
    },
    changeBtn: {
        marginLeft: 'auto',
        background: 'none',
        border: 'none',
        color: '#3b82f6',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 500,
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
