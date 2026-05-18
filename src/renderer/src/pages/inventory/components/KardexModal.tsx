// src/renderer/src/pages/inventory/components/KardexModal.tsx
import { useState, useEffect } from 'react'
import type { Product, StockMovement } from '../../../../../shared/types/index'

interface Props {
    product: Product
    onClose: () => void
}

const MOVEMENT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    entrada: { label: 'Entrada', color: '#16a34a', bg: '#f0fdf4' },
    salida: { label: 'Salida', color: '#dc2626', bg: '#fef2f2' },
    venta: { label: 'Venta', color: '#ea580c', bg: '#fff7ed' },
    compra: { label: 'Compra', color: '#2563eb', bg: '#eff6ff' },
    ajuste_suma: { label: 'Ajuste +', color: '#16a34a', bg: '#f0fdf4' },
    ajuste_resta: { label: 'Ajuste -', color: '#dc2626', bg: '#fef2f2' },
    devolucion: { label: 'Devolución', color: '#7c3aed', bg: '#f5f3ff' },
}

const COP = (n: number): string =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function KardexModal({ product, onClose }: Props) {
    const [movements, setMovements] = useState<StockMovement[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        window.api.movementsByProduct(product.id).then(r => {
            if (r.success) setMovements(r.data ?? [])
            setLoading(false)
        })
    }, [product.id])

    return (
        <div style={overlay}>
            <div style={modal}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            Kardex — {product.name}
                        </h3>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                            Stock actual: <strong>{product.stock} {product.unit}</strong>
                        </p>
                    </div>
                    <button onClick={onClose} style={btnClose}>✕</button>
                </div>

                {/* Tabla */}
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
                ) : movements.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                        <p style={{ fontSize: 13 }}>Sin movimientos registrados</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead style={{ position: 'sticky', top: 0, background: '#f8fafc' }}>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    {['Fecha', 'Tipo', 'Cantidad', 'Antes', 'Después', 'Costo', 'Referencia', 'Usuario'].map(h => (
                                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {movements.map((m, i) => {
                                    const meta = MOVEMENT_LABELS[m.type] ?? { label: m.type, color: '#64748b', bg: '#f8fafc' }
                                    const isPositive = ['entrada', 'ajuste_suma', 'devolucion', 'compra'].includes(m.type)
                                    return (
                                        <tr key={m.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={td}>{new Date(m.createdAt).toLocaleString('es-CO')}</td>
                                            <td style={td}>
                                                <span style={{ background: meta.bg, color: meta.color, borderRadius: 5, padding: '2px 7px', fontWeight: 600, fontSize: 11 }}>
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td style={{ ...td, fontWeight: 700, color: isPositive ? '#16a34a' : '#dc2626' }}>
                                                {isPositive ? '+' : '-'}{m.quantity}
                                            </td>
                                            <td style={{ ...td, color: '#64748b' }}>{m.stockBefore}</td>
                                            <td style={{ ...td, fontWeight: 600, color: '#0f172a' }}>{m.stockAfter}</td>
                                            <td style={td}>{m.costPrice != null ? COP(m.costPrice) : '—'}</td>
                                            <td style={{ ...td, color: '#64748b', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {m.reference ?? m.notes ?? '—'}
                                            </td>
                                            <td style={{ ...td, color: '#64748b' }}>{m.userName ?? '—'}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button onClick={onClose} style={btnSecondary}>Cerrar</button>
                </div>
            </div>
        </div>
    )
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }
const modal: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 860, maxHeight: '90vh', boxShadow: '0 16px 64px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }
const btnClose: React.CSSProperties = { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8' }
const btnSecondary: React.CSSProperties = { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }
const td: React.CSSProperties = { padding: '8px 12px', verticalAlign: 'middle' }
