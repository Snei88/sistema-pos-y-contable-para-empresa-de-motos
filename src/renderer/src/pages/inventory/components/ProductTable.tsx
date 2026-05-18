// src/renderer/src/pages/inventory/components/ProductTable.tsx
import type { Product } from '../../../../../shared/types/index'
import { IconEdit, IconTrash, IconHistory, IconArrowUp, IconAlertTriangle, IconPackage } from '../../../components/shared/Icons'

interface Props {
    products: Product[]
    onEdit: (p: Product) => void
    onDelete: (p: Product) => void
    onAdjust: (p: Product) => void
    onKardex: (p: Product) => void
}

const COP = (n: number): string =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function ProductTable({ products, onEdit, onDelete, onAdjust, onKardex }: Props) {
    if (products.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon"><IconPackage size={36} /></div>
                <p className="empty-state-title">No hay productos</p>
                <p className="empty-state-text">Crea el primer producto o ajusta los filtros de búsqueda</p>
            </div>
        )
    }

    return (
        <div className="table-wrap">
            <table className="table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Costo</th>
                        <th>Precio venta</th>
                        <th>Stock</th>
                        <th>Estado</th>
                        <th style={{ width: 130 }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => {
                        const stockLow = p.stock <= p.minStock
                        const outOfStock = p.stock === 0
                        return (
                            <tr key={p.id}>
                                <td>
                                    <code style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#475569', fontFamily: 'monospace' }}>
                                        {p.code}
                                    </code>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{p.name}</div>
                                    {p.barcode && (
                                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.barcode}</div>
                                    )}
                                </td>
                                <td>
                                    {p.categoryName
                                        ? <span className="badge badge-gray">{p.categoryName}</span>
                                        : <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                                    }
                                </td>
                                <td style={{ color: '#64748b', fontWeight: 500 }}>{COP(p.costPrice)}</td>
                                <td style={{ fontWeight: 700, color: '#0f172a' }}>{COP(p.salePrice)}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className={`badge ${outOfStock ? 'badge-red' : stockLow ? 'badge-yellow' : 'badge-green'}`}>
                                            {p.stock} {p.unit}
                                        </span>
                                        {stockLow && !outOfStock && (
                                            <IconAlertTriangle size={13} style={{ color: '#d97706' }} title={`Mínimo: ${p.minStock}`} />
                                        )}
                                        {outOfStock && (
                                            <IconAlertTriangle size={13} style={{ color: '#dc2626' }} title="Sin stock" />
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                                        {p.status === 'active' ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button
                                            onClick={() => onKardex(p)}
                                            className="btn btn-ghost btn-sm btn-icon"
                                            title="Ver Kardex"
                                        >
                                            <IconHistory size={14} />
                                        </button>
                                        <button
                                            onClick={() => onAdjust(p)}
                                            className="btn btn-ghost btn-sm btn-icon"
                                            title="Ajustar stock"
                                        >
                                            <IconArrowUp size={14} />
                                        </button>
                                        <button
                                            onClick={() => onEdit(p)}
                                            className="btn btn-ghost btn-sm btn-icon"
                                            title="Editar"
                                        >
                                            <IconEdit size={14} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(p)}
                                            className="btn btn-ghost btn-sm btn-icon"
                                            title="Eliminar"
                                            style={{ color: '#ef4444' }}
                                        >
                                            <IconTrash size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

