// src/renderer/src/pages/cash/CashPage.tsx
import { useState, useEffect, useCallback } from 'react'
import type { CashSession } from '../../../../shared/types/index'
import OpenCashModal from './components/OpenCashModal'
import CloseCashModal from './components/CloseCashModal'
import { IconCash, IconCheckCircle, IconXCircle, IconSpinner } from '../../components/shared/Icons'

export default function CashPage() {
    const [currentSession, setCurrentSession] = useState<CashSession | null>(null)
    const [history, setHistory] = useState<CashSession[]>([])
    const [historyTotal, setHistoryTotal] = useState(0)
    const [historyPage, setHistoryPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState<'none' | 'open' | 'close'>('none')

    const PAGE_SIZE = 15

    const loadCurrent = useCallback(async () => {
        const res = await window.api.currentCash()
        if (res.success) setCurrentSession(res.data ?? null)
    }, [])

    const loadHistory = useCallback(async () => {
        setLoading(true)
        const res = await window.api.cashHistory({ page: historyPage, pageSize: PAGE_SIZE })
        if (res.success && res.data) { setHistory(res.data.data); setHistoryTotal(res.data.total) }
        setLoading(false)
    }, [historyPage])

    useEffect(() => { loadCurrent(); loadHistory() }, [loadCurrent, loadHistory])

    function handleSessionOpened(): void { setModal('none'); loadCurrent(); loadHistory() }
    function handleSessionClosed(): void { setModal('none'); setCurrentSession(null); loadHistory() }

    const totalPages = Math.ceil(historyTotal / PAGE_SIZE)
    const isOpen = !!currentSession

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeIn 0.2s ease-out' }}>

            {/* Header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">Caja</h2>
                    <p className="page-subtitle">Control de apertura, cierre y arqueo</p>
                </div>
            </div>

            {/* Estado de caja */}
            <div style={{
                background: isOpen ? '#f0fdf6' : '#fef2f2',
                border: `1px solid ${isOpen ? '#bbf7d2' : '#fecaca'}`,
                borderRadius: 14,
                padding: 20,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: isOpen ? '#16a34a' : '#ef4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isOpen ? '0 4px 12px rgb(22 163 74 / 0.25)' : '0 4px 12px rgb(239 68 68 / 0.2)',
                        }}>
                            {isOpen
                                ? <IconCheckCircle size={26} style={{ color: '#fff' }} />
                                : <IconXCircle size={26} style={{ color: '#fff' }} />
                            }
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                                Caja {isOpen ? 'abierta' : 'cerrada'}
                            </h3>
                            {isOpen && currentSession ? (
                                <div style={{ display: 'flex', gap: 16, marginTop: 5 }}>
                                    <span style={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>
                                        Desde: {new Date(currentSession.openedAt).toLocaleString('es-CO')}
                                    </span>
                                    <span style={{ fontSize: 13, color: '#15803d' }}>
                                        Fondo: <strong>${currentSession.openingBalance.toLocaleString('es-CO')}</strong>
                                    </span>
                                </div>
                            ) : (
                                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#b91c1c', fontWeight: 500 }}>
                                    No hay sesión de caja activa
                                </p>
                            )}
                        </div>
                    </div>
                    {isOpen ? (
                        <button onClick={() => setModal('close')} className="btn btn-danger">
                            Cerrar caja
                        </button>
                    ) : (
                        <button onClick={() => setModal('open')} className="btn btn-primary">
                            <IconCash size={16} />
                            Abrir caja
                        </button>
                    )}
                </div>
            </div>

            {/* Resumen si hay caja abierta */}
            {isOpen && currentSession && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                        { label: 'Fondo inicial', value: `$${currentSession.openingBalance.toLocaleString('es-CO')}`, iconBg: 'stat-icon-green' },
                        { label: 'Responsable', value: currentSession.userName, iconBg: 'stat-icon-blue', isText: true },
                        { label: 'Hora apertura', value: new Date(currentSession.openedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), iconBg: 'stat-icon-purple', isText: true },
                    ].map((s, i) => (
                        <div key={i} className="kpi-card">
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{s.label}</p>
                            <p style={{ fontSize: s.isText ? 16 : 22, fontWeight: 800, color: '#0f172a', margin: '6px 0 0', letterSpacing: s.isText ? 0 : '-0.03em' }}>
                                {s.value}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Historial */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Historial de sesiones</p>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{historyTotal} registros</span>
                </div>
                <div className="card" style={{ overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10, color: '#94a3b8' }}>
                            <IconSpinner size={20} />
                            <span style={{ fontSize: 14 }}>Cargando historial...</span>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><IconCash size={32} /></div>
                            <p className="empty-state-title">Sin registros</p>
                            <p className="empty-state-text">Aún no hay sesiones de caja registradas</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Apertura</th>
                                    <th>Cierre</th>
                                    <th>Responsable</th>
                                    <th>Fondo inicial</th>
                                    <th>Esperado</th>
                                    <th>Contado</th>
                                    <th>Diferencia</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(h => {
                                    const diff = h.difference ?? 0
                                    return (
                                        <tr key={h.id}>
                                            <td>{new Date(h.openedAt).toLocaleString('es-CO')}</td>
                                            <td>{h.closedAt ? new Date(h.closedAt).toLocaleString('es-CO') : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                                            <td style={{ fontWeight: 600 }}>{h.userName}</td>
                                            <td>${h.openingBalance.toLocaleString('es-CO')}</td>
                                            <td>{h.expectedBalance != null ? `$${h.expectedBalance.toLocaleString('es-CO')}` : '—'}</td>
                                            <td>{h.closingBalance != null ? `$${h.closingBalance.toLocaleString('es-CO')}` : '—'}</td>
                                            <td>
                                                {h.difference != null ? (
                                                    <span className={`badge ${diff === 0 ? 'badge-green' : diff > 0 ? 'badge-yellow' : 'badge-red'}`}>
                                                        {diff > 0 ? '+' : ''}${diff.toLocaleString('es-CO')}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td>
                                                <span className={`badge ${h.status === 'abierta' ? 'badge-green' : 'badge-gray'}`}>
                                                    {h.status === 'abierta' ? 'Abierta' : 'Cerrada'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                {totalPages > 1 && (
                    <div className="pagination">
                        <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} className="page-btn">← Anterior</button>
                        <span style={{ fontSize: 13, color: '#64748b' }}>Página {historyPage} de {totalPages}</span>
                        <button onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))} disabled={historyPage === totalPages} className="page-btn">Siguiente →</button>
                    </div>
                )}
            </div>

            {modal === 'open' && <OpenCashModal onOpen={handleSessionOpened} onClose={() => setModal('none')} />}
            {modal === 'close' && currentSession && (
                <CloseCashModal session={currentSession} onClose={handleSessionClosed} onCancel={() => setModal('none')} />
            )}
        </div>
    )
}

