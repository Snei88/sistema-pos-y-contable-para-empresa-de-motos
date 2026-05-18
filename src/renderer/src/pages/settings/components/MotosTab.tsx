// src/renderer/src/pages/settings/components/MotosTab.tsx
import { useState, useEffect, useCallback } from 'react'
import type { Motorcycle, Client } from '../../../../../shared/types/index'
import { IconPlus, IconEdit, IconX, IconSpinner, IconSearch, IconDownload } from '../../../components/shared/Icons'

interface MotoForm {
    plate: string
    brand: string
    model: string
    year: string
    color: string
    engineNumber: string
    chassisNumber: string
    notes: string
}

const EMPTY_FORM: MotoForm = { plate: '', brand: '', model: '', year: '', color: '', engineNumber: '', chassisNumber: '', notes: '' }

export default function MotosTab() {
    const [motos, setMotos] = useState<Motorcycle[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [modal, setModal] = useState<'none' | 'create' | 'edit'>('none')
    const [selected, setSelected] = useState<Motorcycle | null>(null)
    const [form, setForm] = useState<MotoForm>(EMPTY_FORM)
    const [clientSearch, setClientSearch] = useState('')
    const [clientResults, setClientResults] = useState<Client[]>([])
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const PAGE_SIZE = 20

    const load = useCallback(async () => {
        setLoading(true)
        const res = await window.api.listMotos({ search: search || undefined, page, pageSize: PAGE_SIZE })
        if (res.success && res.data) {
            const d = res.data as any
            setMotos(d.data ?? d)
            setTotal(d.total ?? (d.data ?? d).length)
        }
        setLoading(false)
    }, [search, page])

    useEffect(() => { load() }, [load])
    useEffect(() => { setPage(1) }, [search])

    async function searchClients(q: string) {
        if (q.length < 2) { setClientResults([]); return }
        const res = await window.api.searchClients(q)
        if (res.success && res.data) setClientResults(res.data)
    }

    function openCreate() {
        setSelected(null); setForm(EMPTY_FORM); setSelectedClient(null); setClientSearch('')
        setError(''); setModal('create')
    }
    function openEdit(m: Motorcycle) {
        setSelected(m)
        setForm({
            plate: m.plate, brand: m.brand, model: m.model,
            year: m.year ? String(m.year) : '', color: m.color ?? '',
            engineNumber: m.engineNumber ?? '', chassisNumber: m.chassisNumber ?? '', notes: m.notes ?? '',
        })
        setSelectedClient(m.clientId ? { id: m.clientId, name: m.clientName ?? '' } as Client : null)
        setClientSearch(''); setError(''); setModal('edit')
    }
    function closeModal() { setModal('none'); setSelected(null); setSelectedClient(null); setClientSearch(''); setClientResults([]) }

    function set(k: keyof MotoForm, v: string) { setForm(f => ({ ...f, [k]: v })) }

    async function handleSave() {
        if (!form.plate.trim()) { setError('La placa es requerida'); return }
        if (!form.brand.trim()) { setError('La marca es requerida'); return }
        if (!form.model.trim()) { setError('El modelo es requerido'); return }
        setSaving(true); setError('')
        const data = {
            plate: form.plate.trim().toUpperCase(),
            brand: form.brand.trim(),
            model: form.model.trim(),
            year: form.year ? Number(form.year) : undefined,
            color: form.color.trim() || undefined,
            engineNumber: form.engineNumber.trim() || undefined,
            chassisNumber: form.chassisNumber.trim() || undefined,
            notes: form.notes.trim() || undefined,
            clientId: selectedClient?.id,
        }
        const res = selected
            ? await window.api.updateMoto({ ...data, id: selected.id })
            : await window.api.createMoto(data)
        if (res.success) { closeModal(); load() }
        else setError(res.error ?? 'Error al guardar')
        setSaving(false)
    }

    async function handleExport() {
        setExporting(true)
        const res = await window.api.exportMotos({ search: search || undefined })
        setExporting(false)

        if (res.success) {
            const data = res.data as { filePath?: string; count?: number } | undefined
            alert(`Excel exportado correctamente (${data?.count ?? total} motos).\n${data?.filePath ?? ''}`)
        } else {
            alert(res.error || 'Error al exportar motos')
        }
    }

    const totalPages = Math.ceil(total / PAGE_SIZE)

    return (
        <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Motos registradas</h3>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>{total} moto{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleExport} disabled={exporting || loading} className="btn btn-secondary btn-sm">
                        {exporting ? <><IconSpinner size={14} /> Exportando...</> : <><IconDownload size={14} /> Exportar Excel</>}
                    </button>
                    <button onClick={openCreate} className="btn btn-primary btn-sm">
                        <IconPlus size={14} /> Nueva moto
                    </button>
                </div>
            </div>

            <div style={{ position: 'relative', marginBottom: 16 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}>
                    <IconSearch size={14} />
                </span>
                <input
                    className="input input-sm"
                    placeholder="Buscar por placa, marca, modelo o propietario..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: 30 }}
                />
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 32, justifyContent: 'center', color: '#94a3b8' }}>
                    <IconSpinner size={16} /> Cargando...
                </div>
            ) : motos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
                    {search ? 'No se encontraron motos' : 'Aún no hay motos registradas.'}
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Placa</th>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Año</th>
                                <th>Color</th>
                                <th>Propietario</th>
                                <th style={{ width: 60 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {motos.map(m => (
                                <tr key={m.id}>
                                    <td><span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{m.plate}</span></td>
                                    <td>{m.brand}</td>
                                    <td>{m.model}</td>
                                    <td style={{ color: '#64748b' }}>{m.year || '—'}</td>
                                    <td style={{ color: '#64748b' }}>{m.color || '—'}</td>
                                    <td style={{ color: '#64748b' }}>{m.clientName || '—'}</td>
                                    <td>
                                        <button onClick={() => openEdit(m)} className="btn btn-ghost btn-icon btn-sm">
                                            <IconEdit size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="pagination" style={{ paddingTop: 12 }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn">← Anterior</button>
                    <span style={{ fontSize: 13, color: '#64748b', padding: '0 8px' }}>Página {page} de {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="page-btn">Siguiente →</button>
                </div>
            )}

            {modal !== 'none' && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.2s ease-out' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                {modal === 'edit' ? 'Editar moto' : 'Registrar moto'}
                            </h3>
                            <button onClick={closeModal} className="btn btn-ghost btn-icon btn-sm"><IconX size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row form-row-2">
                                <div className="form-group">
                                    <label className="label">Placa *</label>
                                    <input className="input" value={form.plate} onChange={e => set('plate', e.target.value.toUpperCase())} placeholder="ABC123" />
                                </div>
                                <div className="form-group">
                                    <label className="label">Color</label>
                                    <input className="input" value={form.color} onChange={e => set('color', e.target.value)} placeholder="Rojo, Negro..." />
                                </div>
                            </div>
                            <div className="form-row form-row-2">
                                <div className="form-group">
                                    <label className="label">Marca *</label>
                                    <input className="input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Honda, Yamaha..." />
                                </div>
                                <div className="form-group">
                                    <label className="label">Modelo *</label>
                                    <input className="input" value={form.model} onChange={e => set('model', e.target.value)} placeholder="CBR 150, FZ 250..." />
                                </div>
                            </div>
                            <div className="form-row form-row-2">
                                <div className="form-group">
                                    <label className="label">Año</label>
                                    <input className="input" type="number" min={1980} max={2030} value={form.year} onChange={e => set('year', e.target.value)} placeholder="2020" />
                                </div>
                                <div className="form-group">
                                    <label className="label">N° Motor</label>
                                    <input className="input" value={form.engineNumber} onChange={e => set('engineNumber', e.target.value)} placeholder="Opcional" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">Propietario (cliente registrado)</label>
                                {selectedClient ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{selectedClient.name}</span>
                                        <button type="button" onClick={() => { setSelectedClient(null); setClientSearch('') }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12 }}>Quitar</button>
                                    </div>
                                ) : (
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="input"
                                            value={clientSearch}
                                            onChange={e => { setClientSearch(e.target.value); searchClients(e.target.value) }}
                                            placeholder="Buscar cliente por nombre o documento..."
                                        />
                                        {clientResults.length > 0 && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxHeight: 180, overflow: 'auto', zIndex: 100, marginTop: 4 }}>
                                                {clientResults.map(c => (
                                                    <div key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(''); setClientResults([]) }}
                                                        style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                                        {c.name} {c.document ? `· ${c.document}` : ''}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="label">Notas</label>
                                <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Observaciones sobre la moto..." />
                            </div>
                            {error && <div className="alert alert-error">{error}</div>}
                        </div>
                        <div className="modal-footer">
                            <button onClick={closeModal} className="btn btn-secondary">Cancelar</button>
                            <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ gap: 8 }}>
                                {saving ? <><IconSpinner size={14} /> Guardando...</> : modal === 'edit' ? 'Guardar cambios' : 'Registrar moto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
