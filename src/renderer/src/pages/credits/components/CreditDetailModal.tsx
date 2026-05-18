// src/renderer/src/pages/credits/components/CreditDetailModal.tsx
import { useState, useEffect } from 'react'
import type { Credit, CreditPayment } from '../../../../../shared/types/index'

interface Props {
    credit: Credit
    onClose: () => void
    onPay: (c: Credit) => void
}

export default function CreditDetailModal({ credit, onClose, onPay }: Props) {
    const [detail, setDetail] = useState<{ credit: Credit; payments: CreditPayment[] } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDetail()
    }, [credit.id])

    async function loadDetail() {
        setLoading(true)
        const res = await window.api.getCredit(credit.id)
        if (res.success && res.data) {
            setDetail(res.data)
        }
        setLoading(false)
    }

    const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`
    const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CO')

    const c = detail?.credit ?? credit

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <div>
                        <h3 style={styles.title}>💳 Detalle del crédito</h3>
                        <p style={styles.subtitle}>{c.clientName} • Factura {c.invoiceNumber}</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <div style={styles.body}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Cargando...</div>
                    ) : (
                        <>
                            {/* Resumen */}
                            <div style={styles.summaryCard}>
                                <div style={styles.summaryGrid}>
                                    <div>
                                        <div style={styles.summaryLabel}>Monto original</div>
                                        <div style={styles.summaryValue}>{formatCurrency(c.originalAmount)}</div>
                                    </div>
                                    <div>
                                        <div style={styles.summaryLabel}>Pagado</div>
                                        <div style={{ ...styles.summaryValue, color: '#10b981' }}>{formatCurrency(c.paidAmount)}</div>
                                    </div>
                                    <div>
                                        <div style={styles.summaryLabel}>Saldo</div>
                                        <div style={{ ...styles.summaryValue, color: c.status === 'vencido' ? '#dc2626' : '#0f172a' }}>
                                            {formatCurrency(c.balance)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 13, color: '#64748b' }}>Vencimiento: {formatDate(c.dueDate)}</span>
                                    <span style={{
                                        fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                                        background: c.status === 'vencido' ? '#fef2f2' : c.status === 'proximo' ? '#fffbeb' : '#f0fdf4',
                                        color: c.status === 'vencido' ? '#dc2626' : c.status === 'proximo' ? '#d97706' : '#16a34a',
                                    }}>
                                        {c.status === 'al_dia' ? 'Al día' : c.status === 'proximo' ? 'Por vencer' : 'Vencido'}
                                    </span>
                                </div>
                            </div>

                            {/* Historial de pagos */}
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: '0 0 12px', textTransform: 'uppercase' }}>
                                    Historial de pagos ({detail?.payments?.length ?? 0})
                                </h4>
                                {detail?.payments && detail.payments.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {detail.payments.map(p => (
                                            <div key={p.id} style={styles.paymentRow}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{formatDate(p.createdAt)}</span>
                                                    <span style={{ fontWeight: 700, color: '#10b981' }}>{formatCurrency(p.amount)}</span>
                                                </div>
                                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                                                    {p.method} {p.reference ? `• Ref: ${p.reference}` : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#94a3b8', fontSize: 13 }}>Sin pagos registrados</p>
                                )}
                            </div>

                            {c.balance > 0 && (
                                <button onClick={() => onPay(c)} style={styles.btnPay}>
                                    💰 Registrar abono
                                </button>
                            )}
                        </>
                    )}
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
        maxWidth: 480,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: '1px solid #f1f5f9',
    },
    title: { margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' },
    subtitle: { margin: '4px 0 0', fontSize: 13, color: '#64748b' },
    closeBtn: {
        background: 'none', border: 'none', fontSize: 24, color: '#94a3b8',
        cursor: 'pointer', width: 32, height: 32,
    },
    body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 },
    summaryCard: { background: '#f8fafc', borderRadius: 12, padding: 20 },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
    summaryLabel: { fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' },
    summaryValue: { fontSize: 16, fontWeight: 700, color: '#0f172a' },
    paymentRow: {
        background: '#f8fafc', borderRadius: 8, padding: 12,
        border: '1px solid #e2e8f0',
    },
    btnPay: {
        background: '#10b981', color: '#fff', border: 'none',
        borderRadius: 10, padding: '12px', fontWeight: 700,
        fontSize: 14, cursor: 'pointer', textAlign: 'center',
    },
}
