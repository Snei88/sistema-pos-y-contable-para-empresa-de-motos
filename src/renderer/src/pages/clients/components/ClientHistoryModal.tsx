// src/renderer/src/pages/clients/components/ClientHistoryModal.tsx
import { useState, useEffect } from 'react'
import type { Client, Sale, WorkOrder, Credit } from '../../../../../shared/types/index'

interface Props {
    client: Client
    onClose: () => void
}

type Tab = 'ventas' | 'taller' | 'creditos'

export default function ClientHistoryModal({ client, onClose }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('ventas')
    const [history, setHistory] = useState<{ sales: Sale[]; workOrders: WorkOrder[]; credits: Credit[] } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadHistory()
    }, [client.id])

    async function loadHistory() {
        setLoading(true)
        // Nota: Necesitas agregar este método al preload o usar un workaround
        // Por ahora simulo la llamada - reemplaza con tu implementación real
        const res = await (window.api as any).getClientHistory?.(client.id)
            || { success: false, error: 'Método no disponible en preload' }

        if (res.success && res.data) {
            setHistory(res.data)
        }
        setLoading(false)
    }

    const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`
    const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

    const tabs: { key: Tab; label: string; count: number }[] = [
        { key: 'ventas', label: 'Ventas', count: history?.sales?.length ?? 0 },
        { key: 'taller', label: 'Taller', count: history?.workOrders?.length ?? 0 },
        { key: 'creditos', label: 'Créditos', count: history?.credits?.length ?? 0 },
    ]

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <div>
                        <h3 style={styles.title}>Historial del cliente</h3>
                        <p style={styles.subtitle}>{client.name} {client.document ? `• ${client.document}` : ''}</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                {loading ? (
                    <div style={styles.loadingBox}>
                        <div style={styles.spinner} />
                        <span style={{ color: '#64748b' }}>Cargando historial...</span>
                    </div>
                ) : !history ? (
                    <div style={styles.emptyState}>
                        <p style={{ color: '#94a3b8' }}>No se pudo cargar el historial</p>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div style={styles.tabs}>
                            {tabs.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setActiveTab(t.key)}
                                    style={{
                                        ...styles.tab,
                                        ...(activeTab === t.key ? styles.tabActive : {}),
                                    }}
                                >
                                    {t.label}
                                    <span style={{
                                        ...styles.tabBadge,
                                        background: activeTab === t.key ? '#10b981' : '#e2e8f0',
                                        color: activeTab === t.key ? '#fff' : '#64748b',
                                    }}>
                                        {t.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Contenido */}
                        <div style={styles.content}>
                            {activeTab === 'ventas' && (
                                history.sales.length === 0 ? (
                                    <div style={styles.emptyTab}>No hay ventas registradas</div>
                                ) : (
                                    <div style={styles.list}>
                                        {history.sales.map(s => (
                                            <div key={s.id} style={styles.listItem}>
                                                <div style={styles.itemMain}>
                                                    <span style={styles.itemTitle}>Factura {s.invoiceNumber}</span>
                                                    <span style={{
                                                        ...styles.statusBadge,
                                                        background: s.status === 'completada' ? '#d1fae5' : s.status === 'anulada' ? '#fee2e2' : '#fef3c7',
                                                        color: s.status === 'completada' ? '#065f46' : s.status === 'anulada' ? '#991b1b' : '#92400e',
                                                    }}>
                                                        {s.status}
                                                    </span>
                                                </div>
                                                <div style={styles.itemMeta}>
                                                    <span>{formatDate(s.createdAt)}</span>
                                                    <span style={styles.itemAmount}>{formatCurrency(s.total)}</span>
                                                </div>
                                                <div style={styles.itemMeta}>
                                                    <span style={{ color: '#94a3b8' }}>Pagado: {formatCurrency(s.paid)} • {s.paymentStatus}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {activeTab === 'taller' && (
                                history.workOrders.length === 0 ? (
                                    <div style={styles.emptyTab}>No hay órdenes de trabajo</div>
                                ) : (
                                    <div style={styles.list}>
                                        {history.workOrders.map(wo => (
                                            <div key={wo.id} style={styles.listItem}>
                                                <div style={styles.itemMain}>
                                                    <span style={styles.itemTitle}>OT {wo.orderNumber}</span>
                                                    <span style={{
                                                        ...styles.statusBadge,
                                                        background: wo.status === 'entregado' ? '#d1fae5' : wo.status === 'anulado' ? '#fee2e2' : '#dbeafe',
                                                        color: wo.status === 'entregado' ? '#065f46' : wo.status === 'anulado' ? '#991b1b' : '#1e40af',
                                                    }}>
                                                        {wo.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div style={styles.itemMeta}>
                                                    <span>{wo.plate} • {wo.brand} {wo.model}</span>
                                                    <span style={styles.itemAmount}>{formatCurrency(wo.total)}</span>
                                                </div>
                                                {wo.mechanicName && (
                                                    <div style={styles.itemMeta}>
                                                        <span style={{ color: '#94a3b8' }}>Mecánico: {wo.mechanicName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {activeTab === 'creditos' && (
                                history.credits.length === 0 ? (
                                    <div style={styles.emptyTab}>No hay créditos registrados</div>
                                ) : (
                                    <div style={styles.list}>
                                        {history.credits.map(c => (
                                            <div key={c.id} style={styles.listItem}>
                                                <div style={styles.itemMain}>
                                                    <span style={styles.itemTitle}>{c.invoiceNumber}</span>
                                                    <span style={{
                                                        ...styles.statusBadge,
                                                        background: c.status === 'al_dia' ? '#d1fae5' : c.status === 'vencido' ? '#fee2e2' : '#fef3c7',
                                                        color: c.status === 'al_dia' ? '#065f46' : c.status === 'vencido' ? '#991b1b' : '#92400e',
                                                    }}>
                                                        {c.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div style={styles.itemMeta}>
                                                    <span>Vence: {formatDate(c.dueDate)}</span>
                                                    <span style={styles.itemAmount}>{formatCurrency(c.balance)}</span>
                                                </div>
                                                <div style={styles.itemMeta}>
                                                    <span style={{ color: '#94a3b8' }}>
                                                        Original: {formatCurrency(c.originalAmount)} • Pagado: {formatCurrency(c.paidAmount)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </>
                )}
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
        maxWidth: 640,
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: '1px solid #f1f5f9',
        flexShrink: 0,
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
        padding: 0,
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    loadingBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        gap: 16,
    },
    spinner: {
        width: 32,
        height: 32,
        border: '3px solid #e2e8f0',
        borderTopColor: '#10b981',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    emptyState: {
        padding: 40,
        textAlign: 'center',
        color: '#94a3b8',
    },
    tabs: {
        display: 'flex',
        gap: 4,
        padding: '12px 24px 0',
        borderBottom: '1px solid #f1f5f9',
        flexShrink: 0,
    },
    tab: {
        background: 'none',
        border: 'none',
        padding: '10px 16px',
        fontSize: 14,
        fontWeight: 500,
        color: '#64748b',
        cursor: 'pointer',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
    },
    tabActive: {
        color: '#0f172a',
        fontWeight: 600,
    },
    tabBadge: {
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 10,
    },
    content: {
        overflow: 'auto',
        flex: 1,
        padding: '16px 24px',
    },
    emptyTab: {
        textAlign: 'center',
        padding: 40,
        color: '#94a3b8',
        fontSize: 14,
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    listItem: {
        padding: '14px 16px',
        background: '#f8fafc',
        borderRadius: 10,
        border: '1px solid #f1f5f9',
    },
    itemMain: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    itemTitle: {
        fontWeight: 600,
        fontSize: 14,
        color: '#0f172a',
    },
    statusBadge: {
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 20,
        textTransform: 'capitalize',
    },
    itemMeta: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
    },
    itemAmount: {
        fontWeight: 700,
        color: '#0f172a',
        fontSize: 14,
    },
}
