// src/renderer/src/pages/workshop/components/WorkOrderDetail.tsx
import { useState, useEffect } from 'react'
import type { WorkOrder } from '../../../../../shared/types/index'
import { IconX, IconEdit, IconPlay, IconCheck, IconCheckCircle, IconSpinner } from '../../../components/shared/Icons'

interface Props {
    workOrder: WorkOrder
    onClose: () => void
    onEdit: () => void
    onStatusChange: (status: string) => void
}

const STATUS_FLOW: Record<string, { next: string; label: string; color: string }> = {
    pendiente: { next: 'en_proceso', label: 'Iniciar trabajo', color: '#3b82f6' },
    en_proceso: { next: 'finalizado', label: 'Finalizar', color: '#16a34a' },
    finalizado: { next: 'entregado', label: 'Entregar', color: '#8b5cf6' },
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    pendiente: { bg: '#f1f5f9', color: '#64748b', label: 'Pendiente' },
    en_proceso: { bg: '#dbeafe', color: '#1e40af', label: 'En proceso' },
    finalizado: { bg: '#d1fae5', color: '#065f46', label: 'Finalizado' },
    entregado: { bg: '#ddd6fe', color: '#5b21b6', label: 'Entregado' },
    anulado: { bg: '#fee2e2', color: '#991b1b', label: 'Anulado' },
}

export default function WorkOrderDetail({ workOrder, onClose, onEdit, onStatusChange }: Props) {
    const [fullData, setFullData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        ;(async () => {
            setLoading(true)
            const res = await window.api.getWorkOrder(workOrder.id)
            if (res.success) setFullData(res.data)
            setLoading(false)
        })()
    }, [workOrder.id])

    const sc = STATUS_STYLE[workOrder.status] || STATUS_STYLE.pendiente
    const nextAction = STATUS_FLOW[workOrder.status]
    const isCompleted = workOrder.status === 'entregado' || workOrder.status === 'anulado'

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.2s ease-out' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                            {workOrder.orderNumber}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>
                            {sc.label}
                        </span>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
                        <IconX size={16} />
                    </button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10, color: '#94a3b8' }}>
                            <IconSpinner size={20} /> Cargando...
                        </div>
                    ) : fullData ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                                {[
                                    { label: 'Moto', value: workOrder.plate, sub: `${workOrder.brand} ${workOrder.model}` },
                                    { label: 'Cliente', value: workOrder.clientName || 'Sin cliente' },
                                    { label: 'Mecánico', value: workOrder.mechanicName || 'Sin asignar' },
                                    { label: 'Total', value: `$${workOrder.total.toLocaleString('es-CO')}`, highlight: true },
                                ].map(card => (
                                    <div key={card.label} style={{ background: '#f8fafc', borderRadius: 10, padding: 14 }}>
                                        <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{card.label}</p>
                                        <p style={{ fontSize: card.highlight ? 20 : 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{card.value}</p>
                                        {card.sub && <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{card.sub}</p>}
                                    </div>
                                ))}
                            </div>

                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Descripción</p>
                                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>{fullData.description}</p>
                            </div>

                            {fullData.diagnosis && (
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Diagnóstico</p>
                                    <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>{fullData.diagnosis}</p>
                                </div>
                            )}

                            {fullData.items && fullData.items.length > 0 && (
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
                                        Items ({fullData.items.length})
                                    </p>
                                    {fullData.items.map((item: any) => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 600, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4,
                                                background: item.type === 'repuesto' ? '#dbeafe' : '#d1fae5',
                                                color: item.type === 'repuesto' ? '#1e40af' : '#065f46',
                                            }}>{item.type}</span>
                                            <span style={{ flex: 1, fontSize: 14 }}>{item.description}</span>
                                            <span style={{ fontSize: 13, color: '#64748b' }}>{item.quantity} × ${item.unitPrice.toLocaleString('es-CO')}</span>
                                            <span style={{ fontWeight: 700, fontSize: 14, width: 100, textAlign: 'right' }}>
                                                ${item.subtotal.toLocaleString('es-CO')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Timeline</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#64748b' }}>
                                    <span>Creada: {new Date(workOrder.createdAt).toLocaleString('es-CO')}</span>
                                    {workOrder.estimatedDelivery && (
                                        <span>Entrega estimada: {new Date(workOrder.estimatedDelivery).toLocaleDateString('es-CO')}</span>
                                    )}
                                    {workOrder.deliveredAt && (
                                        <span style={{ color: '#8b5cf6', fontWeight: 600 }}>
                                            Entregada: {new Date(workOrder.deliveredAt).toLocaleString('es-CO')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Error al cargar detalles</p>
                    )}
                </div>

                <div className="modal-footer">
                    {isCompleted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8b5cf6', fontWeight: 600, fontSize: 14 }}>
                            <IconCheckCircle size={16} /> Orden completada
                        </div>
                    ) : (
                        <>
                            <button onClick={onEdit} className="btn btn-secondary" style={{ gap: 6 }}>
                                <IconEdit size={14} /> Editar
                            </button>
                            {nextAction && (
                                <button
                                    onClick={() => onStatusChange(nextAction.next)}
                                    className="btn"
                                    style={{ background: nextAction.color, color: '#fff', border: 'none', gap: 6 }}
                                >
                                    {nextAction.next === 'en_proceso' ? <IconPlay size={14} /> : <IconCheck size={14} />}
                                    {nextAction.label}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

