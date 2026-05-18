// src/renderer/src/pages/cash/components/CloseCashModal.tsx
import { useState, useEffect } from 'react'
import type { CashSession } from '../../../../../shared/types/index'
import { IconX, IconSpinner, IconCheckCircle, IconAlertTriangle } from '../../../components/shared/Icons'

interface Props {
    session: CashSession
    onClose: () => void
    onCancel: () => void
}

export default function CloseCashModal({ session, onClose, onCancel }: Props) {
    const [closingBalance, setClosingBalance] = useState('')
    const [notes, setNotes] = useState('')
    const [summary, setSummary] = useState<any>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'review' | 'confirm'>('review')

    useEffect(() => {
        ;(async () => {
            const res = await (window.api as any).getCashSummary?.(session.id)
            if (res?.success) setSummary(res.data)
        })()
    }, [session.id])

    const expectedBalance = summary?.session?.expectedBalance ?? session.openingBalance
    const difference = closingBalance ? parseFloat(closingBalance) - expectedBalance : 0
    const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        setError('')
        const balance = parseFloat(closingBalance)
        if (isNaN(balance) || balance < 0) { setError('Ingresa un monto válido'); return }
        if (step === 'review') { setStep('confirm'); return }
        setLoading(true)
        const res = await window.api.closeCash({ closingBalance: balance, notes: notes || undefined })
        setLoading(false)
        if (res.success) onClose()
        else { setError(res.error ?? 'Error al cerrar caja'); setStep('review') }
    }

    const diffColor = difference === 0 ? '#16a34a' : difference > 0 ? '#92400e' : '#991b1b'
    const diffBg = difference === 0 ? '#f0fdf4' : difference > 0 ? '#fffbeb' : '#fef2f2'
    const diffBorder = difference === 0 ? '#bbf7d0' : difference > 0 ? '#fcd34d' : '#fecaca'

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.2s ease-out' }}>
                <div className="modal-header">
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Cerrar caja</h3>
                    <button onClick={onCancel} className="btn btn-ghost btn-icon btn-sm">
                        <IconX size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {step === 'review' ? (
                            <>
                                <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                        <span style={{ color: '#64748b' }}>Fondo inicial</span>
                                        <span style={{ fontWeight: 600 }}>{fmt(session.openingBalance)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                        <span style={{ color: '#64748b' }}>Esperado en caja</span>
                                        <span style={{ fontWeight: 600 }}>{fmt(expectedBalance)}</span>
                                    </div>
                                    {summary && (
                                        <>
                                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                                <span style={{ color: '#64748b' }}>Ventas efectivo</span>
                                                <span style={{ fontWeight: 600 }}>
                                                    {fmt(summary.paymentsByMethod?.find((p: any) => p.method === 'efectivo')?.amount ?? 0)}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                                <span style={{ color: '#64748b' }}>Total transacciones</span>
                                                <span style={{ fontWeight: 600 }}>{summary.salesCount}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="label">Efectivo contado *</label>
                                    <input
                                        className="input input-lg"
                                        type="number"
                                        value={closingBalance}
                                        onChange={e => setClosingBalance(e.target.value)}
                                        placeholder="Cuánto hay físicamente en caja"
                                        autoFocus
                                        style={{ fontWeight: 700, borderColor: error ? '#ef4444' : undefined }}
                                    />
                                </div>

                                {closingBalance && (
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '12px 16px', borderRadius: 10, border: `1px solid ${diffBorder}`,
                                        background: diffBg,
                                    }}>
                                        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                                            {difference === 0 ? 'Cuadre perfecto' : difference > 0 ? 'Sobrante' : 'Faltante'}
                                        </span>
                                        <span style={{ fontSize: 18, fontWeight: 800, color: diffColor }}>
                                            {difference > 0 ? '+' : ''}{fmt(difference)}
                                        </span>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="label">Notas (opcional)</label>
                                    <textarea
                                        className="textarea"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Motivo de diferencia, observaciones..."
                                        rows={2}
                                    />
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: 8, textAlign: 'center' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef9c3', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconAlertTriangle size={24} />
                                </div>
                                <h4 style={{ margin: '8px 0 0', color: '#0f172a', fontSize: 16 }}>Confirmar cierre</h4>
                                <p style={{ color: '#64748b', fontSize: 14, margin: '8px 0' }}>
                                    Contado: <strong>{fmt(parseFloat(closingBalance))}</strong><br />
                                    Esperado: <strong>{fmt(expectedBalance)}</strong><br />
                                    Diferencia: <strong style={{ color: diffColor }}>{difference > 0 ? '+' : ''}{fmt(difference)}</strong>
                                </p>
                                <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>Esta acción no se puede deshacer</p>
                            </div>
                        )}

                        {error && <div className="alert alert-error">{error}</div>}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={step === 'confirm' ? () => setStep('review') : onCancel}
                            className="btn btn-secondary"
                        >
                            {step === 'confirm' ? 'Volver' : 'Cancelar'}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !closingBalance}
                            className={step === 'confirm' ? 'btn btn-danger' : 'btn btn-primary'}
                            style={{ gap: 8 }}
                        >
                            {loading
                                ? <><IconSpinner size={14} /> Procesando...</>
                                : step === 'confirm'
                                    ? <><IconCheckCircle size={14} /> Confirmar cierre</>
                                    : 'Continuar'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

