// src/renderer/src/pages/mechanics/components/SettlementsModal.tsx
import { useState, useEffect, useCallback } from 'react'
import type { Mechanic } from '../../../../../shared/types/index'

interface Props {
    mechanic: Mechanic
    onClose: () => void
}

interface SettlementRow {
    id: number
    mechanicId: number
    mechanicName: string
    date: string
    totalGenerated: number
    patioFee: number
    netAmount: number
    isPatioPaid: boolean
    patioPaidAmount: number
    isSettled: boolean
    settledAmount: number
    settledBy: string
    notes: string
    createdAt: string
}

export default function SettlementsModal({ mechanic, onClose }: Props) {
    const [settlements, setSettlements] = useState<SettlementRow[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        const res = await (window.api as any).listSettlements?.({
            mechanicId: mechanic.id,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            page,
            pageSize: 10,
        })
        if (res?.success && res.data) {
            setSettlements(res.data.data || [])
            setTotalPages(res.data.totalPages || 1)
        }
        setLoading(false)
    }, [mechanic.id, startDate, endDate, page])

    useEffect(() => { load() }, [load])

    const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`
    const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CO')

    const totalGenerated = settlements.reduce((s, r) => s + r.totalGenerated, 0)
    const totalSettled = settlements.reduce((s, r) => s + r.settledAmount, 0)
    const totalPatio = settlements.reduce((s, r) => s + r.patioPaidAmount, 0)

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <div>
                        <h3 style={styles.title}>📊 Historial de liquidaciones</h3>
                        <p style={styles.subtitle}>{mechanic.name}</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <div style={styles.body}>
                    {/* Filtros */}
                    <div style={styles.filters}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => { setStartDate(e.target.value); setPage(1) }}
                            style={styles.dateInput}
                            placeholder="Desde"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => { setEndDate(e.target.value); setPage(1) }}
                            style={styles.dateInput}
                            placeholder="Hasta"
                        />
                        <button onClick={load} style={styles.btnSecondary}>Filtrar</button>
                    </div>

                    {/* Resumen */}
                    <div style={styles.summaryBar}>
                        <div style={styles.summaryItem}>
                            <div style={styles.summaryValue}>{formatCurrency(totalGenerated)}</div>
                            <div style={styles.summaryLabel}>Total generado</div>
                        </div>
                        <div style={styles.summaryItem}>
                            <div style={{ ...styles.summaryValue, color: '#ef4444' }}>{formatCurrency(totalPatio)}</div>
                            <div style={styles.summaryLabel}>Patio pagado</div>
                        </div>
                        <div style={styles.summaryItem}>
                            <div style={{ ...styles.summaryValue, color: '#10b981' }}>{formatCurrency(totalSettled)}</div>
                            <div style={styles.summaryLabel}>Liquidado</div>
                        </div>
                    </div>

                    {/* Tabla */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Cargando...</div>
                    ) : settlements.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
                            <p style={{ color: '#94a3b8', margin: 0 }}>Sin liquidaciones registradas</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {settlements.map(s => (
                                <div key={s.id} style={styles.row}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                                                {formatDate(s.date)}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                                                {s.settledBy ? `Liquidado por ${s.settledBy}` : 'Sin liquidar'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, fontSize: 16, color: s.isSettled ? '#10b981' : '#f59e0b' }}>
                                                {s.isSettled ? formatCurrency(s.settledAmount) : 'Pendiente'}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                                Gen: {formatCurrency(s.totalGenerated)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: '#64748b' }}>
                                        <span>Patio: {formatCurrency(s.patioPaidAmount)}</span>
                                        <span>Neto: {formatCurrency(s.netAmount)}</span>
                                        {s.notes && <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{s.notes}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div style={styles.pagination}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ ...styles.pageBtn, opacity: page === 1 ? 0.4 : 1 }}
                            >
                                ←
                            </button>
                            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{ ...styles.pageBtn, opacity: page === totalPages ? 0.4 : 1 }}
                            >
                                →
                            </button>
                        </div>
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
        maxWidth: 600,
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
        position: 'sticky',
        top: 0,
        background: '#fff',
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
        gap: 16,
    },
    filters: {
        display: 'flex',
        gap: 10,
        alignItems: 'center',
    },
    dateInput: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 13,
        color: '#0f172a',
        outline: 'none',
    },
    btnSecondary: {
        background: '#f1f5f9',
        color: '#475569',
        border: 'none',
        borderRadius: 8,
        padding: '8px 16px',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
    },
    summaryBar: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        background: '#f8fafc',
        borderRadius: 12,
        padding: 16,
    },
    summaryItem: {
        textAlign: 'center',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 700,
        color: '#0f172a',
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: 600,
        color: '#94a3b8',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 40,
    },
    row: {
        background: '#f8fafc',
        borderRadius: 10,
        padding: 14,
        border: '1px solid #e2e8f0',
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        paddingTop: 8,
    },
    pageBtn: {
        background: '#f1f5f9',
        border: 'none',
        borderRadius: 8,
        width: 32,
        height: 32,
        fontSize: 16,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
}
