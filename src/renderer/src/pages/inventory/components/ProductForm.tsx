// src/renderer/src/pages/inventory/components/ProductForm.tsx
import { useState } from 'react'
import type { Product, Category, Supplier } from '../../../../../shared/types/index'
import { UNITS } from '../../../../../shared/constants/index'
import { IconX, IconSpinner } from '../../../components/shared/Icons'

interface Props {
    product?: Product | null
    categories: Category[]
    suppliers: Supplier[]
    onSave: (data: any) => Promise<void>
    onClose: () => void
}

export default function ProductForm({ product, categories, suppliers, onSave, onClose }: Props) {
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        code: product?.code ?? '',
        barcode: product?.barcode ?? '',
        name: product?.name ?? '',
        description: product?.description ?? '',
        categoryId: product?.categoryId ?? '',
        supplierId: product?.supplierId ?? '',
        costPrice: product?.costPrice ?? 0,
        salePrice: product?.salePrice ?? 0,
        stock: product?.stock ?? 0,
        minStock: product?.minStock ?? 3,
        unit: product?.unit ?? 'und',
        status: product?.status ?? 'active',
    })

    function set(key: string, value: any): void {
        setForm(f => ({ ...f, [key]: value }))
    }

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        setSaving(true)
        await onSave({
            ...form,
            costPrice: Number(form.costPrice),
            salePrice: Number(form.salePrice),
            stock: Number(form.stock),
            minStock: Number(form.minStock),
            categoryId: form.categoryId ? Number(form.categoryId) : null,
            supplierId: form.supplierId ? Number(form.supplierId) : null,
        })
        setSaving(false)
    }

    const isEdit = Boolean(product)
    const margin = form.costPrice > 0 && form.salePrice > 0
        ? (((Number(form.salePrice) - Number(form.costPrice)) / Number(form.salePrice)) * 100).toFixed(1)
        : null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.2s ease-out' }}>
                <div className="modal-header">
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                        {isEdit ? 'Editar producto' : 'Nuevo producto'}
                    </h3>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
                        <IconX size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="modal-body">
                        <div className="form-row form-row-2">
                            <div className="form-group">
                                <label className="label">Código *</label>
                                <input className="input" value={form.code} onChange={e => set('code', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="label">Código de barras</label>
                                <input className="input" value={form.barcode} onChange={e => set('barcode', e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Nombre *</label>
                            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <label className="label">Descripción</label>
                            <input className="input" value={form.description} onChange={e => set('description', e.target.value)} />
                        </div>

                        <div className="form-row form-row-2">
                            <div className="form-group">
                                <label className="label">Categoría</label>
                                <select className="select" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                                    <option value="">Sin categoría</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Proveedor</label>
                                <select className="select" value={form.supplierId} onChange={e => set('supplierId', e.target.value)}>
                                    <option value="">Sin proveedor</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-row form-row-2">
                            <div className="form-group">
                                <label className="label">Costo ($) *</label>
                                <input className="input" type="number" min={0} step={1} value={form.costPrice}
                                    onChange={e => set('costPrice', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="label">Precio de venta ($) *</label>
                                <input className="input" type="number" min={0} step={1} value={form.salePrice}
                                    onChange={e => set('salePrice', e.target.value)} required />
                            </div>
                        </div>

                        {margin !== null && (
                            <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#374151' }}>
                                Margen estimado: <strong style={{ color: '#16a34a' }}>{margin}%</strong>
                            </div>
                        )}

                        <div className="form-row form-row-2">
                            {!isEdit && (
                                <div className="form-group">
                                    <label className="label">Stock inicial</label>
                                    <input className="input" type="number" min={0} value={form.stock}
                                        onChange={e => set('stock', e.target.value)} />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="label">Stock mínimo</label>
                                <input className="input" type="number" min={0} value={form.minStock}
                                    onChange={e => set('minStock', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="label">Unidad</label>
                                <select className="select" value={form.unit} onChange={e => set('unit', e.target.value)}>
                                    {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Estado</label>
                            <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
                                <option value="active">Activo</option>
                                <option value="inactive">Inactivo</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button type="submit" disabled={saving} className="btn btn-primary" style={{ gap: 8 }}>
                            {saving ? <><IconSpinner size={14} /> Guardando...</> : isEdit ? 'Guardar cambios' : 'Crear producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

