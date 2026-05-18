// src/renderer/src/pages/accounting/BalancePage.tsx
import { useState, useEffect } from 'react'

export default function BalancePage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [balance, setBalance] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    async function loadBalance() {
        setLoading(true)
        const res = await (window.api as any).getBalance?.({ date })
        if (res?.success) {
            setBalance(res.data)
        }
        setLoading(false)
    }

    useEffect(() => { loadBalance() }, [])

    const formatCurrency = (n: number) => `$${n.toLocaleString('es-CO')}`
    const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CO')

    const renderSection = (title: string, items: any[], total: number, color: string) => (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: color, borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>{title}</h4>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{formatCurrency(total)}</span>
                </div>
            </div>
            <div style={{ maxHeight: 320, overflow: 'auto' }}>
                {items.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Sin movimientos</div>
                ) : (
                    items.map((item: any, i: number) => (
                        <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 20px', borderBottom: '1px solid #f1f5f9',
                        }}>
                            <span style={{ fontSize: 13, color: '#475569' }}>{item.code} - {item.name}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{formatCurrency(item.balance)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <label style={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>Balance al:</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={styles.input} />
                <button onClick={loadBalance} style={styles.btnPrimary}>Generar</button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Cargando...</div>
            ) : balance ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {balance.cuadre ? (
                        <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
                            ✓ Balance cuadrado al {formatDate(balance.date)}
                        </div>
                    ) : (
                        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
                            ⚠ Balance descuadrado — Revisar asientos
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {renderSection('Activos', balance.activos, balance.totalActivos, '#f0f9ff')}
                        {renderSection('Pasivos', balance.pasivos, balance.totalPasivos, '#fef2f2')}
                    </div>

                    {renderSection('Patrimonio', balance.patrimonio, balance.totalPatrimonio, '#f0fdf4')}

                    <div style={{ background: '#0f172a', color: '#fff', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 11, opacity: 0.7 }}>ACTIVOS</div>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{formatCurrency(balance.totalActivos)}</div>
                        </div>
                        <div style={{ fontSize: 24 }}>=</div>
                        <div>
                            <div style={{ fontSize: 11, opacity: 0.7 }}>PASIVOS + PATRIMONIO</div>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{formatCurrency(balance.totalPasivos + balance.totalPatrimonio)}</div>
                        </div>
                    </div>
                </div>
            ) : null}
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
