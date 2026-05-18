// src/renderer/src/pages/clients/components/ClientForm.tsx
import { useState, useEffect } from 'react'
import type { Client } from '../../../../../shared/types/index'
import { IconX, IconSpinner } from '../../../components/shared/Icons'

interface Props {
    client: Client | null
    onSave: (data: any) => Promise<void>
    onClose: () => void
}

const DOC_TYPES = [
    { value: 'cedula', label: 'Cédula' },
    { value: 'nit', label: 'NIT' },
    { value: 'pasaporte', label: 'Pasaporte' },
    { value: 'otro', label: 'Otro' },
]

export default function ClientForm({ client, onSave, onClose }: Props) {
    const [form, setForm] = useState({
        documentType: 'cedula' as string,
        document: '',
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        creditLimit: 0,
        discount: 0,
        isActive: true,
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (client) {
            setForm({
                documentType: client.documentType || 'cedula',
                document: client.document || '',
                name: client.name,
                phone: client.phone || '',
                email: client.email || '',
                address: client.address || '',
                notes: client.notes || '',
                creditLimit: client.creditLimit,
                discount: client.discount,
                isActive: client.isActive,
            })
        }
    }, [client])

    function validate(): boolean {
        const e: Record<string, string> = {}
        if (!form.name.trim()) e.name = 'El nombre es requerido'
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
        if (form.creditLimit < 0) e.creditLimit = 'No puede ser negativo'
        if (form.discount < 0 || form.discount > 100) e.discount = 'Debe estar entre 0 y 100'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        if (!validate()) return
        setSaving(true)
        await onSave({ ...form, creditLimit: Number(form.creditLimit), discount: Number(form.discount) })
        setSaving(false)
    }

    const update = (field: string, value: any) => {
        setForm(f => ({ ...f, [field]: value }))
        if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n })
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.2s ease-out' }}>
                <div className="modal-header">
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                        {client ? 'Editar cliente' : 'Nuevo cliente'}
                    </h3>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
                        <IconX size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="modal-body">
                        <div className="form-row form-row-2">
                            <div className="form-group">
                                <label className="label">Tipo documento</label>
                                <select className="select" value={form.documentType} onChange={e => update('documentType', e.target.value)}>
                                    {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Número documento</label>
                                <input className="input" value={form.document} onChange={e => update('document', e.target.value)} placeholder="Ej: 1234567890" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Nombre completo *</label>
                            <input
                                className="input"
                                value={form.name}
                                onChange={e => update('name', e.target.value)}
                                placeholder="Nombre del cliente"
                                style={{ borderColor: errors.name ? '#ef4444' : undefined }}
                            />
                            {errors.name && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.name}</span>}
                        </div>

                        <div className="form-row form-row-2">
                            <div className="form-group">
                                <label className="label">Teléfono</label>
                                <input className="input" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="300 123 4567" />
                            </div>
                            <div className="form-group">
                                <label className="label">Email</label>
                                <input
                                    className="input"
                                    value={form.email}
                                    onChange={e => update('email', e.target.value)}
                                    placeholder="cliente@email.com"
                                    style={{ borderColor: errors.email ? '#ef4444' : undefined }}
                                />
                                {errors.email && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.email}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Dirección</label>
                            <input className="input" value={form.address} onChange={e => update('address', e.target.value)} placeholder="Dirección de residencia o trabajo" />
                        </div>

                        <div className="form-row form-row-2">
                            <div className="form-group">
                                <label className="label">Límite de crédito ($)</label>
                                <input
                                    className="input"
                                    type="number" value={form.creditLimit}
                                    onChange={e => update('creditLimit', e.target.value)}
                                    placeholder="0"
                                    style={{ borderColor: errors.creditLimit ? '#ef4444' : undefined }}
                                />
                                {errors.creditLimit && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.creditLimit}</span>}
                            </div>
                            <div className="form-group">
                                <label className="label">Descuento (%)</label>
                                <input
                                    className="input"
                                    type="number" value={form.discount}
                                    onChange={e => update('discount', e.target.value)}
                                    placeholder="0" min={0} max={100}
                                    style={{ borderColor: errors.discount ? '#ef4444' : undefined }}
                                />
                                {errors.discount && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.discount}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Notas</label>
                            <textarea
                                className="textarea"
                                value={form.notes}
                                onChange={e => update('notes', e.target.value)}
                                placeholder="Información adicional sobre el cliente..."
                                rows={3}
                            />
                        </div>

                        {client && (
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={e => update('isActive', e.target.checked)}
                                />
                                Cliente activo
                            </label>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button type="submit" disabled={saving} className="btn btn-primary" style={{ gap: 8 }}>
                            {saving ? <><IconSpinner size={14} /> Guardando...</> : (client ? 'Guardar cambios' : 'Crear cliente')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

