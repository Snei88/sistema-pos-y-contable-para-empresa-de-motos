// src/renderer/src/pages/accounting/LedgerPage.tsx
import { useState, useEffect } from 'react'
import type { AccountingAccount } from '../../../../shared/types/index'

export default function LedgerPage() {
    const [accounts, setAccounts] = useState<AccountingAccount[]>([])
    const [selectedAccount, setSelectedAccount] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [ledger, setLedger] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadAccounts()
    }, [])

    async function loadAccounts() {
        const res = await (window.api as any).getAccounts?.()
        if (res?.success) {
            setAccounts(res.data.filter((a: AccountingAccount) => a.allowsMovement))
        }
    }

    async function loadLedger() {
        if (!selectedAccount) return
        setLoading(true)
        const res = await (window.api as any).getLedger?.({
            accountCode: selectedAccount,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        })
        if (res?.success) {
            setLedger(res.data)
        }
        setLoading(false)
    }

    const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`
    const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CO')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select
                    value={selectedAccount}
                    onChange={e => setSelectedAccount(e.target.value)}
                    style={{ ...styles.input, minWidth: 280 }}
                >
                    <option value="">Seleccionar cuenta...</option>
                    {accounts.map(a => (
                        <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                    ))}
                </select>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={styles.input} />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={styles.input} />
                <button onClick={loadLedger} style={styles.btnPrimary}>Consultar</button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Cargando...</div>
            ) : ledger ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#0f172a' }}>{ledger.account.code} - {ledger.account.name}</h3>
                        <p style={{ margin: 0, fontSize: 13, color: '#64748b', textTransform: 'capitalize' }}>Tipo: {ledger.account.type}</p>
                        <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
                            <div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Débito</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{formatCurrency(ledger.totalDebit)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Crédito</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{formatCurrency(ledger.totalCredit)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>Saldo final</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{formatCurrency(ledger.finalBalance)}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ledger.movements.map((m: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(m.date)} • {m.entryNumber}</div>
                                    <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>{m.description}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 16, textAlign: 'right', minWidth: 200 }}>
                                    <div style={{ width: 80 }}>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Débito</div>
                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.debit > 0 ? formatCurrency(m.debit) : '-'}</div>
                                    </div>
                                    <div style={{ width: 80 }}>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Crédito</div>
                                        <div style={{ fontWeight: 600, color: '#64748b' }}>{m.credit > 0 ? formatCurrency(m.credit) : '-'}</div>
                                    </div>
                                    <div style={{ width: 80 }}>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Saldo</div>
                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(m.balance)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                    <p>Seleccione una cuenta y período para consultar el mayor</p>
                </div>
            )}
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    input: {
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '10px 12px', fontSize: 14, outline: 'none',
    },
    btnPrimary: {
        background: '#0f172a', color: '#fff', border: 'none',
        borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
    },
}
