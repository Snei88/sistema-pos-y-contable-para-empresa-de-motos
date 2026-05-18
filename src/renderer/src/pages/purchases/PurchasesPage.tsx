// src/renderer/src/pages/purchases/PurchasesPage.tsx
import { useState, useEffect, useCallback } from 'react'
import type { Purchase, Supplier } from '../../../../shared/types/index'
import PurchaseForm from './components/PurchaseForm'
import ReceiveModal from './components/ReceiveModal'
import PayModal from './components/PayModal'
import { IconPlus, IconSearch, IconTruck, IconDollarSign, IconTrash, IconSpinner, IconPackage, IconDownload, IconUpload } from '../../components/shared/Icons'

type Modal = 'none' | 'create' | 'receive' | 'pay'

const STATUS_BADGE: Record<string, string> = {
    recibida: 'badge-green', pendiente: 'badge-yellow', parcial: 'badge-blue', anulada: 'badge-red',
}
const PAY_BADGE: Record<string, string> = {
    pagado: 'badge-green', parcial: 'badge-yellow', pendiente: 'badge-red',
}

export default function PurchasesPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [modal, setModal] = useState<Modal>('none')
    const [selected, setSelected] = useState<Purchase | null>(null)

    const PAGE_SIZE = 20

    const load = useCallback(async () => {
        setLoading(true)
        const res = await window.api.listPurchases({ search: search || undefined, status: statusFilter || undefined, page, pageSize: PAGE_SIZE })
        if (res.success && res.data) { setPurchases(res.data.data); setTotal(res.data.total) }
        setLoading(false)
    }, [search, statusFilter, page])

    useEffect(() => { load() }, [load])
    useEffect(() => { setPage(1) }, [search, statusFilter])
    useEffect(() => { window.api.listSuppliers().then(r => { if (r.success) setSuppliers(r.data ?? []) }) }, [])

    function openCreate(): void { setSelected(null); setModal('create') }
    function openReceive(p: Purchase): void { setSelected(p); setModal('receive') }
    function openPay(p: Purchase): void { setSelected(p); setModal('pay') }
    function closeModal(): void { setModal('none'); setSelected(null) }

    async function handleSave(data: any): Promise<void> {
        const res = await window.api.createPurchase(data)
        if (res.success) { closeModal(); load() } else alert(res.error)
    }
    async function handleReceive(data: any): Promise<void> {
        const res = await window.api.receivePurchase(data)
        if (res.success) { closeModal(); load() } else alert(res.error)
    }
    async function handlePay(data: any): Promise<void> {
        const res = await window.api.updatePurchase(data)
        if (res.success) { closeModal(); load() } else alert(res.error)
    }
    async function handleCancel(id: number): Promise<void> {
        const confirmed = await window.appConfirm?.('¿Anular esta compra?', {
            title: 'Anular compra',
            confirmText: 'Anular',
            variant: 'warning',
        })
        if (!confirmed) return
        const res = await (window.api as any).cancelPurchase?.(id)
        if (res?.success) load(); else alert(res?.error || 'Error al anular')
    }

    async function handleImport(): Promise<void> {
        setImporting(true)
        try {
            const res = await window.api.importPurchases()
            if (res.success) {
                const d = res.data as any
                alert(`Importación completada.\nImportadas: ${d.imported ?? 0}\nDuplicadas: ${d.duplicates ?? 0}\nOmitidas: ${d.skipped ?? 0}`)
                load()
            } else alert(res.error || 'Error al importar compras')
        } catch (err: any) {
            alert(err?.message || 'Error al importar compras')
        } finally {
            setImporting(false)
        }
    }

    async function handleExport(): Promise<void> {
        setExporting(true)
        const res = await window.api.exportPurchases({ search: search || undefined, status: statusFilter || undefined })
        setExporting(false)
        if (res.success) {
            const d = res.data as { filePath?: string; count?: number } | undefined
            alert(`Excel exportado correctamente (${d?.count ?? total} compras).\n${d?.filePath ?? ''}`)
        } else alert(res.error || 'Error al exportar compras')
    }

    const totalPages = Math.ceil(total / PAGE_SIZE)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease-out' }}>

            <div className="page-header">
                <div>
                    <h2 className="page-title">Compras</h2>
                    <p className="page-subtitle">{total.toLocaleString()} compra{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}</p>
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
                        Nueva compra
                    </button>
                </div>
            </div>

            <div className="filters-bar">
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}>
                        <IconSearch size={15} />
                    </span>
                    <input placeholder="Buscar por factura o proveedor..." value={search} onChange={e => setSearch(e.target.value)} className="input" style={{ paddingLeft: 32 }} />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select" style={{ width: 170 }}>
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="recibida">Recibida</option>
                    <option value="parcial">Parcial</option>
                    <option value="anulada">Anulada</option>
                </select>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10, color: '#94a3b8' }}>
                        <IconSpinner size={20} /><span style={{ fontSize: 14 }}>Cargando compras...</span>
                    </div>
                ) : purchases.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon"><IconPackage size={36} /></div>
                        <p className="empty-state-title">No hay compras</p>
                        <p className="empty-state-text">{search || statusFilter ? 'Ajusta los filtros' : 'Registra la primera compra a proveedor'}</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Factura</th>
                                <th>Proveedor</th>
                                <th>Fecha</th>
                                <th>Total</th>
                                <th>Pagado</th>
                                <th>Estado</th>
                                <th>Pago</th>
                                <th style={{ width: 120 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map(p => (
                                <tr key={p.id}>
                                    <td><span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: 12 }}>{p.invoiceNumber || '—'}</span></td>
                                    <td style={{ fontWeight: 500 }}>{p.supplierName}</td>
                                    <td>{new Date(p.createdAt).toLocaleDateString('es-CO')}</td>
                                    <td style={{ fontWeight: 700, color: '#0f172a' }}>${p.total.toLocaleString('es-CO')}</td>
                                    <td style={{ color: '#64748b' }}>${p.paid.toLocaleString('es-CO')}</td>
                                    <td><span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{p.status}</span></td>
                                    <td><span className={`badge ${PAY_BADGE[p.paymentStatus] ?? 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{p.paymentStatus}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {p.status === 'pendiente' && (
                                                <button onClick={() => openReceive(p)} className="btn btn-ghost btn-sm btn-icon" title="Recibir mercancía" style={{ color: '#16a34a' }}>
                                                    <IconTruck size={14} />
                                                </button>
                                            )}
                                            {p.paymentStatus !== 'pagado' && p.status !== 'anulada' && (
                                                <button onClick={() => openPay(p)} className="btn btn-ghost btn-sm btn-icon" title="Registrar pago" style={{ color: '#3b82f6' }}>
                                                    <IconDollarSign size={14} />
                                                </button>
                                            )}
                                            <button onClick={() => handleCancel(p.id)} className="btn btn-ghost btn-sm btn-icon" title="Anular" style={{ color: '#ef4444' }}>
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

            {totalPages > 1 && (
                <div className="pagination">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn">← Anterior</button>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Página {page} de {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="page-btn">Siguiente →</button>
                </div>
            )}

            {modal === 'create' && <PurchaseForm suppliers={suppliers} onSave={handleSave} onClose={closeModal} />}
            {modal === 'receive' && selected && <ReceiveModal purchase={selected} onReceive={handleReceive} onClose={closeModal} />}
            {modal === 'pay' && selected && <PayModal purchase={selected} onPay={handlePay} onClose={closeModal} />}
        </div>
    )
}

