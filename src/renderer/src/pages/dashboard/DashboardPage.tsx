// src/renderer/src/pages/dashboard/DashboardPage.tsx
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/auth.store'
import {
    IconTrendingUp, IconAlertTriangle, IconPackage,
    IconDollarSign, IconReceiptText, IconClients, IconWorkshop,
    IconPos, IconSpinner, IconChevronRight,
} from '../../components/shared/Icons'
import { useNavigate } from 'react-router-dom'

function fmt(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
    return `$${Math.round(n).toLocaleString('es-CO')}`
}

export default function DashboardPage() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const [kpis, setKpis] = useState<any>(null)
    const [alerts, setAlerts] = useState<any[]>([])
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [topMechanics, setTopMechanics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const [kpiRes, alertRes, topRes] = await Promise.all([
                    window.api.getDashboardKPIs(),
                    window.api.getDashboardAlerts(),
                    window.api.getDashboardTop(),
                ])
                if (kpiRes.success) setKpis(kpiRes.data)
                if (alertRes.success) setAlerts(alertRes.data ?? [])
                if (topRes.success) {
                    setTopProducts((topRes.data as any)?.topProducts ?? [])
                    setTopMechanics((topRes.data as any)?.topMechanics ?? [])
                }
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
    const monthName = new Date().toLocaleDateString('es-CO', { month: 'long' })

    const salesMTD: number = kpis?.salesMTD ?? 0
    const salesToday: number = kpis?.salesToday ?? 0
    const txMonth: number = kpis?.transactionsToday ?? 0  // ahora es del mes
    const txWeek: number = kpis?.unitsSoldToday ?? 0      // transacciones semana
    const avgTicket: number = kpis?.avgTicket ?? 0
    const grossMargin: number = kpis?.grossMargin ?? 0
    const lowStock: number = kpis?.lowStockCount ?? 0
    const outOfStock: number = kpis?.outOfStockCount ?? 0
    const activeWO: number = kpis?.activeWorkOrders ?? 0
    const overdueCredits: number = kpis?.overdueCredits ?? 0
    const pendingCredits: number = kpis?.pendingCredits ?? 0

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 10, color: '#94a3b8' }}>
                <IconSpinner size={20} />
                <span style={{ fontSize: 14 }}>Cargando dashboard...</span>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.25s ease-out' }}>

            {/* Bienvenida */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        {greeting}, {user?.fullName?.split(' ')[0]}
                    </h2>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>
                        {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button onClick={() => navigate('/pos')} className="btn btn-primary" style={{ gap: 7, height: 38 }}>
                    <IconPos size={16} /> Nueva venta
                </button>
            </div>

            {/* KPI principal — ventas del mes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

                {/* Ventas del mes */}
                <div className="kpi-card card-hover" style={{ cursor: 'pointer', gridColumn: '1' }} onClick={() => navigate('/pos')}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div className="stat-icon stat-icon-green"><IconDollarSign size={20} /></div>
                        <IconChevronRight size={14} style={{ color: '#cbd5e1', marginTop: 2 }} />
                    </div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {fmt(salesMTD)}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '5px 0 2px', fontWeight: 500 }}>
                        Ventas de {monthName}
                    </p>
                    {salesToday > 0 && (
                        <p style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                            + {fmt(salesToday)} hoy
                        </p>
                    )}
                </div>

                {/* Transacciones del mes */}
                <div className="kpi-card card-hover" style={{ cursor: 'pointer' }} onClick={() => navigate('/pos')}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div className="stat-icon stat-icon-blue"><IconReceiptText size={20} /></div>
                        <IconChevronRight size={14} style={{ color: '#cbd5e1', marginTop: 2 }} />
                    </div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {txMonth}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '5px 0 2px', fontWeight: 500 }}>
                        Ventas en {monthName}
                    </p>
                    {txWeek > 0 && (
                        <p style={{ fontSize: 11, color: '#64748b' }}>
                            {txWeek} esta semana
                        </p>
                    )}
                </div>

                {/* Ticket promedio + margen */}
                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div className="stat-icon stat-icon-purple"><IconTrendingUp size={20} /></div>
                    </div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {fmt(avgTicket)}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '5px 0 2px', fontWeight: 500 }}>
                        Ticket promedio
                    </p>
                    {grossMargin > 0 && (
                        <p style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                            Margen {grossMargin.toFixed(1)}%
                        </p>
                    )}
                </div>
            </div>

            {/* Segunda fila de KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>

                <div className={`kpi-card${lowStock + outOfStock > 0 ? ' card-hover' : ''}`}
                    style={{ cursor: lowStock + outOfStock > 0 ? 'pointer' : 'default' }}
                    onClick={() => (lowStock + outOfStock > 0) && navigate('/inventory')}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div className={`stat-icon ${outOfStock > 0 ? 'stat-icon-red' : lowStock > 0 ? 'stat-icon-yellow' : 'stat-icon-green'}`}>
                            <IconAlertTriangle size={20} />
                        </div>
                        {(lowStock + outOfStock > 0) && <IconChevronRight size={14} style={{ color: '#cbd5e1', marginTop: 2 }} />}
                    </div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: outOfStock > 0 ? '#dc2626' : lowStock > 0 ? '#d97706' : '#16a34a', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {lowStock + outOfStock}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '5px 0 2px', fontWeight: 500 }}>Stock bajo / agotado</p>
                    {outOfStock > 0 && <p style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{outOfStock} agotado{outOfStock !== 1 ? 's' : ''}</p>}
                </div>

                <div className={`kpi-card${activeWO > 0 ? ' card-hover' : ''}`}
                    style={{ cursor: activeWO > 0 ? 'pointer' : 'default' }}
                    onClick={() => activeWO > 0 && navigate('/workshop')}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div className="stat-icon stat-icon-blue"><IconWorkshop size={20} /></div>
                        {activeWO > 0 && <IconChevronRight size={14} style={{ color: '#cbd5e1', marginTop: 2 }} />}
                    </div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {activeWO}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '5px 0 2px', fontWeight: 500 }}>Órdenes activas</p>
                </div>

                <div className={`kpi-card${overdueCredits > 0 ? ' card-hover' : ''}`}
                    style={{ cursor: overdueCredits > 0 ? 'pointer' : 'default' }}
                    onClick={() => overdueCredits > 0 && navigate('/credits')}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div className={`stat-icon ${overdueCredits > 0 ? 'stat-icon-red' : 'stat-icon-green'}`}>
                            <IconClients size={20} />
                        </div>
                        {overdueCredits > 0 && <IconChevronRight size={14} style={{ color: '#cbd5e1', marginTop: 2 }} />}
                    </div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: overdueCredits > 0 ? '#dc2626' : '#0f172a', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {overdueCredits}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '5px 0 2px', fontWeight: 500 }}>Créditos vencidos</p>
                    {pendingCredits > 0 && (
                        <p style={{ fontSize: 11, color: '#64748b' }}>{fmt(pendingCredits)} pendiente</p>
                    )}
                </div>
            </div>

            {/* Contenido inferior */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

                {/* Top productos del mes */}
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Productos más vendidos</p>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Este mes</p>
                        </div>
                        <button onClick={() => navigate('/inventory')} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
                            Ver inventario
                        </button>
                    </div>
                    <div>
                        {topProducts.length === 0 ? (
                            <div className="empty-state" style={{ padding: '40px 20px' }}>
                                <div className="empty-state-icon"><IconPackage size={32} /></div>
                                <p className="empty-state-title">Sin ventas este mes</p>
                                <p className="empty-state-text">Las ventas aparecerán aquí</p>
                            </div>
                        ) : topProducts.slice(0, 6).map((p: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: i < Math.min(5, topProducts.length - 1) ? '1px solid #f8fafc' : 'none' }}>
                                <span style={{ width: 24, height: 24, borderRadius: 6, background: '#f0fdf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#16a34a', flexShrink: 0 }}>
                                    {i + 1}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.name}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{p.qty} uds</p>
                                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>{fmt(p.total)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Panel derecho */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Accesos rápidos */}
                    <div className="card" style={{ padding: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Accesos rápidos</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { label: 'Nueva venta', icon: <IconPos size={15} />, path: '/pos', color: '#16a34a' },
                                { label: 'Ver inventario', icon: <IconInventoryLocal size={15} />, path: '/inventory', color: '#3b82f6' },
                                { label: 'Caja del día', icon: <IconCashLocal size={15} />, path: '/cash', color: '#f59e0b' },
                                { label: 'Reportes', icon: <IconReportsLocal size={15} />, path: '/reports', color: '#8b5cf6' },
                            ].map(a => (
                                <button key={a.path} onClick={() => navigate(a.path)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', color: '#334155', fontSize: 13, fontWeight: 500 }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf6'; e.currentTarget.style.borderColor = '#bbf7d2' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' }}>
                                    <span style={{ color: a.color }}>{a.icon}</span>
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Top mecánicos del mes */}
                    {topMechanics.length > 0 && (
                        <div className="card" style={{ padding: 16 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Mecánicos del mes</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {topMechanics.map((m: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ width: 20, height: 20, borderRadius: 4, background: '#f0fdf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#16a34a', flexShrink: 0 }}>
                                            {i + 1}
                                        </span>
                                        <span style={{ flex: 1, fontSize: 12, color: '#334155', fontWeight: 500 }}>{m.name}</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: 0 }}>{fmt(m.total)}</p>
                                            <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{m.orders} OT</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Alertas */}
                    {alerts.length > 0 && (
                        <div className="card" style={{ padding: 16 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Alertas</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {alerts.slice(0, 4).map((a: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', gap: 9, padding: '8px 10px', borderRadius: 8, background: a.severity === 'error' ? '#fef2f2' : '#fffbeb', border: `1px solid ${a.severity === 'error' ? '#fecaca' : '#fde68a'}` }}>
                                        <IconAlertTriangle size={14} style={{ color: a.severity === 'error' ? '#dc2626' : '#d97706', flexShrink: 0, marginTop: 1 }} />
                                        <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{a.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function IconInventoryLocal({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
}
function IconCashLocal({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
}
function IconReportsLocal({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
}
