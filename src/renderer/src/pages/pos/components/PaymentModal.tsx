// src/renderer/src/pages/pos/components/PaymentModal.tsx
import { useState } from 'react'
import type { Client } from '../../../../../shared/types/index'
import {
    IconX, IconCash, IconCredits, IconDollarSign, IconCheckCircle, IconSpinner, IconPrint, IconLink,
} from '../../../components/shared/Icons'

const PAYMENT_METHODS = [
    { value: 'efectivo', label: 'Efectivo', icon: <IconCash size={16} /> },
    { value: 'tarjeta', label: 'Tarjeta', icon: <IconCredits size={16} /> },
    { value: 'transferencia', label: 'Transferencia', icon: <IconDollarSign size={16} /> },
    { value: 'nequi', label: 'Nequi', icon: <IconDollarSign size={16} /> },
    { value: 'daviplata', label: 'Daviplata', icon: <IconDollarSign size={16} /> },
    { value: 'credito', label: 'Crédito', icon: <IconCash size={16} /> },
]

interface Payment {
    method: string
    amount: number
    reference?: string
}

interface Props {
    total: number
    client: Client | null
    onComplete: (payments: Payment[]) => Promise<any>
    onCancel: () => void
}

export default function PaymentModal({ total, client, onComplete, onCancel }: Props) {
    const [payments, setPayments] = useState<Payment[]>([{ method: 'efectivo', amount: 0 }])
    const [activeMethod, setActiveMethod] = useState('efectivo')
    const [methodToAdd, setMethodToAdd] = useState('')
    const [error, setError] = useState('')
    const [processing, setProcessing] = useState(false)
    const [completedSale, setCompletedSale] = useState<any>(null)

    const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
    const remaining = Math.max(0, total - totalPaid)
    const change = Math.max(0, totalPaid - total)
    const availableMethods = PAYMENT_METHODS.filter(m => !payments.some(p => p.method === m.value))
    const selectedMethodToAdd = methodToAdd || availableMethods[0]?.value || ''

    function addPayment(method: string): void {
        if (!method) return
        if (payments.some(p => p.method === method && method !== 'efectivo')) {
            setActiveMethod(method); return
        }
        setPayments([...payments, { method, amount: 0 }])
        setActiveMethod(method)
        setMethodToAdd('')
    }

    function updatePayment(method: string, amount: number, reference?: string): void {
        setPayments(payments.map(p =>
            p.method === method ? { ...p, amount, reference: reference ?? p.reference } : p
        ))
    }

    function removePayment(method: string): void {
        if (payments.length === 1) return
        const nextPayments = payments.filter(p => p.method !== method)
        setPayments(nextPayments)
        if (activeMethod === method) setActiveMethod(nextPayments[0].method)
    }

    async function handleSubmit(): Promise<void> {
        setError('')
        if (totalPaid <= 0) { setError('Debes ingresar al menos un pago'); return }
        if (payments.some(p => p.method === 'credito') && !client) {
            setError('Para venta a crédito debes seleccionar un cliente registrado'); return
        }
        for (const p of payments) {
            if ((p.method === 'tarjeta' || p.method === 'transferencia') && !p.reference) {
                setError(`Ingresa referencia para ${PAYMENT_METHODS.find(m => m.value === p.method)?.label}`); return
            }
        }
        setProcessing(true)
        const sale = await onComplete(payments.filter(p => p.amount > 0))
        if (sale) setCompletedSale(sale)
        setProcessing(false)
    }

    const canSubmit = !processing && (remaining <= 0 || payments.some(p => p.method === 'credito'))

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.2s ease-out' }}>
                <div className="modal-header">
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{completedSale ? 'Venta completada' : 'Procesar pago'}</h3>
                    <button onClick={onCancel} className="btn btn-ghost btn-icon btn-sm">
                        <IconX size={16} />
                    </button>
                </div>

                <div className="modal-body" style={{ gap: 20 }}>
                    {completedSale ? (
                        <>
                            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                <IconCheckCircle size={42} style={{ color: '#16a34a' }} />
                                <p style={{ margin: '10px 0 4px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                                    Factura {completedSale.invoiceNumber}
                                </p>
                                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                                    Total ${completedSale.total?.toLocaleString('es-CO')}
                                </p>
                            </div>
                            <button onClick={() => window.api.printInvoice(completedSale.id)} className="btn btn-primary btn-lg" style={{ justifyContent: 'center', gap: 8 }}>
                                <IconPrint size={16} /> Imprimir factura
                            </button>
                            <button onClick={() => window.api.sendInvoiceWhatsapp(completedSale.id)} className="btn btn-secondary btn-lg" style={{ justifyContent: 'center', gap: 8 }}>
                                <IconLink size={16} /> Enviar por WhatsApp
                            </button>
                            <button onClick={onCancel} className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                                Cerrar
                            </button>
                        </>
                    ) : (
                        <>
                    {/* Total */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '16px 0', borderBottom: '2px dashed #e2e8f0' }}>
                        <span style={{ fontSize: 14, color: '#64748b' }}>Total a pagar</span>
                        <span style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>
                            ${total.toLocaleString('es-CO')}
                        </span>
                    </div>

                    {/* Method tabs */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {payments.map(p => {
                            const method = PAYMENT_METHODS.find(m => m.value === p.method)!
                            const isActive = activeMethod === p.method
                            return (
                                <button
                                    key={p.method}
                                    onClick={() => setActiveMethod(p.method)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer', minWidth: 72,
                                        border: `2px solid ${isActive ? '#16a34a' : '#e2e8f0'}`,
                                        background: isActive ? '#f0fdf4' : '#f8fafc',
                                        color: isActive ? '#16a34a' : '#64748b',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {method.icon}
                                    <span style={{ fontSize: 11, fontWeight: 600 }}>{method.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700 }}>${p.amount.toLocaleString('es-CO')}</span>
                                    {payments.length > 1 && (
                                        <span
                                            onClick={e => { e.stopPropagation(); removePayment(p.method) }}
                                            style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            quitar
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                        {availableMethods.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <select
                                    value={selectedMethodToAdd}
                                    onChange={e => setMethodToAdd(e.target.value)}
                                    className="select"
                                    style={{ width: 170, height: 38 }}
                                >
                                    {availableMethods.map(method => (
                                        <option key={method.value} value={method.value}>{method.label}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => addPayment(selectedMethodToAdd)}
                                    className="btn btn-secondary"
                                    style={{ height: 38 }}
                                >
                                    Agregar pago
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Amount input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label className="label">{PAYMENT_METHODS.find(m => m.value === activeMethod)?.label}</label>
                        <input
                            type="number"
                            value={payments.find(p => p.method === activeMethod)?.amount || ''}
                            onChange={e => updatePayment(activeMethod, parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            autoFocus
                            style={{
                                fontSize: 32, fontWeight: 700, padding: '14px', textAlign: 'center',
                                border: '2px solid #e2e8f0', borderRadius: 12, outline: 'none', color: '#0f172a', width: '100%', boxSizing: 'border-box',
                            }}
                        />

                        {(activeMethod === 'tarjeta' || activeMethod === 'transferencia') && (
                            <input
                                type="text"
                                value={payments.find(p => p.method === activeMethod)?.reference || ''}
                                onChange={e => updatePayment(
                                    activeMethod,
                                    payments.find(p => p.method === activeMethod)?.amount || 0,
                                    e.target.value,
                                )}
                                placeholder="Número de referencia / últimos 4 dígitos"
                                className="input"
                            />
                        )}

                        {activeMethod === 'efectivo' && change > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d2' }}>
                                <span style={{ fontSize: 14, color: '#15803d', fontWeight: 600 }}>Cambio</span>
                                <span style={{ fontSize: 26, fontWeight: 800, color: '#16a34a' }}>
                                    ${change.toLocaleString('es-CO')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#475569' }}>
                            <span>Pagado</span>
                            <span style={{ fontWeight: 600 }}>${totalPaid.toLocaleString('es-CO')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#475569' }}>
                            <span>Pendiente</span>
                            <span style={{ fontSize: 20, fontWeight: 800, color: remaining > 0 ? '#ef4444' : '#16a34a' }}>
                                ${remaining.toLocaleString('es-CO')}
                            </span>
                        </div>
                        {change > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#475569' }}>
                                <span>Cambio total</span>
                                <span style={{ fontWeight: 700, color: '#16a34a' }}>${change.toLocaleString('es-CO')}</span>
                            </div>
                        )}
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="btn btn-primary btn-lg"
                        style={{ gap: 8, justifyContent: 'center' }}
                    >
                        {processing
                            ? <><IconSpinner size={16} /> Procesando...</>
                            : <><IconCheckCircle size={16} /> {remaining > 0 ? 'Guardar como crédito' : 'Completar venta'}</>
                        }
                    </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
