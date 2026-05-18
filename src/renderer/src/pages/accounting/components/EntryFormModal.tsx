// src/renderer/src/pages/accounting/components/EntryFormModal.tsx
import { useState, useEffect } from 'react'
import type { AccountingAccount } from '../../../../../shared/types/index'

interface Props {
    onClose: () => void
    onSuccess: () => void
}

interface Line {
    accountCode: string
    debit: string
    credit: string
    description: string
}

export default function EntryFormModal({ onClose, onSuccess }: Props) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [description, setDescription] = useState('')
    const [lines, setLines] = useState<Line[]>([
        { accountCode: '', debit: '', credit: '', description: '' },
        { accountCode: '', debit: '', credit: '', description: '' },
    ])
    const [accounts, setAccounts] = useState<AccountingAccount[]>([])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadAccounts()
    }, [])

    async function loadAccounts() {
        const res = await (window.api as any).getAccounts?.()
        if (res?.success) {
            setAccounts(res.data.filter((a: AccountingAccount) => a.allowsMovement))
        }
    }

    function addLine() {
        setLines([...lines, { accountCode: '', debit: '', credit: '', description: '' }])
    }

    function removeLine(idx: number) {
        setLines(lines.filter((_, i) => i !== idx))
    }

    function updateLine(idx: number, field: keyof Line, value: string) {
        const newLines = [...lines]
        newLines[idx] = { ...newLines[idx], [field]: value }
        setLines(newLines)
    }

    const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0)
    const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0)
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        if (!isBalanced) {
            alert('El asiento debe estar cuadrado y mayor a cero')
            return
        }
        if (!description.trim()) {
            alert('Descripción requerida')
            return
        }

        setSaving(true)
        const res = await (window.api as any).createEntry?.({
            date,
            description,
            lines: lines
                .filter(l => l.accountCode && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0))
                .map(l => ({
                    accountCode: l.accountCode,
                    debit: parseFloat(l.debit) || 0,
                    credit: parseFloat(l.credit) || 0,
                    description: l.description || undefined,
                })),
        })
        setSaving(false)

        if (res?.success) {
            onSuccess()
            onClose()
        } else {
            alert(res?.error || 'Error al crear asiento')
        }
    }

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={styles.title}>📝 Nuevo asiento contable</h3>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <form onSubmit={handleSubmit} style={styles.body}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label style={styles.label}>Fecha *</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={styles.input} required />
                        </div>
                    </div>

                    <div>
                        <label style={styles.label}>Descripción *</label>
                        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Concepto del asiento..." style={styles.input} required />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <label style={styles.label}>Líneas del asiento</label>
                            <button type="button" onClick={addLine} style={styles.btnSmall}>+ Línea</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {lines.map((line, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <select
                                        value={line.accountCode}
                                        onChange={e => updateLine(idx, 'accountCode', e.target.value)}
                                        style={{ ...styles.input, flex: 2, fontSize: 12 }}
                                        required
                                    >
                                        <option value="">Seleccionar cuenta...</option>
                                        {accounts.map(a => (
                                            <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Débito"
                                        value={line.debit}
                                        onChange={e => updateLine(idx, 'debit', e.target.value)}
                                        style={{ ...styles.input, flex: 1, fontSize: 12 }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Crédito"
                                        value={line.credit}
                                        onChange={e => updateLine(idx, 'credit', e.target.value)}
                                        style={{ ...styles.input, flex: 1, fontSize: 12 }}
                                    />
                                    <input
                                        placeholder="Nota"
                                        value={line.description}
                                        onChange={e => updateLine(idx, 'description', e.target.value)}
                                        style={{ ...styles.input, flex: 1, fontSize: 12 }}
                                    />
                                    {lines.length > 2 && (
                                        <button type="button" onClick={() => removeLine(idx)} style={styles.btnRemove}>×</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: 16, borderRadius: 10,
                        background: isBalanced ? '#f0fdf4' : '#fef2f2',
                        border: `2px solid ${isBalanced ? '#bbf7d0' : '#fecaca'}`,
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isBalanced ? '#16a34a' : '#dc2626' }}>
                            {isBalanced ? '✓ Asiento cuadrado' : `⚠ Descuadre: ${Math.abs(totalDebit - totalCredit).toLocaleString('es-CO')}`}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                            D: ${totalDebit.toLocaleString('es-CO')} | C: ${totalCredit.toLocaleString('es-CO')}
                        </div>
                    </div>

                    <button type="submit" disabled={saving || !isBalanced} style={{
                        ...styles.btnPrimary,
                        opacity: saving || !isBalanced ? 0.5 : 1,
                    }}>
                        {saving ? 'Guardando...' : 'Crear asiento'}
                    </button>
                </form>
            </div>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)',
    },
    modal: {
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 720,
        maxHeight: '90vh', overflow: 'auto',
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
    label: { fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', marginBottom: 4, display: 'block' },
    input: {
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '8px 10px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
    },
    btnSmall: {
        background: '#f1f5f9', color: '#475569', border: 'none',
        borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    },
    btnRemove: {
        background: '#fef2f2', color: '#dc2626', border: 'none',
        borderRadius: 6, width: 28, height: 28, fontSize: 16, cursor: 'pointer',
    },
    btnPrimary: {
        background: '#0f172a', color: '#fff', border: 'none',
        borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
    },
}
