// src/renderer/src/pages/credits/components/PayCreditModal.tsx
import { useState } from 'react'
import type { Credit } from '../../../../../shared/types/index'
import { PAYMENT_METHODS } from '../../../../../shared/constants/index'

interface Props {
    credit: Credit
    onClose: () => void
    onSuccess: () => void
}

export default function PayCreditModal({ credit, onClose, onSuccess }: Props) {
    const [amount, setAmount] = useState(String(credit.balance))
    const [method, setMethod] = useState('efectivo')
    const [reference, setReference] = useState('')
    const [notes, setNotes] = useState('')
    const [processing, setProcessing] = useState(false)

    const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        const val = parseFloat(amount)
        if (!val || val <= 0) {
            alert('Ingrese un monto válido')
            return
        }
        if (val > credit.balance) {
            alert(`El abono no puede exceder el saldo: ${formatCurrency(credit.balance)}`)
            return
        }

        setProcessing(true)
        const res = await window.api.payCredit({
            creditId: credit.id,
            amount: val,
            method,
            reference: reference || undefined,
            notes: notes || undefined,
        })
        setProcessing(false)

        if (res.success) {
            onSuccess()
            onClose()
        } else {
            alert(res.error || 'Error al registrar abono')
        }
    }

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <div>
                        <h3 style={styles.title}>💰 Registrar abono</h3>
                        <p style={styles.subtitle}>{credit.clientName} • Saldo: {formatCurrency(credit.balance)}</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <form onSubmit={handleSubmit} style={styles.body}>
                    <div style={styles.field}>
                        <label style={styles.label}>Monto a abonar *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            autoFocus
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Método de pago *</label>
                        <select value={method} onChange={e => setMethod(e.target.value)} style={styles.input}>
                            {PAYMENT_METHODS.filter(m => m.value !== 'credito').map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Referencia (opcional)</label>
                        <input
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            placeholder="N° consignación, últimos 4 dígitos tarjeta..."
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Notas (opcional)</label>
                        <input
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            style={styles.input}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        style={{
                            ...styles.btnPrimary,
                            opacity: processing ? 0.6 : 1,
                        }}
                    >
                        {processing ? 'Procesando...' : `Abonar ${formatCurrency(parseFloat(amount) || 0)}`}
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
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
    },
    title: { margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' },
    subtitle: { margin: '4px 0 0', fontSize: 13, color: '#64748b' },
    closeBtn: {
        background: 'none', border: 'none', fontSize: 24, color: '#94a3b8',
        cursor: 'pointer', width: 32, height: 32,
    },
    body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
    field: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { fontSize: 12, fontWeight: 600, color: '#334155', textTransform: 'uppercase' },
    input: {
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '10px 12px', fontSize: 14, color: '#0f172a', outline: 'none',
    },
    btnPrimary: {
        background: '#10b981', color: '#fff', border: 'none',
        borderRadius: 10, padding: '12px', fontWeight: 700,
        fontSize: 14, cursor: 'pointer', marginTop: 4,
    },
}
