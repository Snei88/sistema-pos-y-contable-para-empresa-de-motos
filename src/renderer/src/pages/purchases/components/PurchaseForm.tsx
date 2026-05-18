// src/renderer/src/pages/purchases/components/PurchaseForm.tsx
import { useState } from 'react'
import type { Supplier, Product } from '../../../../../shared/types/index'

interface Props {
    suppliers: Supplier[]
    onSave: (data: any) => Promise<void>
    onClose: () => void
}

interface LineItem {
    id: string
    productId?: number
    productName: string
    quantity: number
    unitCost: number
}

export default function PurchaseForm({ suppliers, onSave, onClose }: Props) {
    const [supplierId, setSupplierId] = useState('')
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [items, setItems] = useState<LineItem[]>([])
    const [searchProduct, setSearchProduct] = useState('')
    const [productResults, setProductResults] = useState<Product[]>([])
    const [tax, setTax] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [notes, setNotes] = useState('')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
    const taxAmount = tax ? parseFloat(tax) : subtotal * 0.19
    const total = subtotal + taxAmount

    async function searchProducts(query: string) {
        if (query.length < 2) { setProductResults([]); return }
        const res = await window.api.searchProducts(query)
        if (res.success && res.data) setProductResults(res.data)
    }

    function addItem(product: Product): void {
        if (items.some(i => i.productId === product.id)) {
            setItems(items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i))
        } else {
            setItems([...items, {
                id: crypto.randomUUID(),
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitCost: product.costPrice || 0,
            }])
        }
        setSearchProduct('')
        setProductResults([])
    }

    function updateItem(id: string, field: string, value: number): void {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))
    }

    function removeItem(id: string): void {
        setItems(items.filter(i => i.id !== id))
    }

    function validate(): boolean {
        const e: Record<string, string> = {}
        if (!supplierId) e.supplier = 'Selecciona un proveedor'
        if (items.length === 0) e.items = 'Agrega al menos un producto'
        if (items.some(i => i.quantity <= 0)) e.quantity = 'Cantidad debe ser mayor a 0'
        if (items.some(i => i.unitCost < 0)) e.cost = 'Costo no puede ser negativo'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        if (!validate()) return

        setSaving(true)
        await onSave({
            supplierId: parseInt(supplierId),
            invoiceNumber: invoiceNumber || undefined,
            items: items.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                unitCost: i.unitCost,
            })),
            tax: taxAmount,
            dueDate: dueDate || undefined,
            notes: notes || undefined,
        })
        setSaving(false)
    }

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={styles.title}>Nueva compra</h3>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Proveedor */}
                    <div style={styles.field}>
                        <label style={styles.label}>Proveedor *</label>
                        <select
                            value={supplierId}
                            onChange={e => setSupplierId(e.target.value)}
                            style={{ ...styles.select, borderColor: errors.supplier ? '#ef4444' : '#e2e8f0' }}
                        >
                            <option value="">Seleccionar...</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {errors.supplier && <span style={styles.error}>{errors.supplier}</span>}
                    </div>

                    <div style={styles.grid2}>
                        <div style={styles.field}>
                            <label style={styles.label}>N° Factura proveedor</label>
                            <input
                                value={invoiceNumber}
                                onChange={e => setInvoiceNumber(e.target.value)}
                                placeholder="Opcional"
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Fecha vencimiento pago</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                    </div>

                    {/* Buscador de productos */}
                    <div style={styles.field}>
                        <label style={styles.label}>Agregar productos</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                value={searchProduct}
                                onChange={e => { setSearchProduct(e.target.value); searchProducts(e.target.value) }}
                                placeholder="Buscar por nombre o código..."
                                style={styles.input}
                            />
                            {productResults.length > 0 && (
                                <div style={styles.dropdown}>
                                    {productResults.map(p => (
                                        <div key={p.id} onClick={() => addItem(p)} style={styles.resultItem}>
                                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                                            <span style={{ color: '#64748b', fontSize: 12 }}>Stock: {p.stock}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items */}
                    {items.length > 0 && (
                        <div style={styles.itemsBox}>
                            {errors.items && <span style={styles.error}>{errors.items}</span>}
                            <table style={{ width: '100%', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ textAlign: 'left', padding: '6px 0' }}>Producto</th>
                                        <th style={{ textAlign: 'center', width: 80 }}>Cant</th>
                                        <th style={{ textAlign: 'right', width: 120 }}>Costo unit</th>
                                        <th style={{ textAlign: 'right', width: 120 }}>Subtotal</th>
                                        <th style={{ width: 40 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ padding: '8px 0' }}>{item.productName}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                    style={{ ...styles.smallInput, textAlign: 'center' }}
                                                />
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <input
                                                    type="number"
                                                    value={item.unitCost}
                                                    onChange={e => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                                                    style={{ ...styles.smallInput, textAlign: 'right' }}
                                                />
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                ${(item.quantity * item.unitCost).toLocaleString('es-CO')}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button type="button" onClick={() => removeItem(item.id)} style={styles.removeBtn}>✕</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Totales */}
                    <div style={styles.totals}>
                        <div style={styles.totalRow}>
                            <span>Subtotal</span>
                            <span>${subtotal.toLocaleString('es-CO')}</span>
                        </div>
                        <div style={styles.totalRow}>
                            <span>IVA (19%)</span>
                            <input
                                type="number"
                                value={taxAmount}
                                onChange={e => setTax(e.target.value)}
                                style={{ ...styles.smallInput, textAlign: 'right', width: 100 }}
                            />
                        </div>
                        <div style={{ ...styles.totalRow, fontSize: 18, fontWeight: 700, borderTop: '2px solid #e2e8f0', paddingTop: 8 }}>
                            <span>Total</span>
                            <span>${total.toLocaleString('es-CO')}</span>
                        </div>
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Notas</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Observaciones..."
                            rows={2}
                            style={{ ...styles.input, resize: 'vertical' }}
                        />
                    </div>

                    <div style={styles.actions}>
                        <button type="button" onClick={onClose} style={styles.btnSecondary}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving} style={styles.btnPrimary}>
                            {saving ? 'Guardando...' : 'Crear compra'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
    },
    modal: {
        background: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 640,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: '1px solid #f1f5f9',
    },
    title: {
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
        color: '#0f172a',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: 24,
        color: '#94a3b8',
        cursor: 'pointer',
        width: 32,
        height: 32,
    },
    form: {
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    grid2: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: 600,
        color: '#334155',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
    },
    input: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 14,
        color: '#0f172a',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    },
    select: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 14,
        color: '#0f172a',
        cursor: 'pointer',
        outline: 'none',
        width: '100%',
    },
    error: {
        fontSize: 12,
        color: '#ef4444',
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        maxHeight: 200,
        overflow: 'auto',
        zIndex: 100,
        marginTop: 4,
    },
    resultItem: {
        padding: '10px 12px',
        cursor: 'pointer',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
    },
    itemsBox: {
        background: '#f8fafc',
        borderRadius: 10,
        padding: 12,
    },
    smallInput: {
        width: 70,
        padding: '4px 8px',
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        fontSize: 13,
        outline: 'none',
    },
    removeBtn: {
        background: '#fef2f2',
        color: '#ef4444',
        border: 'none',
        borderRadius: 4,
        width: 24,
        height: 24,
        cursor: 'pointer',
        fontSize: 12,
    },
    totals: {
        background: '#f8fafc',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 14,
        color: '#475569',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
        paddingTop: 16,
        borderTop: '1px solid #f1f5f9',
    },
    btnSecondary: {
        background: '#f1f5f9',
        color: '#475569',
        border: 'none',
        borderRadius: 8,
        padding: '10px 20px',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
    },
    btnPrimary: {
        background: '#10b981',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '10px 20px',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
}
