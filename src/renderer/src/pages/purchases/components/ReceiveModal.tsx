// src/renderer/src/pages/purchases/components/ReceiveModal.tsx
import type { Purchase } from '../../../../../shared/types/index'

interface Props {
    purchase: Purchase
    onReceive: (data: { id: number; notes?: string }) => Promise<void>
    onClose: () => void
}

export default function ReceiveModal({ purchase, onReceive, onClose }: Props) {
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(): Promise<void> {
        setLoading(true)
        await onReceive({ id: purchase.id, notes: notes || undefined })
        setLoading(false)
    }

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={styles.title}>📥 Recibir compra</h3>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <div style={styles.body}>
                    <div style={styles.info}>
                        <p><strong>Factura:</strong> {purchase.invoiceNumber || '—'}</p>
                        <p><strong>Proveedor:</strong> {purchase.supplierName}</p>
                        <p><strong>Total:</strong> ${purchase.total.toLocaleString('es-CO')}</p>
                    </div>

                    <div style={{ background: '#fef3c7', borderRadius: 8, padding: 12, fontSize: 13, color: '#92400e' }}>
                        ⚠️ Al recibir, se actualizará el inventario y se recalculará el costo promedio de cada producto.
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Notas de recepción</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Estado de la mercancía, observaciones..."
                            rows={3}
                            style={styles.textarea}
                        />
                    </div>

                    <div style={styles.actions}>
                        <button onClick={onClose} style={styles.btnSecondary}>Cancelar</button>
                        <button onClick={handleSubmit} disabled={loading} style={styles.btnPrimary}>
                            {loading ? 'Procesando...' : 'Confirmar recepción'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { useState } from 'react'

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
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
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
    textarea: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 14,
        resize: 'vertical',
        outline: 'none',
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
