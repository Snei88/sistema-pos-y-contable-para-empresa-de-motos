// src/renderer/src/pages/settings/SettingsPage.tsx
import { useState } from 'react'
import CompanyTab from './components/CompanyTab'
import UsersTab from './components/UsersTab'
import BackupTab from './components/BackupTab'
import SecurityTab from './components/SecurityTab'
import SuppliersTab from './components/SuppliersTab'
import MotosTab from './components/MotosTab'
import { IconBuilding, IconClients, IconDatabase, IconShield, IconTruck, IconMoto } from '../../components/shared/Icons'

type Tab = 'company' | 'users' | 'suppliers' | 'motos' | 'backup' | 'security'

const TABS: { key: Tab; label: string; icon: React.ReactNode; description: string }[] = [
    { key: 'company',   label: 'Empresa',      icon: <IconBuilding size={16} />, description: 'Datos y logo' },
    { key: 'users',     label: 'Usuarios',     icon: <IconClients size={16} />,  description: 'Acceso y roles' },
    { key: 'suppliers', label: 'Proveedores',  icon: <IconTruck size={16} />,    description: 'Gestión de proveedores' },
    { key: 'motos',     label: 'Motos',        icon: <IconMoto size={16} />,     description: 'Motos registradas' },
    { key: 'backup',    label: 'Backup',       icon: <IconDatabase size={16} />, description: 'Copias de seguridad' },
    { key: 'security',  label: 'Seguridad',    icon: <IconShield size={16} />,   description: 'Contraseña y permisos' },
]

export default function SettingsPage() {
    const [tab, setTab] = useState<Tab>('company')

    return (
        <div style={{ display: 'flex', gap: 20, animation: 'fadeIn 0.2s ease-out', minHeight: 400 }}>

            {/* Sidebar de tabs */}
            <div style={{ width: 200, flexShrink: 0 }}>
                <div className="card" style={{ padding: 8, overflow: 'hidden' }}>
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                width: '100%', padding: '10px 12px', borderRadius: 8,
                                border: 'none', cursor: 'pointer', textAlign: 'left',
                                marginBottom: 2,
                                background: tab === t.key ? '#f0fdf6' : 'transparent',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { if (tab !== t.key) e.currentTarget.style.background = '#f8fafc' }}
                            onMouseLeave={e => { if (tab !== t.key) e.currentTarget.style.background = 'transparent' }}
                        >
                            <span style={{ color: tab === t.key ? '#16a34a' : '#94a3b8', transition: 'color 0.15s' }}>
                                {t.icon}
                            </span>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? '#15803d' : '#334155', margin: 0, lineHeight: 1.2 }}>
                                    {t.label}
                                </p>
                                <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0 0' }}>{t.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido */}
            <div style={{ flex: 1, minWidth: 0, animation: 'fadeIn 0.15s ease-out' }}>
                {tab === 'company'   && <CompanyTab />}
                {tab === 'users'     && <UsersTab />}
                {tab === 'suppliers' && <SuppliersTab />}
                {tab === 'motos'     && <MotosTab />}
                {tab === 'backup'    && <BackupTab />}
                {tab === 'security'  && <SecurityTab />}
            </div>
        </div>
    )
}

