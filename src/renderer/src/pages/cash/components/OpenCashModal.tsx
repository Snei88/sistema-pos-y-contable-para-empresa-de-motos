// src/renderer/src/pages/cash/components/OpenCashModal.tsx
import { useState } from 'react'
import { IconX, IconSpinner } from '../../../components/shared/Icons'

interface Props {
    onOpen: () => void
    onClose: () => void
}

export default function OpenCashModal({ onOpen, onClose }: Props) {
    const [openingBalance, setOpeningBalance] = useState('')
    const [notes, setNotes] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        setError('')
        const balance = parseFloat(openingBalance)
        if (isNaN(balance) || balance < 0) {
            setError('Ingresa un monto válido (mayor o igual a 0)')
            return
        }
        setLoading(true)
        const res = await window.api.openCash({ openingBalance: balance, notes: notes || undefined })
        setLoading(false)
        if (res.success) onOpen()
        else setError(res.error ?? 'Error al abrir caja')
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.2s ease-out' }}>
                <div className="modal-header">
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Abrir caja</h3>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
                        <IconX size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="label">Fondo inicial *</label>
                            <input
                                className="input input-lg"
                                type="number"
                                value={openingBalance}
                                onChange={e => setOpeningBalance(e.target.value)}
                                placeholder="Ej: 50000"
                                autoFocus
                                style={{ fontWeight: 700, borderColor: error ? '#ef4444' : undefined }}
                            />
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>Efectivo con el que inicia la caja</span>
                        </div>

                        <div className="form-group">
                            <label className="label">Notas (opcional)</label>
                            <textarea
                                className="textarea"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Observaciones sobre la apertura..."
                                rows={3}
                            />
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ gap: 8 }}>
                            {loading ? <><IconSpinner size={14} /> Abriendo...</> : 'Abrir caja'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

