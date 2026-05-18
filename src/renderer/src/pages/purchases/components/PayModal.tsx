// src/renderer/src/pages/purchases/components/PayModal.tsx
import { useState } from 'react'
import type { Purchase } from '../../../../../shared/types/index'

const METHODS = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'tarjeta', label: 'Tarjeta' },
]

interface Props {
    purchase: Purchase
    onPay: (data: { id: number; amount: number; method: string; reference?: string }) => Promise<void>
    onClose: () => void
}

export default function PayModal({ purchase, onPay, onClose }: Props) {
    const [amount, setAmount] = useState(String(purchase.total - purchase.paid))
    const [method, setMethod] = useState('efectivo')
    const [reference, setReference] = useState('')
    const [loading, setLoading] = useState(false)

    const remaining = purchase.total - purchase.paid

    async function handleSubmit(): Promise<void> {
        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            alert('Ingresa un monto válido')
            return
        }
        if (numAmount > remaining) {
            alert(`El pago no puede exceder el saldo pendiente ($${remaining.toLocaleString('es-CO')})`)
            return
        }

        setLoading(true)
        await onPay({
            id: purchase.id,
            amount: numAmount,
            method,
            reference: reference || undefined,
        })
        setLoading(false)
    }

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={styles.title}>💵 Registrar pago</h3>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <div style={styles.body}>
                    <div style={styles.info}>
                        <p><strong>Factura:</strong> {purchase.invoiceNumber || '—'}</p>
                        <p><strong>Total:</strong> ${purchase.total.toLocaleString('es-CO')}</p>
                        <p><strong>Pagado:</strong> ${purchase.paid.toLocaleString('es-CO')}</p>
                        <p><strong style={{ color: '#ef4444' }}>Pendiente:</strong> ${remaining.toLocaleString('es-CO')}</p>
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Monto a pagar *</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            autoFocus
                            style={{ ...styles.input, fontSize: 20, fontWeight: 700, textAlign: 'center' }}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Método</label>
                        <select value={method} onChange={e => setMethod(e.target.value)} style={styles.select}>
                            {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>

                    {(method === 'transferencia' || method === 'tarjeta') && (
                        <div style={styles.field}>
                            <label style={styles.label}>Referencia</label>
                            <input
                                value={reference}
                                onChange={e => setReference(e.target.value)}
                                placeholder="Número de referencia"
                                style={styles.input}
                            />
                        </div>
                    )}

                    <div style={styles.actions}>
                        <button onClick={onClose} style={styles.btnSecondary}>Cancelar</button>
                        <button onClick={handleSubmit} disabled={loading} style={styles.btnPrimary}>
                            {loading ? 'Procesando...' : 'Registrar pago'}
                        </button>
                    </div>
                </div>
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
        maxWidth: 420,
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
    body: {
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    info: {
        background: '#f8fafc',
        borderRadius: 10,
        padding: 16,
        fontSize: 14,
        color: '#475569',
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
    },
    input: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 14,
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    },
    select: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 14,
        outline: 'none',
        width: '100%',
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
