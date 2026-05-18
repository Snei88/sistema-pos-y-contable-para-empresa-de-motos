// src/renderer/src/pages/pos/components/PendingSalesModal.tsx
import { IconX, IconPause, IconPackage, IconPlay, IconTrash, IconLink } from '../../../components/shared/Icons'

interface PendingSale {
    id: string
    cart: any[]
    client: any
    globalDiscount: number
    notes: string
    createdAt: string
}

interface Props {
    sales: PendingSale[]
    onResume: (sale: PendingSale) => void
    onDelete: (id: string) => void
    onWhatsapp: (sale: PendingSale) => void
    onClose: () => void
}

export default function PendingSalesModal({ sales, onResume, onDelete, onWhatsapp, onClose }: Props) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.2s ease-out' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef9c3', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconPause size={16} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Ventas pendientes</p>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{sales.length} guardada{sales.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
                        <IconX size={16} />
                    </button>
                </div>

                <div style={{ overflow: 'auto', flex: 1, padding: '0 24px 24px' }}>
                    {sales.length === 0 ? (
                        <div className="empty-state" style={{ padding: '48px 0' }}>
                            <div className="empty-state-icon"><IconPackage size={36} /></div>
                            <p className="empty-state-title">Sin ventas pendientes</p>
                            <p className="empty-state-text">Las ventas pausadas aparecerán aquí</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16 }}>
                            {sales.map(sale => {
                                const total = sale.cart.reduce((sum: number, item: any) =>
                                    sum + (item.unitPrice * item.quantity) - item.discount, 0
                                ) - (sale.globalDiscount || 0)
                                return (
                                    <div key={sale.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', margin: 0 }}>
                                                    {sale.client?.name || 'Cliente ocasional'}
                                                </p>
                                                <p style={{ fontSize: 12, color: '#64748b', marginTop: 2, marginBottom: 0 }}>
                                                    {sale.cart.length} item{sale.cart.length !== 1 ? 's' : ''} · {new Date(sale.createdAt).toLocaleTimeString('es-CO')}
                                                </p>
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                                                ${total.toLocaleString('es-CO')}
                                            </span>
                                        </div>

                                        {sale.cart.length > 0 && (
                                            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, marginBottom: 0 }}>
                                                {sale.cart.slice(0, 3).map((item: any) => item.name).join(', ')}
                                                {sale.cart.length > 3 && ` +${sale.cart.length - 3} más`}
                                            </p>
                                        )}

                                        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => onDelete(sale.id)}
                                                className="btn btn-ghost btn-sm"
                                                style={{ color: '#ef4444', gap: 6 }}
                                            >
                                                <IconTrash size={13} /> Eliminar
                                            </button>
                                            <button
                                                onClick={() => onWhatsapp(sale)}
                                                className="btn btn-secondary btn-sm"
                                                style={{ gap: 6 }}
                                            >
                                                <IconLink size={13} /> WhatsApp
                                            </button>
                                            <button
                                                onClick={() => onResume(sale)}
                                                className="btn btn-primary btn-sm"
                                                style={{ gap: 6 }}
                                            >
                                                <IconPlay size={13} /> Continuar
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

