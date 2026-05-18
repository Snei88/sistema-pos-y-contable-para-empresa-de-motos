// src/renderer/src/pages/inventory/InventoryPage.tsx
import { useState, useEffect, useCallback } from 'react'
import type { Product, Category, Supplier } from '../../../../shared/types/index'
import ProductTable from './components/ProductTable'
import ProductForm from './components/ProductForm'
import AdjustStockModal from './components/AdjustStockModal'
import KardexModal from './components/KardexModal'
import {
    IconPlus, IconSearch, IconAlertTriangle, IconSpinner, IconRefresh, IconDownload, IconUpload,
} from '../../components/shared/Icons'

type Modal = 'none' | 'create' | 'edit' | 'adjust' | 'kardex'

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [catFilter, setCatFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [lowStock, setLowStock] = useState(false)
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [modal, setModal] = useState<Modal>('none')
    const [selected, setSelected] = useState<Product | null>(null)

    const PAGE_SIZE = 20

    const load = useCallback(async () => {
        setLoading(true)
        const res = await window.api.listProducts({
            search: search || undefined,
            categoryId: catFilter ? Number(catFilter) : undefined,
            status: statusFilter || undefined,
            lowStock: lowStock || undefined,
            page, pageSize: PAGE_SIZE,
        })
        if (res.success && res.data) {
            setProducts(res.data.items)
            setTotal(res.data.total)
        }
        setLoading(false)
    }, [search, catFilter, statusFilter, lowStock, page])

    useEffect(() => { load() }, [load])
    useEffect(() => { setPage(1) }, [search, catFilter, statusFilter, lowStock])
    useEffect(() => {
        window.api.listCategories().then(r => { if (r.success) setCategories(r.data ?? []) })
        window.api.listSuppliers().then(r => { if (r.success) setSuppliers(r.data ?? []) })
    }, [])

    function openCreate(): void { setSelected(null); setModal('create') }
    function openEdit(p: Product): void { setSelected(p); setModal('edit') }
    function openAdjust(p: Product): void { setSelected(p); setModal('adjust') }
    function openKardex(p: Product): void { setSelected(p); setModal('kardex') }
    function closeModal(): void { setModal('none'); setSelected(null) }

    async function handleSave(data: any): Promise<void> {
        const res = selected
            ? await window.api.updateProduct({ ...data, id: selected.id })
            : await window.api.createProduct(data)
        if (res.success) { closeModal(); load() }
        else alert(res.error)
    }
    async function handleDelete(p: Product): Promise<void> {
        const confirmed = await window.appConfirm?.(`¿Eliminar "${p.name}"?`, {
            title: 'Eliminar producto',
            confirmText: 'Eliminar',
            variant: 'warning',
        })
        if (!confirmed) return
        const res = await window.api.deleteProduct(p.id)
        if (res.success) load(); else alert(res.error)
    }
    async function handleAdjust(data: any): Promise<void> {
        const res = await window.api.adjustStock(data)
        if (res.success) { closeModal(); load() }
        else alert(res.error)
    }

    function showImportResult(res: any, label: string): void {
        if (!res.success) { alert(res.error || `Error al importar ${label}`); return }
        const d = res.data ?? {}
        alert(`Importación completada.\nImportados: ${d.imported ?? 0}\nDuplicados: ${d.duplicates ?? 0}\nOmitidos: ${d.skipped ?? 0}`)
        load()
    }

    async function handleImport(): Promise<void> {
        setImporting(true)
        try {
            const res = await window.api.importInventory()
            showImportResult(res, 'inventario')
        } catch (err: any) {
            alert(err?.message || 'Error al importar inventario')
        } finally {
            setImporting(false)
        }
    }

    async function handleExport(): Promise<void> {
        setExporting(true)
        const res = await window.api.exportInventory({
            search: search || undefined,
            categoryId: catFilter ? Number(catFilter) : undefined,
            status: statusFilter || undefined,
            lowStock: lowStock || undefined,
        })
        setExporting(false)
        if (res.success) {
            const d = res.data as { filePath?: string; count?: number } | undefined
            alert(`Excel exportado correctamente (${d?.count ?? total} productos).\n${d?.filePath ?? ''}`)
        } else alert(res.error || 'Error al exportar inventario')
    }

    const totalPages = Math.ceil(total / PAGE_SIZE)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease-out' }}>

            {/* Header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">Inventario</h2>
                    <p className="page-subtitle">
                        {total.toLocaleString()} producto{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
                        {lowStock && <span className="badge badge-yellow" style={{ marginLeft: 8 }}>Stock bajo activo</span>}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleImport} disabled={importing || loading} className="btn btn-secondary btn-sm">
                        {importing ? <><IconSpinner size={14} /> Importando...</> : <><IconUpload size={14} /> Importar Excel</>}
                    </button>
                    <button onClick={handleExport} disabled={exporting || loading} className="btn btn-secondary btn-sm">
                        {exporting ? <><IconSpinner size={14} /> Exportando...</> : <><IconDownload size={14} /> Exportar Excel</>}
                    </button>
                    <button onClick={load} className="btn btn-secondary btn-sm">
                        <IconRefresh size={14} />
                        Actualizar
                    </button>
                    <button onClick={openCreate} className="btn btn-primary">
                        <IconPlus size={16} />
                        Nuevo producto
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="filters-bar">
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                    <span style={{
                        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                        color: '#94a3b8', display: 'flex', pointerEvents: 'none',
                    }}>
                        <IconSearch size={15} />
                    </span>
                    <input
                        placeholder="Buscar por nombre, código o barcode..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="input"
                        style={{ paddingLeft: 32 }}
                    />
                </div>

                <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="select" style={{ width: 180 }}>
                    <option value="">Todas las categorías</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select" style={{ width: 150 }}>
                    <option value="">Todos los estados</option>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                </select>

                <label className="checkbox-label" style={{ whiteSpace: 'nowrap' }}>
                    <input
                        type="checkbox"
                        checked={lowStock}
                        onChange={e => setLowStock(e.target.checked)}
                    />
                    <IconAlertTriangle size={14} style={{ color: lowStock ? '#d97706' : '#94a3b8' }} />
                    Stock bajo
                </label>
            </div>

            {/* Tabla */}
            <div className="card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10, color: '#94a3b8' }}>
                        <IconSpinner size={20} />
                        <span style={{ fontSize: 14 }}>Cargando productos...</span>
                    </div>
                ) : (
                    <ProductTable
                        products={products}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onAdjust={openAdjust}
                        onKardex={openKardex}
                    />
                )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="page-btn"
                    >
                        ← Anterior
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const visiblePages = Math.min(5, totalPages)
                        const startPage = Math.max(1, Math.min(page - 2, totalPages - visiblePages + 1))
                        const pageNum = startPage + i
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`page-btn${page === pageNum ? ' active' : ''}`}
                            >
                                {pageNum}
                            </button>
                        )
                    })}
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="page-btn"
                    >
                        Siguiente →
                    </button>
                </div>
            )}

            {/* Modales */}
            {(modal === 'create' || modal === 'edit') && (
                <ProductForm product={selected} categories={categories} suppliers={suppliers} onSave={handleSave} onClose={closeModal} />
            )}
            {modal === 'adjust' && selected && (
                <AdjustStockModal product={selected} onAdjust={handleAdjust} onClose={closeModal} />
            )}
            {modal === 'kardex' && selected && (
                <KardexModal product={selected} onClose={closeModal} />
            )}
        </div>
    )
}

