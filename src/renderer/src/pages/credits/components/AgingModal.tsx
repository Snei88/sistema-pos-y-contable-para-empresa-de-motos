// src/renderer/src/pages/credits/components/AgingModal.tsx
import { useState, useEffect } from 'react'

interface AgingData {
    totalPortfolio: number
    buckets: { label: string; count: number; amount: number; color: string }[]
    clients: { clientId: number; clientName: string; total: number; oldestDue: string }[]
}

interface Props {
    onClose: () => void
}

export default function AgingModal({ onClose }: Props) {
    const [data, setData] = useState<AgingData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAging()
    }, [])

    async function loadAging() {
        setLoading(true)
        const res = await window.api.creditsAging()
        if (res.success && res.data) {
            setData(res.data)
        }
        setLoading(false)
    }

    const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`
    const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CO')

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <div>
                        <h3 style={styles.title}>📊 Reporte Aging</h3>
                        <p style={styles.subtitle}>Análisis de cartera por antigüedad</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <div style={styles.body}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Cargando...</div>
                    ) : data ? (
                        <>
                            <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a' }}>
                                    {formatCurrency(data.totalPortfolio)}
                                </div>
                                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Cartera total pendiente</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {data.buckets.map(b => {
                                    const pct = data.totalPortfolio > 0 ? (b.amount / data.totalPortfolio) * 100 : 0
                                    return (
                                        <div key={b.label} style={styles.bucketRow}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>{b.label}</span>
                                                <span style={{ fontWeight: 700, fontSize: 13, color: b.color }}>
                                                    {b.count} • {formatCurrency(b.amount)}
                                                </span>
                                            </div>
                                            <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4 }}>
                                                <div style={{
                                                    width: `${Math.min(pct, 100)}%`,
                                                    height: '100%',
                                                    background: b.color,
                                                    borderRadius: 4,
                                                    transition: 'width 0.3s ease',
                                                }} />
                                            </div>
                                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
                                                {pct.toFixed(1)}%
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {data.clients.length > 0 && (
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: '0 0 12px' }}>
                                        Top deudores
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {data.clients.slice(0, 10).map(c => (
                                            <div key={c.clientId} style={styles.clientRow}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.clientName}</span>
                                                    <span style={{ fontWeight: 700, color: '#dc2626' }}>{formatCurrency(c.total)}</span>
                                                </div>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                                    Más antiguo: {formatDate(c.oldestDue)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Error al cargar reporte</div>
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
        maxWidth: 520,
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
    title: {
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
        color: '#0f172a',
    },
    subtitle: {
        margin: '4px 0 0',
        fontSize: 13,
        color: '#64748b',
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
        gap: 20,
    },
    bucketRow: {
        background: '#f8fafc',
        borderRadius: 10,
        padding: 14,
    },
    clientRow: {
        background: '#f8fafc',
        borderRadius: 8,
        padding: 12,
        border: '1px solid #e2e8f0',
    },
}
