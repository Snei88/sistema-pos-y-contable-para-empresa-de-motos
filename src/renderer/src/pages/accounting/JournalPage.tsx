// src/renderer/src/pages/accounting/JournalPage.tsx
import { useState, useEffect, useCallback } from 'react'
import type { JournalEntry } from '../../../../shared/types/index'
import EntryFormModal from './components/EntryFormModal'

export default function JournalPage() {
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [showForm, setShowForm] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await (window.api as any).getJournal?.({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            page,
            pageSize: 20,
        })
        if (res?.success && res.data) {
            setEntries(res.data.data)
            setTotalPages(res.data.totalPages)
        }
        setLoading(false)
    }, [startDate, endDate, page])

    useEffect(() => { load() }, [load])

    const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`
    const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CO')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1) }} style={styles.dateInput} />
                    <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1) }} style={styles.dateInput} />
                </div>
                <button onClick={() => setShowForm(true)} style={styles.btnPrimary}>+ Nuevo asiento</button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Cargando...</div>
            ) : entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
                    <p>Sin asientos registrados</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {entries.map(e => {
                        const totalDebit = e.lines?.reduce((s, l) => s + l.debit, 0) ?? 0
                        const totalCredit = e.lines?.reduce((s, l) => s + l.credit, 0) ?? 0
                        return (
                            <div key={e.id} style={styles.entryCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>{e.entryNumber}</span>
                                        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 12 }}>{formatDate(e.date)}</span>
                                    </div>
                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{e.referenceType} #{e.reference}</span>
                                </div>
                                <p style={{ fontSize: 13, color: '#334155', margin: '0 0 12px' }}>{e.description}</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {e.lines?.map((l, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                            <span style={{ color: '#475569', paddingLeft: l.debit > 0 ? 0 : 20 }}>
                                                {l.accountCode} - {l.accountName}
                                            </span>
                                            <span style={{ fontWeight: 600, color: l.debit > 0 ? '#0f172a' : '#64748b' }}>
                                                {l.debit > 0 ? formatCurrency(l.debit) : formatCurrency(l.credit)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                                    <span style={{ color: '#10b981' }}>D: {formatCurrency(totalDebit)}</span>
                                    <span style={{ color: '#3b82f6' }}>C: {formatCurrency(totalCredit)}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, paddingTop: 8 }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={styles.pageBtn}>←</button>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={styles.pageBtn}>→</button>
                </div>
            )}

            {showForm && <EntryFormModal onClose={() => setShowForm(false)} onSuccess={load} />}
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    dateInput: {
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '8px 12px', fontSize: 13, outline: 'none',
    },
    btnPrimary: {
        background: '#0f172a', color: '#fff', border: 'none',
        borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
    },
    entryCard: {
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
    },
    pageBtn: {
        background: '#f1f5f9', border: 'none', borderRadius: 8,
        width: 32, height: 32, cursor: 'pointer',
    },
}
