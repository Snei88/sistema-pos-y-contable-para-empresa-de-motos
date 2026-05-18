// src/renderer/src/pages/credits/CreditsPage.tsx
import { useState, useEffect, useCallback } from 'react'
import type { Credit } from '../../../../shared/types/index'
import CreditDetailModal from './components/CreditDetailModal'
import PayCreditModal from './components/PayCreditModal'
import AgingModal from './components/AgingModal'
import {
    IconCredits, IconSearch, IconAlertTriangle, IconDollarSign,
    IconEye, IconSpinner, IconChartBar,
} from '../../components/shared/Icons'

type Modal = 'none' | 'detail' | 'pay' | 'aging'

const STATUS_INFO: Record<string, { badge: string; label: string }> = {
    al_dia:  { badge: 'badge-green',  label: 'Al día' },
    proximo: { badge: 'badge-yellow', label: 'Por vencer' },
    vencido: { badge: 'badge-red',    label: 'Vencido' },
}

export default function CreditsPage() {
    const [credits, setCredits] = useState<Credit[]>([])
    const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
    const [modal, setModal] = useState<Modal>('none')
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [stats, setStats] = useState({ total: 0, vencido: 0, proximo: 0, count: 0 })

    const load = useCallback(async () => {
        setLoading(true)
        const res = await window.api.listCredits({ search: search || undefined, status: statusFilter || undefined, page, pageSize: 20 })
        if (res.success && res.data) { setCredits(res.data.data); setTotalPages(res.data.totalPages) }

        const all = await window.api.listCredits({ page: 1, pageSize: 1000 })
        if (all.success && all.data) {
            const data = all.data.data
            setStats({
                count: data.length,
                total: data.reduce((s: number, c: Credit) => s + c.balance, 0),
                vencido: data.filter((c: Credit) => c.status === 'vencido').reduce((s: number, c: Credit) => s + c.balance, 0),
                proximo: data.filter((c: Credit) => c.status === 'proximo').reduce((s: number, c: Credit) => s + c.balance, 0),
            })
        }
        setLoading(false)
    }, [search, statusFilter, page])

    useEffect(() => { load() }, [load])

    function openDetail(c: Credit): void { setSelectedCredit(c); setModal('detail') }
    function openPay(c: Credit): void { setSelectedCredit(c); setModal('pay') }
    function closeModal(): void { setModal('none'); setSelectedCredit(null) }
    const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease-out' }}>

            <div className="page-header">
                <div>
                    <h2 className="page-title">Cartera y Créditos</h2>
                    <p className="page-subtitle">{stats.count} cuenta{stats.count !== 1 ? 's' : ''} con saldo pendiente</p>
                </div>
                <button onClick={() => setModal('aging')} className="btn btn-secondary">
                    <IconChartBar size={15} />
                    Reporte Aging
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div className="stat-icon stat-icon-blue"><IconCredits size={18} /></div>
                        <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, margin: 0 }}>Cartera total</p>
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>{fmt(stats.total)}</p>
                </div>
                <div className="kpi-card" style={{ borderColor: '#fecaca' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div className="stat-icon stat-icon-red"><IconAlertTriangle size={18} /></div>
                        <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, margin: 0 }}>Vencido</p>
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', margin: 0, letterSpacing: '-0.03em' }}>{fmt(stats.vencido)}</p>
                </div>
                <div className="kpi-card" style={{ borderColor: '#fde68a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div className="stat-icon stat-icon-yellow"><IconAlertTriangle size={18} /></div>
                        <p style={{ fontSize: 12, color: '#d97706', fontWeight: 600, margin: 0 }}>Por vencer</p>
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#d97706', margin: 0, letterSpacing: '-0.03em' }}>{fmt(stats.proximo)}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="filters-bar">
                <div style={{ flex: 1, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}>
                        <IconSearch size={15} />
                    </span>
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar cliente o factura..." className="input" style={{ paddingLeft: 32 }} />
                </div>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="select" style={{ width: 170 }}>
                    <option value="">Todos los estados</option>
                    <option value="al_dia">Al día</option>
                    <option value="proximo">Por vencer</option>
                    <option value="vencido">Vencido</option>
                </select>
            </div>

            {/* Listado */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10, color: '#94a3b8' }}>
                    <IconSpinner size={20} /><span>Cargando créditos...</span>
                </div>
            ) : credits.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><IconCredits size={36} /></div>
                    <p className="empty-state-title">No hay créditos</p>
                    <p className="empty-state-text">Los créditos se crean desde el Punto de Venta</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {credits.map(c => {
                        const st = STATUS_INFO[c.status] ?? STATUS_INFO.al_dia
                        const isUrgent = c.status === 'vencido'
                        return (
                            <div key={c.id} className="card" style={{
                                padding: '14px 16px',
                                borderLeft: `3px solid ${isUrgent ? '#ef4444' : c.status === 'proximo' ? '#f59e0b' : '#16a34a'}`,
                                transition: 'box-shadow 0.15s',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                                        <div>
                                            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{c.clientName}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0', fontFamily: 'monospace' }}>
                                                {c.invoiceNumber} &nbsp;·&nbsp; Vence: {new Date(c.dueDate).toLocaleDateString('es-CO')}
                                            </p>
                                        </div>
                                        <span className={`badge ${st.badge}`}>{st.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
                                                {fmt(c.balance)}
                                            </p>
                                            <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>saldo pendiente</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => openDetail(c)} className="btn btn-secondary btn-sm">
                                                <IconEye size={13} />
                                                Ver
                                            </button>
                                            <button onClick={() => openPay(c)} className="btn btn-primary btn-sm">
                                                <IconDollarSign size={13} />
                                                Abonar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div className="pagination">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn">← Anterior</button>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Página {page} de {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="page-btn">Siguiente →</button>
                </div>
            )}

            {modal === 'detail' && selectedCredit && <CreditDetailModal credit={selectedCredit} onClose={closeModal} onPay={openPay} />}
            {modal === 'pay' && selectedCredit && <PayCreditModal credit={selectedCredit} onClose={closeModal} onSuccess={load} />}
            {modal === 'aging' && <AgingModal onClose={closeModal} />}
        </div>
    )
}

