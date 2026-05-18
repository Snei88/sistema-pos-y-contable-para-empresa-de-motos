// src/renderer/src/pages/pos/PosPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product, Client, CashSession } from '../../../../shared/types/index'
import ProductSearch from './components/ProductSearch'
import Cart from './components/Cart'
import PaymentModal from './components/PaymentModal'
import PendingSalesModal from './components/PendingSalesModal'
import {
    IconShoppingCart, IconPause, IconCash, IconUser,
    IconX, IconCheckCircle, IconPrint, IconTag, IconLink,
} from '../../components/shared/Icons'

interface CartItem {
    id: string
    productId?: number
    name: string
    code?: string
    quantity: number
    unitPrice: number
    costPrice: number
    discount: number
    isManual: boolean
}

export default function PosPage() {
    const navigate = useNavigate()
    const [cashSession, setCashSession] = useState<CashSession | null>(null)
    const [cart, setCart] = useState<CartItem[]>([])
    const [client, setClient] = useState<Client | null>(null)
    const [globalDiscount, setGlobalDiscount] = useState(0)
    const [notes, setNotes] = useState('')
    const [showPayment, setShowPayment] = useState(false)
    const [showPending, setShowPending] = useState(false)
    const [pendingSales, setPendingSales] = useState<any[]>([])
    const [lastSale, setLastSale] = useState<any>(null)
    const [discountInput, setDiscountInput] = useState('')
    const [showDiscountInput, setShowDiscountInput] = useState(false)
    const [showManualModal, setShowManualModal] = useState(false)
    const [manualName, setManualName] = useState('')
    const [manualPrice, setManualPrice] = useState('')
    const [showClientInput, setShowClientInput] = useState(false)
    const [clientQuery, setClientQuery] = useState('')
    const [clientResults, setClientResults] = useState<Client[]>([])
    const searchRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        checkCashSession()
        loadPendingSales()
        setTimeout(() => searchRef.current?.focus(), 100)
    }, [])

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus() }
            if (e.key === 'F4') { e.preventDefault(); clearCart() }
            if (e.key === 'F8' && cart.length > 0) { e.preventDefault(); setShowPayment(true) }
            if (e.key === 'F6') { e.preventDefault(); holdSale() }
            if (e.key === 'Escape') { if (showPayment) setShowPayment(false) }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [cart, showPayment])

    async function checkCashSession() {
        const res = await window.api.currentCash()
        if (res.success) setCashSession(res.data ?? null)
    }

    function loadPendingSales() {
        const stored = localStorage.getItem('mm_pending_sales')
        if (stored) setPendingSales(JSON.parse(stored))
    }

    function savePendingSales(sales: any[]) {
        localStorage.setItem('mm_pending_sales', JSON.stringify(sales))
        setPendingSales(sales)
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity) - item.discount, 0)
    const total = Math.max(0, subtotal - globalDiscount)

    function addToCart(product: Product, qty = 1): void {
        const existing = cart.find(c => c.productId === product.id)
        if (existing) {
            setCart(cart.map(c => c.productId === product.id ? { ...c, quantity: c.quantity + qty } : c))
        } else {
            setCart([...cart, {
                id: crypto.randomUUID(), productId: product.id, name: product.name,
                code: product.code, quantity: qty, unitPrice: product.salePrice,
                costPrice: product.costPrice, discount: 0, isManual: false,
            }])
        }
    }

    function addManualItem(): void {
        setManualName('')
        setManualPrice('')
        setShowManualModal(true)
    }

    function confirmManualItem(): void {
        const name = manualName.trim()
        if (!name) return
        const price = parseFloat(manualPrice)
        if (isNaN(price) || price <= 0) return
        setCart([...cart, {
            id: crypto.randomUUID(), name, quantity: 1,
            unitPrice: price, costPrice: 0, discount: 0, isManual: true,
        }])
        setShowManualModal(false)
    }

    async function searchClients(query: string): Promise<void> {
        setClientQuery(query)
        if (query.length < 2) { setClientResults([]); return }
        const res = await window.api.searchClients(query)
        if (res.success && res.data) setClientResults(res.data)
    }

    function selectClient(c: Client): void {
        setClient(c)
        setShowClientInput(false)
        setClientQuery('')
        setClientResults([])
    }

    function updateQuantity(id: string, qty: number): void {
        if (qty <= 0) { removeItem(id); return }
        setCart(cart.map(c => c.id === id ? { ...c, quantity: qty } : c))
    }
    function updatePrice(id: string, price: number): void {
        setCart(cart.map(c => c.id === id ? { ...c, unitPrice: price } : c))
    }
    function updateItemDiscount(id: string, discount: number): void {
        setCart(cart.map(c => c.id === id ? { ...c, discount } : c))
    }
    function removeItem(id: string): void {
        setCart(cart.filter(c => c.id !== id))
    }
    async function clearCart(): Promise<void> {
        const confirmed = await window.appConfirm?.('¿Vaciar el carrito?', {
            title: 'Vaciar carrito',
            confirmText: 'Vaciar',
            variant: 'warning',
        })
        if (!confirmed) return
        setCart([]); setClient(null); setGlobalDiscount(0); setNotes('')
    }
    function holdSale(): void {
        if (cart.length === 0) return
        const sale = { id: crypto.randomUUID(), cart: [...cart], client, globalDiscount, notes, createdAt: new Date().toISOString() }
        savePendingSales([...pendingSales, sale])
        setCart([]); setClient(null); setGlobalDiscount(0); setNotes('')
    }
    function resumePending(sale: any): void {
        setCart(sale.cart); setClient(sale.client)
        setGlobalDiscount(sale.globalDiscount || 0); setNotes(sale.notes || '')
        savePendingSales(pendingSales.filter(p => p.id !== sale.id))
        setShowPending(false)
    }
    async function handleSaleComplete(payments: any[]): Promise<any> {
        const saleData = {
            clientId: client?.id, clientName: client?.name,
            items: cart.map(c => ({
                productId: c.productId, productName: c.name, productCode: c.code,
                quantity: c.quantity, unitPrice: c.unitPrice, costPrice: c.costPrice,
                discount: c.discount, isManual: c.isManual,
            })),
            payments, discount: globalDiscount, tax: 0, notes: notes || undefined,
        }
        const res = await window.api.createSale(saleData)
        if (res.success && res.data) {
            setLastSale(res.data); setCart([]); setClient(null)
            setGlobalDiscount(0); setNotes('')
            return res.data
        } else {
            alert(res.error || 'Error al procesar la venta')
            return null
        }
    }
    // Estado: caja cerrada
    if (!cashSession) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '70vh', gap: 14,
            }}>
                <div style={{
                    width: 64, height: 64, borderRadius: 18, background: '#fef3c7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <IconCash size={30} style={{ color: '#d97706' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Caja cerrada</h2>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Debes abrir caja antes de realizar ventas
                    </p>
                </div>
                <button onClick={() => navigate('/cash')} className="btn btn-primary">
                    Ir a Caja
                </button>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 58px - 44px)', margin: '-22px -24px', background: '#f8fafc' }}>

            {/* Header POS */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px', height: 52,
                background: '#fff', borderBottom: '1px solid #e2e8f0',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} className="animate-pulse-ring" />
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                            Caja: <strong style={{ color: '#0f172a' }}>{cashSession.userName}</strong>
                        </span>
                    </div>
                    <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        F2: Buscar &nbsp;|&nbsp; F6: Pendiente &nbsp;|&nbsp; F8: Pagar
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => setShowPending(true)}
                        className="btn btn-secondary btn-sm"
                        style={{ position: 'relative' }}
                    >
                        <IconPause size={14} />
                        Pendientes
                        {pendingSales.length > 0 && (
                            <span style={{
                                position: 'absolute', top: -6, right: -6,
                                background: '#ef4444', color: '#fff',
                                fontSize: 10, fontWeight: 700, width: 18, height: 18,
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {pendingSales.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Layout principal */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Panel izquierdo */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #e2e8f0' }}>

                    {/* Búsqueda */}
                    <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                        <ProductSearch ref={searchRef} onSelect={addToCart} onManual={addManualItem} />
                    </div>

                    {/* Cliente */}
                    <div style={{
                        padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f1f5f9',
                        display: 'flex', alignItems: 'center', minHeight: 44,
                    }}>
                        {client ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <IconUser size={14} style={{ color: '#3b82f6' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{client.name}</span>
                                    {(client as any).document && (
                                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>{(client as any).document}</span>
                                    )}
                                    {(client as any).discount > 0 && (
                                        <span className="badge badge-yellow" style={{ marginLeft: 8 }}>
                                            {(client as any).discount}% dto.
                                        </span>
                                    )}
                                </div>
                                <button onClick={() => setClient(null)} className="btn btn-ghost btn-sm btn-icon">
                                    <IconX size={13} />
                                </button>
                            </div>
                        ) : showClientInput ? (
                            <div style={{ width: '100%', position: 'relative' }}>
                                <input
                                    autoFocus
                                    value={clientQuery}
                                    onChange={e => searchClients(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Escape') { setShowClientInput(false); setClientQuery(''); setClientResults([]) }
                                        if (e.key === 'Enter' && clientResults.length === 0 && clientQuery.trim()) {
                                            selectClient({ name: clientQuery.trim() } as Client)
                                        }
                                    }}
                                    placeholder="Buscar por nombre o documento..."
                                    style={{ width: '100%', padding: '5px 10px', fontSize: 12, border: '1px solid #3b82f6', borderRadius: 8, outline: 'none' }}
                                />
                                {clientResults.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 180, overflowY: 'auto', marginTop: 2 }}>
                                        {clientResults.map(c => (
                                            <div key={c.id} onClick={() => selectClient(c)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                                <span style={{ fontWeight: 600 }}>{c.name}</span>
                                                {c.document && <span style={{ color: '#94a3b8', marginLeft: 8, fontSize: 11 }}>{c.document}</span>}
                                            </div>
                                        ))}
                                        {clientQuery.trim() && (
                                            <div onClick={() => selectClient({ name: clientQuery.trim() } as Client)} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: '#64748b', borderTop: '1px solid #f1f5f9' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                                Usar «{clientQuery.trim()}» como cliente ocasional
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowClientInput(true)}
                                style={{
                                    background: 'none', border: '1px dashed #cbd5e1', borderRadius: 8,
                                    padding: '5px 12px', fontSize: 12, color: '#94a3b8', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.color = '#16a34a' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#94a3b8' }}
                            >
                                <IconUser size={14} />
                                Asignar cliente
                            </button>
                        )}
                    </div>

                    {/* Carrito */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                        {cart.length === 0 ? (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', height: '100%', gap: 10, color: '#94a3b8',
                            }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 16, background: '#f1f5f9',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <IconShoppingCart size={24} style={{ color: '#cbd5e1' }} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: 0 }}>Carrito vacío</p>
                                    <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0 0' }}>
                                        Busca o escanea productos para comenzar
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <Cart
                                items={cart}
                                onUpdateQty={updateQuantity}
                                onUpdatePrice={updatePrice}
                                onUpdateDiscount={updateItemDiscount}
                                onRemove={removeItem}
                            />
                        )}
                    </div>
                </div>

                {/* Panel derecho: Totales */}
                <div style={{
                    width: 320, background: '#fff', display: 'flex',
                    flexDirection: 'column', overflow: 'hidden',
                }}>
                    {/* Totales */}
                    <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>

                        {/* Filas de totales */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {[
                                { label: 'Subtotal', value: `$${subtotal.toLocaleString('es-CO')}`, muted: true },
                                globalDiscount > 0 ? { label: 'Descuento', value: `-$${globalDiscount.toLocaleString('es-CO')}`, green: true } : null,
                            ].filter(Boolean).map((row: any, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '9px 0', borderBottom: '1px solid #f8fafc',
                                }}>
                                    <span style={{ fontSize: 13, color: row.green ? '#16a34a' : '#64748b', fontWeight: 500 }}>
                                        {row.label}
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: row.green ? '#16a34a' : '#334155' }}>
                                        {row.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Total grande */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 0 10px',
                            borderTop: '2px solid #e2e8f0', marginTop: 4,
                        }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>TOTAL</span>
                            <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                ${total.toLocaleString('es-CO')}
                            </span>
                        </div>

                        {/* Descuento global */}
                        {showDiscountInput ? (
                            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                                <input
                                    type="number"
                                    value={discountInput}
                                    onChange={e => setDiscountInput(e.target.value)}
                                    placeholder="Monto descuento"
                                    className="input"
                                    style={{ flex: 1, height: 32, fontSize: 12 }}
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            const d = parseFloat(discountInput)
                                            if (!isNaN(d) && d >= 0) setGlobalDiscount(Math.min(d, subtotal))
                                            setShowDiscountInput(false); setDiscountInput('')
                                        }
                                        if (e.key === 'Escape') { setShowDiscountInput(false); setDiscountInput('') }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const d = parseFloat(discountInput)
                                        if (!isNaN(d) && d >= 0) setGlobalDiscount(Math.min(d, subtotal))
                                        setShowDiscountInput(false); setDiscountInput('')
                                    }}
                                    className="btn btn-primary btn-sm"
                                >
                                    OK
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowDiscountInput(true)}
                                className="btn btn-warning btn-sm"
                                style={{ width: '100%', marginBottom: 10, justifyContent: 'center' }}
                            >
                                <IconTag size={13} />
                                {globalDiscount > 0 ? `Descuento: $${globalDiscount.toLocaleString('es-CO')}` : 'Aplicar descuento'}
                            </button>
                        )}

                        {/* Notas */}
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Notas de la venta..."
                            className="textarea"
                            style={{ minHeight: 56, fontSize: 12, resize: 'none' }}
                        />
                    </div>

                    {/* Botones acción */}
                    <div style={{ padding: '12px 18px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8 }}>

                        {/* Última venta */}
                        {lastSale && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 12px', borderRadius: 8,
                                background: '#f0fdf6', border: '1px solid #bbf7d2',
                            }}>
                                <IconCheckCircle size={15} style={{ color: '#16a34a', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#15803d', margin: 0 }}>
                                        Venta {lastSale.invoiceNumber} procesada
                                    </p>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                                        ${lastSale.total?.toLocaleString('es-CO')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => window.api.printInvoice(lastSale.id)}
                                    className="btn btn-ghost btn-sm btn-icon"
                                    title="Reimprimir"
                                >
                                    <IconPrint size={13} />
                                </button>
                                <button
                                    onClick={() => window.api.sendInvoiceWhatsapp(lastSale.id)}
                                    className="btn btn-ghost btn-sm btn-icon"
                                    title="Enviar por WhatsApp"
                                >
                                    <IconLink size={13} />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setShowPayment(true)}
                            disabled={cart.length === 0}
                            className="btn btn-primary btn-xl"
                            style={{ width: '100%', justifyContent: 'center', fontWeight: 800 }}
                        >
                            Pagar &nbsp; ${total.toLocaleString('es-CO')}
                            <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 500, marginLeft: 4 }}>(F8)</span>
                        </button>

                        <button
                            onClick={holdSale}
                            disabled={cart.length === 0}
                            className="btn btn-secondary"
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            <IconPause size={14} />
                            Guardar pendiente (F6)
                        </button>
                    </div>
                </div>
            </div>

            {showPayment && (
                <PaymentModal total={total} client={client} onComplete={handleSaleComplete} onCancel={() => setShowPayment(false)} />
            )}
            {showPending && (
                <PendingSalesModal
                    sales={pendingSales}
                    onResume={resumePending}
                    onDelete={(id) => savePendingSales(pendingSales.filter(p => p.id !== id))}
                    onWhatsapp={(sale) => window.api.sendPendingWhatsapp(sale)}
                    onClose={() => setShowPending(false)}
                />
            )}

            {/* Modal ítem manual */}
            {showManualModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
                    onClick={() => setShowManualModal(false)}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 360, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
                        onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Producto / Servicio manual</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Nombre *</label>
                                <input
                                    autoFocus
                                    value={manualName}
                                    onChange={e => setManualName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && document.getElementById('manual-price-input')?.focus()}
                                    placeholder="Ej: Servicio de revisión"
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Precio *</label>
                                <input
                                    id="manual-price-input"
                                    type="number"
                                    min="0"
                                    value={manualPrice}
                                    onChange={e => setManualPrice(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && confirmManualItem()}
                                    placeholder="0"
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button onClick={() => setShowManualModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                            <button
                                onClick={confirmManualItem}
                                disabled={!manualName.trim() || !manualPrice || parseFloat(manualPrice) <= 0}
                                className="btn btn-primary" style={{ flex: 1 }}
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
