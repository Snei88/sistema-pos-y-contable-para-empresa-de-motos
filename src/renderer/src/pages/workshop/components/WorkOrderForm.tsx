// src/renderer/src/pages/workshop/components/WorkOrderForm.tsx
import { useState, useEffect } from 'react'
import type { WorkOrder, Mechanic, Product } from '../../../../../shared/types/index'
import { IconX, IconSpinner, IconPlus } from '../../../components/shared/Icons'

interface Props {
    workOrder: WorkOrder | null
    mechanics: Mechanic[]
    onSave: (data: any) => Promise<void>
    onClose: () => void
}

interface LineItem {
    id: string
    type: 'repuesto' | 'mano_obra' | 'otro'
    productId?: number
    description: string
    quantity: number
    unitPrice: number
}

type MotoMode = 'search' | 'create'
type MechanicMode = 'select' | 'create'

export default function WorkOrderForm({ workOrder, mechanics, onSave, onClose }: Props) {
    // ── Moto ────────────────────────────────────────────────
    const [motoMode, setMotoMode] = useState<MotoMode>('search')
    const [motoSearch, setMotoSearch] = useState('')
    const [motoResults, setMotoResults] = useState<any[]>([])
    const [selectedMoto, setSelectedMoto] = useState<any>(null)
    // nueva moto inline
    const [newPlate, setNewPlate] = useState('')
    const [newBrand, setNewBrand] = useState('')
    const [newModel, setNewModel] = useState('')
    const [newYear, setNewYear] = useState('')
    const [creatingMoto, setCreatingMoto] = useState(false)

    // ── Mecánico ─────────────────────────────────────────────
    const [mechanicMode, setMechanicMode] = useState<MechanicMode>('select')
    const [mechanicId, setMechanicId] = useState('')
    const [newMechanicName, setNewMechanicName] = useState('')
    const [newMechanicPhone, setNewMechanicPhone] = useState('')
    const [creatingMechanic, setCreatingMechanic] = useState(false)

    // ── Campos principales ──────────────────────────────────
    const [description, setDescription] = useState('')
    const [diagnosis, setDiagnosis] = useState('')
    const [estimatedDelivery, setEstimatedDelivery] = useState('')
    const [notes, setNotes] = useState('')

    // ── Items ────────────────────────────────────────────────
    const [items, setItems] = useState<LineItem[]>([])
    const [productSearch, setProductSearch] = useState('')
    const [productResults, setProductResults] = useState<Product[]>([])
    // item manual (repuesto o mano de obra)
    const [showItemForm, setShowItemForm] = useState(false)
    const [itemType, setItemType] = useState<'repuesto' | 'mano_obra'>('mano_obra')
    const [itemDesc, setItemDesc] = useState('')
    const [itemPrice, setItemPrice] = useState('')
    const [itemQty, setItemQty] = useState('1')

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (workOrder) {
            setSelectedMoto({ id: workOrder.motorcycleId, plate: workOrder.plate, brand: workOrder.brand, model: workOrder.model })
            setMechanicId(workOrder.mechanicId ? String(workOrder.mechanicId) : '')
            setDescription(workOrder.description)
            setDiagnosis(workOrder.diagnosis || '')
            setEstimatedDelivery(workOrder.estimatedDelivery || '')
            setNotes(workOrder.notes || '')
            loadItems(workOrder.id)
        }
    }, [workOrder])

    async function loadItems(woId: number) {
        const res = await window.api.getWorkOrder(woId)
        if (res.success && res.data?.items) {
            setItems(res.data.items.map((i: any) => ({
                id: crypto.randomUUID(), type: i.type, productId: i.productId,
                description: i.description, quantity: i.quantity, unitPrice: i.unitPrice,
            })))
        }
    }

    async function searchMotos(query: string) {
        if (query.length < 2) { setMotoResults([]); return }
        const res = await window.api.searchMotos(query)
        if (res.success && res.data) setMotoResults(res.data)
    }

    async function searchProducts(query: string) {
        if (query.length < 2) { setProductResults([]); return }
        const res = await window.api.searchProducts(query)
        if (res.success && res.data) setProductResults(res.data)
    }

    function selectMoto(moto: any): void {
        setSelectedMoto(moto); setMotoSearch(''); setMotoResults([])
    }

    async function handleCreateMoto(): Promise<void> {
        if (!newPlate.trim() || !newBrand.trim() || !newModel.trim()) return
        setCreatingMoto(true)
        const res = await window.api.createMoto({
            plate: newPlate.trim().toUpperCase(),
            brand: newBrand.trim(),
            model: newModel.trim(),
            year: newYear ? Number(newYear) : undefined,
        })
        if (res.success && res.data) {
            selectMoto(res.data)
            setMotoMode('search')
            setNewPlate(''); setNewBrand(''); setNewModel(''); setNewYear('')
        } else {
            alert(res.error ?? 'Error al crear la moto')
        }
        setCreatingMoto(false)
    }

    async function handleCreateMechanic(): Promise<void> {
        if (!newMechanicName.trim()) return
        setCreatingMechanic(true)
        const res = await window.api.createMechanic({ name: newMechanicName.trim(), phone: newMechanicPhone.trim() || undefined })
        if (res.success) {
            const listRes = await window.api.listMechanics()
            if (listRes.success && listRes.data) {
                const created = (listRes.data as Mechanic[]).find(m => m.name === newMechanicName.trim())
                if (created) setMechanicId(String(created.id))
            }
            setMechanicMode('select')
            setNewMechanicName(''); setNewMechanicPhone('')
        } else {
            alert(res.error ?? 'Error al crear el mecánico')
        }
        setCreatingMechanic(false)
    }

    function addProductItem(product: Product): void {
        setItems([...items, { id: crypto.randomUUID(), type: 'repuesto', productId: product.id, description: product.name, quantity: 1, unitPrice: product.salePrice }])
        setProductSearch(''); setProductResults([])
    }

    function addManualItem(): void {
        if (!itemDesc.trim()) return
        const price = parseFloat(itemPrice) || 0
        const qty = parseFloat(itemQty) || 1
        setItems([...items, { id: crypto.randomUUID(), type: itemType, description: itemDesc.trim(), quantity: qty, unitPrice: price }])
        setItemDesc(''); setItemPrice(''); setItemQty('1'); setShowItemForm(false)
    }

    function updateItem(id: string, field: string, value: any): void {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))
    }

    function removeItem(id: string): void {
        setItems(items.filter(i => i.id !== id))
    }

    function validate(): boolean {
        const e: Record<string, string> = {}
        if (!selectedMoto) e.moto = 'Selecciona o registra una moto'
        if (!description.trim()) e.description = 'Descripción requerida'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        if (!validate()) return
        setSaving(true)
        await onSave({
            motorcycleId: selectedMoto.id,
            clientId: selectedMoto.clientId,
            mechanicId: mechanicId ? Number(mechanicId) : undefined,
            description: description.trim(),
            diagnosis: diagnosis.trim() || undefined,
            estimatedDelivery: estimatedDelivery || undefined,
            notes: notes.trim() || undefined,
            items: items.map(i => ({ type: i.type, productId: i.productId, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
        })
        setSaving(false)
    }

    const total = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0)

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.2s ease-out' }}>
                <div className="modal-header">
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                        {workOrder ? 'Editar orden de trabajo' : 'Nueva orden de trabajo'}
                    </h3>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
                        <IconX size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="modal-body">

                        {/* ── MOTO ─────────────────────────────────────── */}
                        <div className="form-group">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                <label className="label" style={{ margin: 0 }}>Moto</label>
                                {!selectedMoto && (
                                    <button
                                        type="button"
                                        onClick={() => setMotoMode(m => m === 'create' ? 'search' : 'create')}
                                        style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        {motoMode === 'create' ? '← Buscar existente' : '+ Registrar nueva moto'}
                                    </button>
                                )}
                            </div>

                            {selectedMoto ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                    <span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'monospace' }}>{selectedMoto.plate}</span>
                                    <span style={{ color: '#64748b' }}>{selectedMoto.brand} {selectedMoto.model}</span>
                                    <button type="button" onClick={() => { setSelectedMoto(null); setMotoMode('search') }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                        Cambiar
                                    </button>
                                </div>
                            ) : motoMode === 'search' ? (
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input"
                                        value={motoSearch}
                                        onChange={e => { setMotoSearch(e.target.value); searchMotos(e.target.value) }}
                                        placeholder="Buscar por placa, marca o modelo..."
                                        style={{ borderColor: errors.moto ? '#ef4444' : undefined }}
                                    />
                                    {motoResults.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxHeight: 200, overflow: 'auto', zIndex: 100, marginTop: 4 }}>
                                            {motoResults.map(m => (
                                                <div key={m.id} onClick={() => selectMoto(m)}
                                                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{m.plate}</span>
                                                    <span style={{ color: '#64748b', fontSize: 12 }}>{m.brand} {m.model}{m.clientName ? ` · ${m.clientName}` : ''}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {motoSearch.length >= 2 && motoResults.length === 0 && (
                                        <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
                                            No encontrada. <button type="button" onClick={() => { setMotoMode('create'); setNewPlate(motoSearch.toUpperCase()) }} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Registrar nueva moto</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* ── CREAR MOTO INLINE ── */
                                <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px dashed #cbd5e1' }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', margin: '0 0 10px' }}>Registrar nueva moto</p>
                                    <div className="form-row form-row-2" style={{ marginBottom: 8 }}>
                                        <div className="form-group">
                                            <label className="label">Placa *</label>
                                            <input className="input input-sm" value={newPlate} onChange={e => setNewPlate(e.target.value.toUpperCase())} placeholder="ABC123" />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Año</label>
                                            <input className="input input-sm" type="number" value={newYear} onChange={e => setNewYear(e.target.value)} placeholder="2020" />
                                        </div>
                                    </div>
                                    <div className="form-row form-row-2">
                                        <div className="form-group">
                                            <label className="label">Marca *</label>
                                            <input className="input input-sm" value={newBrand} onChange={e => setNewBrand(e.target.value)} placeholder="Honda, Yamaha..." />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Modelo *</label>
                                            <input className="input input-sm" value={newModel} onChange={e => setNewModel(e.target.value)} placeholder="CBR 150..." />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                        <button type="button" onClick={handleCreateMoto} disabled={creatingMoto || !newPlate || !newBrand || !newModel} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
                                            {creatingMoto ? <><IconSpinner size={12} /> Registrando...</> : 'Registrar y usar'}
                                        </button>
                                        <button type="button" onClick={() => setMotoMode('search')} className="btn btn-secondary btn-sm">Cancelar</button>
                                    </div>
                                </div>
                            )}
                            {errors.moto && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.moto}</span>}
                        </div>

                        {/* ── MECÁNICO ─────────────────────────────────── */}
                        <div className="form-row form-row-2">
                            <div className="form-group">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <label className="label" style={{ margin: 0 }}>Mecánico</label>
                                    <button
                                        type="button"
                                        onClick={() => setMechanicMode(m => m === 'create' ? 'select' : 'create')}
                                        style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        {mechanicMode === 'create' ? '← Lista' : '+ Crear nuevo'}
                                    </button>
                                </div>
                                {mechanicMode === 'select' ? (
                                    <select className="select" value={mechanicId} onChange={e => setMechanicId(e.target.value)}>
                                        <option value="">Sin asignar</option>
                                        {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                ) : (
                                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <input className="input input-sm" value={newMechanicName} onChange={e => setNewMechanicName(e.target.value)} placeholder="Nombre del mecánico *" />
                                        <input className="input input-sm" value={newMechanicPhone} onChange={e => setNewMechanicPhone(e.target.value)} placeholder="Teléfono (opcional)" />
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button type="button" onClick={handleCreateMechanic} disabled={creatingMechanic || !newMechanicName.trim()} className="btn btn-primary btn-sm" style={{ gap: 4, flex: 1 }}>
                                                {creatingMechanic ? <IconSpinner size={11} /> : <IconPlus size={11} />}
                                                {creatingMechanic ? 'Creando...' : 'Crear y asignar'}
                                            </button>
                                            <button type="button" onClick={() => setMechanicMode('select')} className="btn btn-secondary btn-sm">✕</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="label">Entrega estimada</label>
                                <input className="input" type="date" value={estimatedDelivery} onChange={e => setEstimatedDelivery(e.target.value)} />
                            </div>
                        </div>

                        {/* ── DESCRIPCIÓN ─────────────────────────────── */}
                        <div className="form-group">
                            <label className="label">Descripción del trabajo *</label>
                            <textarea
                                className="textarea"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="¿Qué se va a hacer?"
                                rows={3}
                                style={{ borderColor: errors.description ? '#ef4444' : undefined }}
                            />
                            {errors.description && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.description}</span>}
                        </div>

                        <div className="form-group">
                            <label className="label">Diagnóstico</label>
                            <textarea className="textarea" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Diagnóstico técnico..." rows={2} />
                        </div>

                        {/* ── ITEMS ────────────────────────────────────── */}
                        <div className="form-group">
                            <label className="label">Repuestos y servicios</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                        className="input"
                                        value={productSearch}
                                        onChange={e => { setProductSearch(e.target.value); searchProducts(e.target.value) }}
                                        placeholder="Buscar repuesto del inventario..."
                                    />
                                    {productResults.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxHeight: 200, overflow: 'auto', zIndex: 100, marginTop: 4 }}>
                                            {productResults.map(p => (
                                                <div key={p.id} onClick={() => addProductItem(p)}
                                                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                                    <span style={{ fontSize: 13 }}>{p.name}</span>
                                                    <span style={{ color: '#64748b', fontSize: 12 }}>${p.salePrice.toLocaleString('es-CO')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setShowItemForm(!showItemForm); setItemType('repuesto') }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ whiteSpace: 'nowrap', gap: 5 }}
                                >
                                    <IconPlus size={12} /> Repuesto manual
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowItemForm(!showItemForm); setItemType('mano_obra') }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ whiteSpace: 'nowrap', gap: 5 }}
                                >
                                    <IconPlus size={12} /> Mano de obra
                                </button>
                            </div>

                            {showItemForm && (
                                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 6, flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                                        {(['repuesto', 'mano_obra'] as const).map(t => (
                                            <button key={t} type="button" onClick={() => setItemType(t)}
                                                style={{ padding: '4px 10px', borderRadius: 6, border: `1.5px solid ${itemType === t ? '#16a34a' : '#e2e8f0'}`, background: itemType === t ? '#f0fdf4' : '#fff', color: itemType === t ? '#16a34a' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                                {t === 'repuesto' ? 'Repuesto' : 'Mano de obra'}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="form-group" style={{ flex: 3, minWidth: 160 }}>
                                        <label className="label">Descripción</label>
                                        <input className="input input-sm" value={itemDesc} onChange={e => setItemDesc(e.target.value)} placeholder={itemType === 'repuesto' ? 'Ej: Filtro de aire' : 'Ej: Cambio de aceite'} />
                                    </div>
                                    <div className="form-group" style={{ flex: 1, minWidth: 60 }}>
                                        <label className="label">Cant.</label>
                                        <input className="input input-sm" type="number" min={1} value={itemQty} onChange={e => setItemQty(e.target.value)} placeholder="1" />
                                    </div>
                                    <div className="form-group" style={{ flex: 1, minWidth: 80 }}>
                                        <label className="label">Valor ($)</label>
                                        <input className="input input-sm" type="number" value={itemPrice} onChange={e => setItemPrice(e.target.value)} placeholder="0" />
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button type="button" onClick={addManualItem} disabled={!itemDesc.trim()} className="btn btn-primary btn-sm">Agregar</button>
                                        <button type="button" onClick={() => setShowItemForm(false)} className="btn btn-secondary btn-sm">✕</button>
                                    </div>
                                </div>
                            )}

                            {items.length > 0 && (
                                <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginTop: 6 }}>
                                    {items.map(item => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 600, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap',
                                                background: item.type === 'repuesto' ? '#dbeafe' : '#d1fae5',
                                                color: item.type === 'repuesto' ? '#1e40af' : '#065f46',
                                            }}>{item.type === 'repuesto' ? 'Repuesto' : 'M. Obra'}</span>
                                            <span style={{ flex: 1, fontSize: 13 }}>{item.description}</span>
                                            <input type="number" value={item.quantity}
                                                onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                style={{ width: 50, padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, outline: 'none', textAlign: 'center' }} />
                                            <input type="number" value={item.unitPrice}
                                                onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                style={{ width: 90, padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, outline: 'none', textAlign: 'right' }} />
                                            <span style={{ width: 90, textAlign: 'right', fontWeight: 600, fontSize: 13 }}>
                                                ${(item.quantity * item.unitPrice).toLocaleString('es-CO')}
                                            </span>
                                            <button type="button" onClick={() => removeItem(item.id)}
                                                style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 4, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <IconX size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <div style={{ textAlign: 'right', paddingTop: 10, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                                        Total: ${total.toLocaleString('es-CO')}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="label">Notas internas</label>
                            <textarea className="textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas para el taller..." rows={2} />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button type="submit" disabled={saving} className="btn btn-primary" style={{ gap: 8 }}>
                            {saving ? <><IconSpinner size={14} /> Guardando...</> : workOrder ? 'Guardar cambios' : 'Crear OT'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
