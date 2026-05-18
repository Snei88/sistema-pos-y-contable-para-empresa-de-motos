// src/renderer/src/pages/inventory/components/AdjustStockModal.tsx
import { useState } from 'react'
import type { Product } from '../../../../../shared/types/index'
import { IconX, IconSpinner, IconArrowUp, IconArrowDown } from '../../../components/shared/Icons'

interface Props {
    product: Product
    onAdjust: (data: any) => Promise<void>
    onClose: () => void
}

export default function AdjustStockModal({ product, onAdjust, onClose }: Props) {
    const [type, setType] = useState<'ajuste_suma' | 'ajuste_resta'>('ajuste_suma')
    const [quantity, setQuantity] = useState(1)
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)

    const preview = type === 'ajuste_suma' ? product.stock + quantity : product.stock - quantity

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        if (quantity <= 0) return
        setSaving(true)
        await onAdjust({ productId: product.id, type, quantity, notes: notes || undefined })
        setSaving(false)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.2s ease-out' }}>
                <div className="modal-header">
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Ajustar stock</h3>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
                        <IconX size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px' }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{product.name}</p>
                            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                                Stock actual: <strong>{product.stock} {product.unit}</strong>
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="label">Tipo de ajuste</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => setType('ajuste_suma')}
                                    style={{
                                        flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                                        border: `2px solid ${type === 'ajuste_suma' ? '#16a34a' : '#e2e8f0'}`,
                                        background: type === 'ajuste_suma' ? '#f0fdf4' : '#fff',
                                        color: type === 'ajuste_suma' ? '#16a34a' : '#64748b',
                                        fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <IconArrowUp size={14} /> Sumar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('ajuste_resta')}
                                    style={{
                                        flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                                        border: `2px solid ${type === 'ajuste_resta' ? '#dc2626' : '#e2e8f0'}`,
                                        background: type === 'ajuste_resta' ? '#fef2f2' : '#fff',
                                        color: type === 'ajuste_resta' ? '#dc2626' : '#64748b',
                                        fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <IconArrowDown size={14} /> Restar
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Cantidad</label>
                            <input
                                className="input"
                                type="number" min={1} value={quantity}
                                onChange={e => setQuantity(Number(e.target.value))}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">Motivo / Notas</label>
                            <input
                                className="input"
                                value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="Ej: Inventario físico, pérdida, daño..."
                            />
                        </div>

                        <div style={{
                            padding: '12px 16px', borderRadius: 8,
                            background: preview < 0 ? '#fef2f2' : '#f0fdf4',
                            border: `1px solid ${preview < 0 ? '#fecaca' : '#bbf7d0'}`,
                        }}>
                            <p style={{ fontSize: 13, margin: 0, color: preview < 0 ? '#dc2626' : '#15803d' }}>
                                Stock resultante: <strong>{preview} {product.unit}</strong>
                                {preview < 0 && ' — stock negativo no permitido'}
                            </p>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button type="submit" disabled={saving || preview < 0} className="btn btn-primary" style={{ gap: 8 }}>
                            {saving ? <><IconSpinner size={14} /> Guardando...</> : 'Aplicar ajuste'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

