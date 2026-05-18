// src/renderer/src/pages/settings/components/SuppliersTab.tsx
import { useState, useEffect } from 'react'
import type { Supplier } from '../../../../../shared/types/index'
import { IconPlus, IconEdit, IconTrash, IconX, IconSpinner, IconSearch, IconDownload } from '../../../components/shared/Icons'

interface SupplierForm {
    name: string
    nit: string
    contact: string
    phone: string
    email: string
    address: string
}

const EMPTY_FORM: SupplierForm = { name: '', nit: '', contact: '', phone: '', email: '', address: '' }

export default function SuppliersTab() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [modal, setModal] = useState<'none' | 'create' | 'edit'>('none')
    const [selected, setSelected] = useState<Supplier | null>(null)
    const [form, setForm] = useState<SupplierForm>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => { load() }, [])

    async function load() {
        setLoading(true)
        const res = await window.api.listSuppliers()
        if (res.success && res.data) setSuppliers(res.data as Supplier[])
        setLoading(false)
    }

    function openCreate() {
        setSelected(null); setForm(EMPTY_FORM); setError(''); setModal('create')
    }
    function openEdit(s: Supplier) {
        setSelected(s)
        setForm({ name: s.name, nit: s.nit ?? '', contact: s.contact ?? '', phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '' })
        setError(''); setModal('edit')
    }
    function closeModal() { setModal('none'); setSelected(null) }

    function set(k: keyof SupplierForm, v: string) { setForm(f => ({ ...f, [k]: v })) }

    async function handleSave() {
        if (!form.name.trim()) { setError('El nombre es requerido'); return }
        setSaving(true); setError('')
        const data = { ...form, name: form.name.trim(), isActive: true }
        const res = selected
            ? await window.api.updateSupplier({ ...data, id: selected.id })
            : await window.api.createSupplier(data)
        if (res.success) { closeModal(); load() }
        else setError(res.error ?? 'Error al guardar')
        setSaving(false)
    }

    async function handleDelete(s: Supplier) {
        const confirmed = await window.appConfirm?.(`¿Eliminar proveedor "${s.name}"?`, {
            title: 'Eliminar proveedor',
            confirmText: 'Eliminar',
            variant: 'warning',
        })
        if (!confirmed) return
        const res = await window.api.deleteSupplier(s.id)
        if (res.success) load(); else alert(res.error)
    }

    async function handleExport() {
        setExporting(true)
        const res = await window.api.exportSuppliers({ search: search || undefined })
        setExporting(false)

        if (res.success) {
            const data = res.data as { filePath?: string; count?: number } | undefined
            alert(`Excel exportado correctamente (${data?.count ?? filtered.length} proveedores).\n${data?.filePath ?? ''}`)
        } else {
            alert(res.error || 'Error al exportar proveedores')
        }
    }

    const filtered = suppliers.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.nit && s.nit.includes(search)) || (s.phone && s.phone.includes(search))
    )

    return (
        <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Proveedores</h3>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>{suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''} registrado{suppliers.length !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleExport} disabled={exporting || loading} className="btn btn-secondary btn-sm">
                        {exporting ? <><IconSpinner size={14} /> Exportando...</> : <><IconDownload size={14} /> Exportar Excel</>}
                    </button>
                    <button onClick={openCreate} className="btn btn-primary btn-sm">
                        <IconPlus size={14} /> Nuevo proveedor
                    </button>
                </div>
            </div>

            <div style={{ position: 'relative', marginBottom: 16 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}>
                    <IconSearch size={14} />
                </span>
                <input
                    className="input input-sm"
                    placeholder="Buscar por nombre, NIT o teléfono..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: 30 }}
                />
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 32, justifyContent: 'center', color: '#94a3b8' }}>
                    <IconSpinner size={16} /> Cargando...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
                    {search ? 'No se encontraron proveedores' : 'Aún no hay proveedores. Crea el primero.'}
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>NIT</th>
                                <th>Contacto</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th style={{ width: 80 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                                    <td style={{ color: '#64748b' }}>{s.nit || '—'}</td>
                                    <td style={{ color: '#64748b' }}>{s.contact || '—'}</td>
                                    <td style={{ color: '#64748b' }}>{s.phone || '—'}</td>
                                    <td style={{ color: '#64748b' }}>{s.email || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button onClick={() => openEdit(s)} className="btn btn-ghost btn-icon btn-sm">
                                                <IconEdit size={13} />
                                            </button>
                                            <button onClick={() => handleDelete(s)} className="btn btn-ghost btn-icon btn-sm" style={{ color: '#ef4444' }}>
                                                <IconTrash size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal !== 'none' && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.2s ease-out' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                {modal === 'edit' ? 'Editar proveedor' : 'Nuevo proveedor'}
                            </h3>
                            <button onClick={closeModal} className="btn btn-ghost btn-icon btn-sm"><IconX size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="label">Nombre *</label>
                                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre del proveedor" />
                            </div>
                            <div className="form-row form-row-2">
                                <div className="form-group">
                                    <label className="label">NIT</label>
                                    <input className="input" value={form.nit} onChange={e => set('nit', e.target.value)} placeholder="900.123.456-7" />
                                </div>
                                <div className="form-group">
                                    <label className="label">Teléfono</label>
                                    <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="300 123 4567" />
                                </div>
                            </div>
                            <div className="form-row form-row-2">
                                <div className="form-group">
                                    <label className="label">Persona de contacto</label>
                                    <input className="input" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Nombre del contacto" />
                                </div>
                                <div className="form-group">
                                    <label className="label">Email</label>
                                    <input className="input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="proveedor@email.com" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">Dirección</label>
                                <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Dirección del proveedor" />
                            </div>
                            {error && <div className="alert alert-error">{error}</div>}
                        </div>
                        <div className="modal-footer">
                            <button onClick={closeModal} className="btn btn-secondary">Cancelar</button>
                            <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ gap: 8 }}>
                                {saving ? <><IconSpinner size={14} /> Guardando...</> : modal === 'edit' ? 'Guardar cambios' : 'Crear proveedor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
