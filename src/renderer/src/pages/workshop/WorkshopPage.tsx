// src/renderer/src/pages/workshop/WorkshopPage.tsx
import { useState, useEffect, useCallback } from 'react'
import type { WorkOrder, Mechanic } from '../../../../shared/types/index'
import WorkOrderForm from './components/WorkOrderForm'
import WorkOrderDetail from './components/WorkOrderDetail'
import MotoForm from './components/MotoForm'
import { IconPlus, IconMoto, IconWorkshop, IconPlay, IconCheck, IconSpinner } from '../../components/shared/Icons'

type Modal = 'none' | 'createWO' | 'editWO' | 'detailWO' | 'createMoto'

const KANBAN_COLUMNS = [
    { key: 'pendiente',  label: 'Pendiente',   color: '#94a3b8', bg: '#f8fafc', accent: '#475569', nextStatus: 'en_proceso', nextLabel: 'Iniciar' },
    { key: 'en_proceso', label: 'En proceso',  color: '#3b82f6', bg: '#eff6ff', accent: '#1d4ed8', nextStatus: 'finalizado', nextLabel: 'Finalizar' },
    { key: 'finalizado', label: 'Finalizado',  color: '#16a34a', bg: '#f0fdf6', accent: '#15803d', nextStatus: 'entregado', nextLabel: 'Entregar' },
    { key: 'entregado',  label: 'Entregado',   color: '#8b5cf6', bg: '#faf5ff', accent: '#7c3aed', nextStatus: null, nextLabel: null },
] as const

export default function WorkshopPage() {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
    const [mechanics, setMechanics] = useState<Mechanic[]>([])
    const [loading, setLoading] = useState(false)
    const [modal, setModal] = useState<Modal>('none')
    const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null)
    const [filterMechanic, setFilterMechanic] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        const res = await window.api.listWorkOrders({ mechanicId: filterMechanic ? Number(filterMechanic) : undefined, pageSize: 100 })
        if (res.success && res.data) setWorkOrders(res.data.data)
        setLoading(false)
    }, [filterMechanic])

    useEffect(() => { load() }, [load])
    useEffect(() => { window.api.listMechanics({ activeOnly: true }).then(r => { if (r.success) setMechanics(r.data ?? []) }) }, [])

    function openCreateWO(): void { setSelectedWO(null); setModal('createWO') }
    function openDetail(wo: WorkOrder): void { setSelectedWO(wo); setModal('detailWO') }
    function openEdit(wo: WorkOrder): void { setSelectedWO(wo); setModal('editWO') }
    function closeModal(): void { setModal('none'); setSelectedWO(null) }

    async function handleCreateWO(data: any): Promise<void> {
        const res = await window.api.createWorkOrder(data)
        if (res.success) { closeModal(); load() } else alert(res.error)
    }
    async function handleUpdateWO(data: any): Promise<void> {
        if (!selectedWO) return
        const res = await window.api.updateWorkOrder({ ...data, id: selectedWO.id })
        if (res.success) { closeModal(); load() } else alert(res.error)
    }
    async function handleChangeStatus(wo: WorkOrder, newStatus: string): Promise<void> {
        const res = await window.api.changeWorkOrderStatus({ id: wo.id, status: newStatus })
        if (res.success) load(); else alert(res.error)
    }

    const ordersByStatus = (status: string) => workOrders.filter(wo => wo.status === status)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease-out' }}>

            {/* Header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">Taller</h2>
                    <p className="page-subtitle">{workOrders.length} órdenes de trabajo activas</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <select value={filterMechanic} onChange={e => setFilterMechanic(e.target.value)} className="select" style={{ width: 180 }}>
                        <option value="">Todos los mecánicos</option>
                        {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <button onClick={() => setModal('createMoto')} className="btn btn-secondary">
                        <IconMoto size={15} />
                        Registrar moto
                    </button>
                    <button onClick={openCreateWO} className="btn btn-primary">
                        <IconPlus size={16} />
                        Nueva OT
                    </button>
                </div>
            </div>

            {/* Kanban */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 10, color: '#94a3b8' }}>
                    <IconSpinner size={20} />
                    <span style={{ fontSize: 14 }}>Cargando órdenes...</span>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'start' }}>
                    {KANBAN_COLUMNS.map(col => {
                        const orders = ordersByStatus(col.key)
                        return (
                            <div key={col.key} className="kanban-col" style={{ background: col.bg }}>
                                {/* Column header */}
                                <div className="kanban-col-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: col.color }} />
                                        <span className="kanban-col-title" style={{ color: col.color }}>{col.label}</span>
                                    </div>
                                    <span style={{
                                        background: '#fff', color: '#64748b',
                                        fontSize: 11, fontWeight: 700,
                                        padding: '2px 8px', borderRadius: 20,
                                        border: '1px solid #e2e8f0',
                                    }}>
                                        {orders.length}
                                    </span>
                                </div>

                                {/* Cards */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {orders.length === 0 ? (
                                        <div style={{ padding: '20px 8px', textAlign: 'center', color: '#cbd5e1' }}>
                                            <IconWorkshop size={20} style={{ marginBottom: 6 }} />
                                            <p style={{ fontSize: 11, margin: 0 }}>Sin órdenes</p>
                                        </div>
                                    ) : orders.map(wo => (
                                        <div
                                            key={wo.id}
                                            className="kanban-card"
                                            onClick={() => openDetail(wo)}
                                        >
                                            {/* OT number + date */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: col.color, letterSpacing: '0.04em' }}>
                                                    {wo.orderNumber}
                                                </span>
                                                <span style={{ fontSize: 10, color: '#94a3b8' }}>
                                                    {new Date(wo.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                            </div>

                                            {/* Moto */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                <IconMoto size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                                    {wo.plate}
                                                </span>
                                                <span style={{ fontSize: 12, color: '#64748b' }}>
                                                    {wo.brand} {wo.model}
                                                </span>
                                            </div>

                                            {/* Cliente */}
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 7px', fontWeight: 500 }}>
                                                {wo.clientName || 'Sin cliente asignado'}
                                            </p>

                                            {/* Descripción */}
                                            <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.4, margin: '0 0 10px' }}>
                                                {wo.description.length > 65 ? wo.description.substring(0, 65) + '⬦' : wo.description}
                                            </p>

                                            {/* Footer */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                {wo.mechanicName ? (
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 600, color: '#1d4ed8',
                                                        background: '#dbeafe', padding: '2px 7px', borderRadius: 5,
                                                    }}>
                                                        {wo.mechanicName}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: 10, color: '#cbd5e1' }}>Sin mecánico</span>
                                                )}
                                                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                                    ${wo.total.toLocaleString('es-CO')}
                                                </span>
                                            </div>

                                            {/* Botón cambio de estado */}
                                            {col.nextStatus && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleChangeStatus(wo, col.nextStatus!) }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                                        width: '100%', marginTop: 10,
                                                        background: '#fff', border: `1px solid ${col.color}30`,
                                                        borderRadius: 7, padding: '6px',
                                                        fontSize: 11, fontWeight: 700, color: col.accent,
                                                        cursor: 'pointer', transition: 'all 0.15s',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = col.bg; e.currentTarget.style.borderColor = col.color }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = `${col.color}30` }}
                                                >
                                                    {col.nextLabel === 'Iniciar' && <IconPlay size={11} />}
                                                    {col.nextLabel === 'Finalizar' && <IconCheck size={11} />}
                                                    {col.nextLabel === 'Entregar' && <IconCheck size={11} />}
                                                    {col.nextLabel}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {(modal === 'createWO' || modal === 'editWO') && (
                <WorkOrderForm
                    workOrder={modal === 'editWO' ? selectedWO : null}
                    mechanics={mechanics}
                    onSave={modal === 'editWO' ? handleUpdateWO : handleCreateWO}
                    onClose={closeModal}
                />
            )}
            {modal === 'detailWO' && selectedWO && (
                <WorkOrderDetail
                    workOrder={selectedWO}
                    onClose={closeModal}
                    onEdit={() => openEdit(selectedWO)}
                    onStatusChange={(status) => handleChangeStatus(selectedWO, status)}
                />
            )}
            {modal === 'createMoto' && (
                <MotoForm
                    onSave={async (data) => {
                        const res = await window.api.createMoto(data)
                        if (res.success) { closeModal() } else alert(res.error)
                    }}
                    onClose={closeModal}
                />
            )}
        </div>
    )
}

