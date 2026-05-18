// src/renderer/src/pages/clients/ClientsPage.tsx
import { useState, useEffect, useCallback } from 'react'
import type { Client } from '../../../../shared/types/index'
import ClientForm from './components/ClientForm'
import ClientHistoryModal from './components/ClientHistoryModal'
import {
    IconPlus, IconSearch, IconEdit, IconTrash, IconHistory, IconSpinner, IconClients, IconDownload, IconUpload,
} from '../../components/shared/Icons'

type Modal = 'none' | 'create' | 'edit' | 'history'

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [modal, setModal] = useState<Modal>('none')
    const [selected, setSelected] = useState<Client | null>(null)

    const PAGE_SIZE = 20

    const load = useCallback(async () => {
        setLoading(true)
        const res = await window.api.listClients({ search: search || undefined, page, pageSize: PAGE_SIZE })
        if (res.success && res.data) { setClients(res.data.data); setTotal(res.data.total) }
        setLoading(false)
    }, [search, page])

    useEffect(() => { load() }, [load])
    useEffect(() => { setPage(1) }, [search])

    function openCreate(): void { setSelected(null); setModal('create') }
    function openEdit(c: Client): void { setSelected(c); setModal('edit') }
    function openHistory(c: Client): void { setSelected(c); setModal('history') }
    function closeModal(): void { setModal('none'); setSelected(null) }

    async function handleSave(data: any): Promise<void> {
        const res = selected
            ? await window.api.updateClient({ ...data, id: selected.id })
            : await window.api.createClient(data)
        if (res.success) { closeModal(); load() } else alert(res.error)
    }

    async function handleDelete(c: Client): Promise<void> {
        const confirmed = await window.appConfirm?.(`¿Eliminar a "${c.name}"?`, {
            title: 'Eliminar cliente',
            confirmText: 'Eliminar',
            variant: 'warning',
        })
        if (!confirmed) return
        const res = await window.api.deleteClient(c.id)
        if (res.success) load(); else alert(res.error)
    }

    function showImportResult(res: any): void {
        if (!res.success) { alert(res.error || 'Error al importar clientes'); return }
        const d = res.data ?? {}
        alert(`Importación completada.\nImportados: ${d.imported ?? 0}\nDuplicados: ${d.duplicates ?? 0}\nOmitidos: ${d.skipped ?? 0}`)
        load()
    }

    async function handleImport(): Promise<void> {
        setImporting(true)
        try {
            const res = await window.api.importClients()
            showImportResult(res)
        } catch (err: any) {
            alert(err?.message || 'Error al importar clientes')
        } finally {
            setImporting(false)
        }
    }

    async function handleExport(): Promise<void> {
        setExporting(true)
        const res = await window.api.exportClients({ search: search || undefined })
        setExporting(false)
        if (res.success) {
            const d = res.data as { filePath?: string; count?: number } | undefined
            alert(`Excel exportado correctamente (${d?.count ?? total} clientes).\n${d?.filePath ?? ''}`)
        } else alert(res.error || 'Error al exportar clientes')
    }

    const totalPages = Math.ceil(total / PAGE_SIZE)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease-out' }}>

            {/* Header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">Clientes</h2>
                    <p className="page-subtitle">{total.toLocaleString()} cliente{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleImport} disabled={importing || loading} className="btn btn-secondary btn-sm">
                        {importing ? <><IconSpinner size={14} /> Importando...</> : <><IconUpload size={14} /> Importar Excel</>}
                    </button>
                    <button onClick={handleExport} disabled={exporting || loading} className="btn btn-secondary btn-sm">
                        {exporting ? <><IconSpinner size={14} /> Exportando...</> : <><IconDownload size={14} /> Exportar Excel</>}
                    </button>
                    <button onClick={openCreate} className="btn btn-primary">
                        <IconPlus size={16} />
                        Nuevo cliente
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="filters-bar">
                <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}>
                        <IconSearch size={15} />
                    </span>
                    <input
                        placeholder="Buscar por nombre, documento o teléfono..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="input"
                        style={{ paddingLeft: 32 }}
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10, color: '#94a3b8' }}>
                        <IconSpinner size={20} />
                        <span style={{ fontSize: 14 }}>Cargando clientes...</span>
                    </div>
                ) : clients.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon"><IconClients size={36} /></div>
                        <p className="empty-state-title">No hay clientes</p>
                        <p className="empty-state-text">{search ? 'No se encontraron resultados' : 'Crea el primer cliente con el botón superior'}</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Documento</th>
                                <th>Contacto</th>
                                <th>Límite crédito</th>
                                <th>Descuento</th>
                                <th>Estado</th>
                                <th style={{ width: 120 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                                        {c.notes && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{c.notes}</div>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            {c.documentType && (
                                                <span className="badge badge-gray" style={{ fontSize: 10 }}>{c.documentType}</span>
                                            )}
                                            <span style={{ color: '#475569' }}>{c.document || '—'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ color: '#475569' }}>{c.phone || '—'}</div>
                                        {c.email && <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.email}</div>}
                                    </td>
                                    <td style={{ color: '#475569', fontWeight: 500 }}>
                                        {c.creditLimit > 0 ? `$${c.creditLimit.toLocaleString('es-CO')}` : '—'}
                                    </td>
                                    <td>
                                        {c.discount > 0
                                            ? <span className="badge badge-yellow">{c.discount}%</span>
                                            : <span style={{ color: '#cbd5e1' }}>—</span>
                                        }
                                    </td>
                                    <td>
                                        <span className={`badge ${c.isActive ? 'badge-green' : 'badge-gray'}`}>
                                            {c.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button onClick={() => openHistory(c)} className="btn btn-ghost btn-sm btn-icon" title="Historial">
                                                <IconHistory size={14} />
                                            </button>
                                            <button onClick={() => openEdit(c)} className="btn btn-ghost btn-sm btn-icon" title="Editar">
                                                <IconEdit size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(c)} className="btn btn-ghost btn-sm btn-icon" title="Eliminar" style={{ color: '#ef4444' }}>
                                                <IconTrash size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn">← Anterior</button>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Página {page} de {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="page-btn">Siguiente →</button>
                </div>
            )}

            {(modal === 'create' || modal === 'edit') && (
                <ClientForm client={selected} onSave={handleSave} onClose={closeModal} />
            )}
            {modal === 'history' && selected && (
                <ClientHistoryModal client={selected} onClose={closeModal} />
            )}
        </div>
    )
}

