// src/renderer/src/pages/accounting/AccountingPage.tsx
import { useState } from 'react'
import JournalPage from './JournalPage'
import LedgerPage from './LedgerPage'
import BalancePage from './BalancePage'
import { IconFileText, IconAccounting, IconGauge } from '../../components/shared/Icons'

type Tab = 'journal' | 'ledger' | 'balance'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'journal', label: 'Libro Diario',    icon: <IconFileText size={16} /> },
    { key: 'ledger',  label: 'Libro Mayor',     icon: <IconAccounting size={16} /> },
    { key: 'balance', label: 'Balance General', icon: <IconGauge size={16} /> },
]

export default function AccountingPage() {
    const [tab, setTab] = useState<Tab>('journal')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease-out' }}>
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Contabilidad</h2>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 0' }}>PUC Colombia · Asientos automáticos · Libros contables</p>
            </div>

            <div className="tabs">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`tab-btn${tab === t.key ? ' active' : ''}`}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            <div style={{ animation: 'fadeIn 0.15s ease-out' }}>
                {tab === 'journal' && <JournalPage />}
                {tab === 'ledger' && <LedgerPage />}
                {tab === 'balance' && <BalancePage />}
            </div>
        </div>
    )
}

