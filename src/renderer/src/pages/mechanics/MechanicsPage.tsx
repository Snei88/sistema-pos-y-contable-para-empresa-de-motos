// src/renderer/src/pages/mechanics/MechanicsPage.tsx
import { useState, useEffect, useCallback } from 'react'
import type { Mechanic } from '../../../../shared/types/index'
import MechanicForm from './components/MechanicForm'
import DailyReportModal from './components/DailyReportModal'
import SettlementsModal from './components/SettlementsModal'
import { IconPlus, IconMechanics, IconEdit, IconCalendar, IconChartBar, IconSpinner, IconDownload, IconUpload } from '../../components/shared/Icons'

type Modal = 'none' | 'create' | 'edit' | 'daily' | 'settlements'

export default function MechanicsPage() {
    const [mechanics, setMechanics] = useState<Mechanic[]>([])
    const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [modal, setModal] = useState<Modal>('none')
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [exporting, setExporting] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await window.api.listMechanics({ activeOnly: true })
        if (res.success && res.data) setMechanics(res.data)
        setLoading(false)
    }, [])

    useEffect(() => { load() }, [load])

    function openCreate(): void { setSelectedMechanic(null); setModal('create') }
    function openEdit(m: Mechanic): void { setSelectedMechanic(m); setModal('edit') }
    function openDaily(m: Mechanic): void { setSelectedMechanic(m); setModal('daily') }
    function openSettlements(m: Mechanic): void { setSelectedMechanic(m); setModal('settlements') }
    function closeModal(): void { setModal('none'); setSelectedMechanic(null) }

    async function handleSave(data: any): Promise<void> {
        const res = selectedMechanic
            ? await window.api.updateMechanic({ ...data, id: selectedMechanic.id })
            : await window.api.createMechanic(data)
        if (res.success) { closeModal(); load() } else alert(res.error)
    }

    async function handleImport(): Promise<void> {
        setImporting(true)
        try {
            const res = await window.api.importMechanics()
            if (res.success) {
                const d = res.data as any
                alert(`Importación completada.\nImportados: ${d.imported ?? 0}\nDuplicados: ${d.duplicates ?? 0}\nOmitidos: ${d.skipped ?? 0}`)
                load()
            } else alert(res.error || 'Error al importar mecánicos')
        } catch (err: any) {
            alert(err?.message || 'Error al importar mecánicos')
        } finally {
            setImporting(false)
        }
    }

    async function handleExport(): Promise<void> {
        setExporting(true)
        const res = await window.api.exportMechanicsList()
        setExporting(false)
        if (res.success) {
            const d = res.data as { filePath?: string; count?: number } | undefined
            alert(`Excel exportado correctamente (${d?.count ?? mechanics.length} mecánicos).\n${d?.filePath ?? ''}`)
        } else alert(res.error || 'Error al exportar mecánicos')
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeIn 0.2s ease-out' }}>

            <div className="page-header">
                <div>
                    <h2 className="page-title">Mecánicos</h2>
                    <p className="page-subtitle">{mechanics.length} técnico{mechanics.length !== 1 ? 's' : ''} activo{mechanics.length !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="input"
                        style={{ width: 160 }}
                    />
                    <button onClick={handleImport} disabled={importing || loading} className="btn btn-secondary btn-sm">
                        {importing ? <><IconSpinner size={14} /> Importando...</> : <><IconUpload size={14} /> Importar Excel</>}
                    </button>
                    <button onClick={handleExport} disabled={exporting || loading} className="btn btn-secondary btn-sm">
                        {exporting ? <><IconSpinner size={14} /> Exportando...</> : <><IconDownload size={14} /> Exportar Excel</>}
                    </button>
                    <button onClick={openCreate} className="btn btn-primary">
                        <IconPlus size={16} />
                        Nuevo mecánico
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: '#94a3b8' }}>
                    <IconSpinner size={20} /><span style={{ fontSize: 14 }}>Cargando mecánicos...</span>
                </div>
            ) : mechanics.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><IconMechanics size={36} /></div>
                    <p className="empty-state-title">No hay mecánicos</p>
                    <p className="empty-state-text">Registra el primer técnico del taller</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                    {mechanics.map((m, i) => {
                        const initials = m.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                        const avatarColors = ['#16a34a', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']
                        const color = avatarColors[i % avatarColors.length]
                        return (
                            <div key={m.id} className="card" style={{ padding: 18 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                    <div style={{
                                        width: 46, height: 46, borderRadius: 13,
                                        background: `linear-gradient(135deg, ${color}22, ${color}44)`,
                                        border: `2px solid ${color}33`,
                                        color: color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 16, fontWeight: 800, flexShrink: 0,
                                    }}>
                                        {initials}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {m.name}
                                        </p>
                                        {m.specialty && (
                                            <p style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, margin: '2px 0 0' }}>{m.specialty}</p>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8, padding: '10px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>Patio</p>
                                        <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>${m.patioFee.toLocaleString('es-CO')}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => openDaily(m)} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                                        <IconCalendar size={13} />
                                        Reporte día
                                    </button>
                                    <button onClick={() => openSettlements(m)} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                                        <IconChartBar size={13} />
                                        Historial
                                    </button>
                                    <button onClick={() => openEdit(m)} className="btn btn-ghost btn-sm btn-icon" title="Editar">
                                        <IconEdit size={14} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {(modal === 'create' || modal === 'edit') && (
                <MechanicForm mechanic={selectedMechanic} onSave={handleSave} onClose={closeModal} />
            )}
            {modal === 'daily' && selectedMechanic && (
                <DailyReportModal mechanic={selectedMechanic} date={selectedDate} onClose={closeModal} />
            )}
            {modal === 'settlements' && selectedMechanic && (
                <SettlementsModal mechanic={selectedMechanic} onClose={closeModal} />
            )}
        </div>
    )
}

