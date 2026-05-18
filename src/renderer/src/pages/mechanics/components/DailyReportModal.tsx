// src/renderer/src/pages/mechanics/components/DailyReportModal.tsx
import { useState, useEffect } from 'react'
import type { Mechanic } from '../../../../../shared/types/index'

interface Props {
    mechanic: Mechanic
    date: string
    onClose: () => void
}

export default function DailyReportModal({ mechanic, date, onClose }: Props) {
    const [report, setReport] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [patioAmount, setPatioAmount] = useState(String(mechanic.patioFee))
    const [settleAmount, setSettleAmount] = useState('')
    const [notes, setNotes] = useState('')
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        loadReport()
    }, [mechanic.id, date])

    async function loadReport() {
        setLoading(true)
        const res = await window.api.mechanicsDaily({ mechanicId: mechanic.id, date })
        if (res.success && res.data) {
            setReport(res.data)
            setSettleAmount(String(res.data.netAmount))
        }
        setLoading(false)
    }

    async function handlePayPatio(): Promise<void> {
        setProcessing(true)
        const res = await (window.api as any).payPatio?.({
            mechanicId: mechanic.id,
            date,
            amount: parseFloat(patioAmount) || 0,
            notes: notes || undefined,
        })
        if (res?.success) loadReport()
        else alert(res?.error || 'Error al registrar pago de patio')
        setProcessing(false)
    }

    async function handleSettle(): Promise<void> {
        if (!report?.isPatioPaid) {
            alert('Debe pagar el patio antes de liquidar')
            return
        }
        setProcessing(true)
        const res = await window.api.settleMechanic({
            mechanicId: mechanic.id,
            date,
            amount: parseFloat(settleAmount) || 0,
            notes: notes || undefined,
        })
        if (res.success) loadReport()
        else alert(res.error || 'Error al liquidar')
        setProcessing(false)
    }

    const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <div>
                        <h3 style={styles.title}>📋 Reporte diario</h3>
                        <p style={styles.subtitle}>{mechanic.name} • {new Date(date).toLocaleDateString('es-CO')}</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <div style={styles.body}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Cargando...</div>
                    ) : report ? (
                        <>
                            {/* Resumen financiero */}
                            <div style={styles.summaryCard}>
                                <div style={styles.summaryGrid}>
                                    <div style={styles.summaryItem}>
                                        <div style={styles.summaryLabel}>Mano de obra</div>
                                        <div style={styles.summaryValue}>{formatCurrency(report.totalLabor)}</div>
                                    </div>
                                    <div style={styles.summaryItem}>
                                        <div style={styles.summaryLabel}>Repuestos</div>
                                        <div style={styles.summaryValue}>{formatCurrency(report.totalParts)}</div>
                                    </div>
                                    <div style={styles.summaryItem}>
                                        <div style={styles.summaryLabel}>Ventas asoc.</div>
                                        <div style={styles.summaryValue}>{formatCurrency(report.sales?.reduce((s: number, sale: any) => s + sale.total, 0) || 0)}</div>
                                    </div>
                                    <div style={{ ...styles.summaryItem, borderTop: '2px solid #10b981', paddingTop: 12 }}>
                                        <div style={styles.summaryLabel}>Total generado</div>
                                        <div style={{ ...styles.summaryValue, color: '#10b981', fontSize: 20 }}>
                                            {formatCurrency(report.totalGenerated)}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed #e2e8f0' }}>
                                    <div style={styles.calcRow}>
                                        <span>Pago de patio</span>
                                        <span style={{ color: '#ef4444' }}>-{formatCurrency(report.patioFee)}</span>
                                    </div>
                                    <div style={{ ...styles.calcRow, fontSize: 18, fontWeight: 700, marginTop: 8 }}>
                                        <span>Neto a pagar</span>
                                        <span style={{ color: '#0f172a' }}>{formatCurrency(report.netAmount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Estado */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{
                                    ...styles.statusBox,
                                    background: report.isPatioPaid ? '#d1fae5' : '#fef3c7',
                                    color: report.isPatioPaid ? '#065f46' : '#92400e',
                                }}>
                                    <div style={{ fontSize: 20, marginBottom: 4 }}>{report.isPatioPaid ? '✓' : '⏳'}</div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>Patio</div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                                        {report.isPatioPaid ? formatCurrency(report.patioPaidAmount) : 'Pendiente'}
                                    </div>
                                </div>
                                <div style={{
                                    ...styles.statusBox,
                                    background: report.isSettled ? '#d1fae5' : '#f1f5f9',
                                    color: report.isSettled ? '#065f46' : '#64748b',
                                }}>
                                    <div style={{ fontSize: 20, marginBottom: 4 }}>{report.isSettled ? '✓' : '⏳'}</div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>Liquidación</div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                                        {report.isSettled ? formatCurrency(report.settledAmount) : 'Pendiente'}
                                    </div>
                                </div>
                            </div>

                            {/* Trabajos del día */}
                            {report.workOrders?.length > 0 && (
                                <div style={styles.section}>
                                    <h4 style={styles.sectionTitle}>Trabajos realizados ({report.workOrders.length})</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {report.workOrders.map((wo: any) => (
                                            <div key={wo.id} style={styles.workItem}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{wo.orderNumber}</span>
                                                    <span style={{ fontSize: 13, color: '#64748b' }}>{wo.plate}</span>
                                                </div>
                                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{wo.description}</div>
                                                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12 }}>
                                                    <span style={{ color: '#3b82f6' }}>MO: {formatCurrency(wo.laborCost)}</span>
                                                    <span style={{ color: '#64748b' }}>Rep: {formatCurrency(wo.partsCost)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Acciones */}
                            {!report.isSettled && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {!report.isPatioPaid && (
                                        <div style={styles.actionBox}>
                                            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>💵 Pago de patio</h4>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <input
                                                    type="number"
                                                    value={patioAmount}
                                                    onChange={e => setPatioAmount(e.target.value)}
                                                    style={{ ...styles.input, width: 120 }}
                                                />
                                                <button
                                                    onClick={handlePayPatio}
                                                    disabled={processing}
                                                    style={{ ...styles.btn, background: '#f59e0b', color: '#fff' }}
                                                >
                                                    {processing ? '...' : 'Registrar pago'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {report.isPatioPaid && (
                                        <div style={styles.actionBox}>
                                            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>💰 Liquidar día</h4>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <input
                                                    type="number"
                                                    value={settleAmount}
                                                    onChange={e => setSettleAmount(e.target.value)}
                                                    placeholder={String(report.netAmount)}
                                                    style={{ ...styles.input, width: 120 }}
                                                />
                                                <button
                                                    onClick={handleSettle}
                                                    disabled={processing}
                                                    style={{ ...styles.btn, background: '#10b981', color: '#fff' }}
                                                >
                                                    {processing ? '...' : 'Liquidar'}
                                                </button>
                                            </div>
                                            <input
                                                value={notes}
                                                onChange={e => setNotes(e.target.value)}
                                                placeholder="Notas..."
                                                style={{ ...styles.input, marginTop: 8, fontSize: 12 }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {report.isSettled && (
                                <div style={{ textAlign: 'center', padding: 20, background: '#d1fae5', borderRadius: 10 }}>
                                    <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                                    <div style={{ fontWeight: 700, color: '#065f46' }}>Día liquidado</div>
                                    <div style={{ fontSize: 13, color: '#065f46' }}>
                                        {formatCurrency(report.settledAmount)} pagados
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                            Error al cargar reporte
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
        gap: 16,
    },
    summaryCard: {
        background: '#f8fafc',
        borderRadius: 12,
        padding: 20,
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
    },
    summaryItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: 600,
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 700,
        color: '#0f172a',
    },
    calcRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 14,
        color: '#475569',
    },
    statusBox: {
        flex: 1,
        borderRadius: 10,
        padding: 16,
        textAlign: 'center',
    },
    section: {
        borderTop: '1px solid #f1f5f9',
        paddingTop: 16,
    },
    sectionTitle: {
        margin: '0 0 12px',
        fontSize: 14,
        fontWeight: 700,
        color: '#334155',
        textTransform: 'uppercase',
    },
    workItem: {
        background: '#f8fafc',
        borderRadius: 8,
        padding: 12,
        border: '1px solid #e2e8f0',
    },
    actionBox: {
        background: '#f8fafc',
        borderRadius: 10,
        padding: 16,
        border: '1px solid #e2e8f0',
    },
    input: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 14,
        outline: 'none',
    },
    btn: {
        border: 'none',
        borderRadius: 8,
        padding: '8px 16px',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
    },
}
