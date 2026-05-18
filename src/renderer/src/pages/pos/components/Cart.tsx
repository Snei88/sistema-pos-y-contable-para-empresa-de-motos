// src/renderer/src/pages/pos/components/Cart.tsx
import { IconX } from '../../../components/shared/Icons'

interface CartItem {
    id: string
    name: string
    code?: string
    quantity: number
    unitPrice: number
    discount: number
    isManual: boolean
}

interface Props {
    items: CartItem[]
    onUpdateQty: (id: string, qty: number) => void
    onUpdatePrice: (id: string, price: number) => void
    onUpdateDiscount: (id: string, discount: number) => void
    onRemove: (id: string) => void
}

export default function Cart({ items, onUpdateQty, onUpdatePrice, onUpdateDiscount, onRemove }: Props) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, index) => {
                const subtotal = (item.unitPrice * item.quantity) - item.discount
                return (
                    <div key={item.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{
                                    width: 24, height: 24, borderRadius: 6, background: '#f1f5f9',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 700, color: '#64748b', flexShrink: 0,
                                }}>{index + 1}</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {item.name}
                                        {item.isManual && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                                                background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4,
                                            }}>manual</span>
                                        )}
                                    </div>
                                    {item.code && <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.code}</div>}
                                </div>
                            </div>
                            <button
                                onClick={() => onRemove(item.id)}
                                style={{
                                    background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 6,
                                    width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <IconX size={13} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                                <label style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Cant
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <button
                                        onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                                        style={{ width: 32, height: 32, background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >−</button>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={e => onUpdateQty(item.id, parseFloat(e.target.value) || 0)}
                                        style={{ width: 50, height: 32, textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, fontWeight: 600, outline: 'none' }}
                                    />
                                    <button
                                        onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                                        style={{ width: 32, height: 32, background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >+</button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                                <label style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Precio
                                </label>
                                <input
                                    type="number"
                                    value={item.unitPrice}
                                    onChange={e => onUpdatePrice(item.id, parseFloat(e.target.value) || 0)}
                                    style={{
                                        height: 32, border: `1px solid ${item.isManual ? '#fcd34d' : '#e2e8f0'}`,
                                        borderRadius: 6, padding: '0 10px', fontSize: 14, fontWeight: 600, width: '100%', outline: 'none', boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                                <label style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Dto
                                </label>
                                <input
                                    type="number"
                                    value={item.discount}
                                    onChange={e => onUpdateDiscount(item.id, parseFloat(e.target.value) || 0)}
                                    style={{ height: 32, border: '1px solid #e2e8f0', borderRadius: 6, padding: '0 10px', fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                                <label style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Subtotal
                                </label>
                                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', height: 32, display: 'flex', alignItems: 'center' }}>
                                    ${subtotal.toLocaleString('es-CO')}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

