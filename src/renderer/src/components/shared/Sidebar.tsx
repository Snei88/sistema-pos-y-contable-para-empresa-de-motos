// src/renderer/src/components/shared/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import type { UserRole } from '../../../../shared/types/index'
import logo from '@shared/../assets/logo.jpeg'
import {
    IconDashboard, IconPos, IconInventory, IconClients, IconPurchases,
    IconWorkshop, IconMechanics, IconCredits, IconCash, IconAccounting,
    IconReports, IconSettings,
} from './Icons'

interface NavItem {
    to: string
    label: string
    icon: React.ReactNode
    roles: UserRole[]
    group?: string
}

const NAV_ITEMS: NavItem[] = [
    { to: '/dashboard',  label: 'Dashboard',      icon: <IconDashboard size={17} />,  roles: ['admin', 'cajero', 'supervisor'] },
    { to: '/pos',        label: 'Punto de Venta', icon: <IconPos size={17} />,        roles: ['admin', 'cajero', 'supervisor'], group: 'Operaciones' },
    { to: '/inventory',  label: 'Inventario',     icon: <IconInventory size={17} />,  roles: ['admin', 'cajero', 'supervisor'] },
    { to: '/clients',    label: 'Clientes',       icon: <IconClients size={17} />,    roles: ['admin', 'cajero', 'supervisor'] },
    { to: '/purchases',  label: 'Compras',        icon: <IconPurchases size={17} />,  roles: ['admin', 'supervisor'] },
    { to: '/workshop',   label: 'Taller',         icon: <IconWorkshop size={17} />,   roles: ['admin', 'mecanico', 'supervisor'], group: 'Taller' },
    { to: '/mechanics',  label: 'Mecánicos',      icon: <IconMechanics size={17} />,  roles: ['admin', 'supervisor'] },
    { to: '/credits',    label: 'Cartera',        icon: <IconCredits size={17} />,    roles: ['admin', 'cajero', 'supervisor'], group: 'Finanzas' },
    { to: '/cash',       label: 'Caja',           icon: <IconCash size={17} />,       roles: ['admin', 'cajero', 'supervisor'] },
    { to: '/accounting', label: 'Contabilidad',   icon: <IconAccounting size={17} />, roles: ['admin', 'supervisor'] },
    { to: '/reports',    label: 'Reportes',       icon: <IconReports size={17} />,    roles: ['admin', 'supervisor'] },
    { to: '/settings',   label: 'Configuración',  icon: <IconSettings size={17} />,   roles: ['admin'] },
]

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Administrador',
    cajero: 'Cajero',
    supervisor: 'Supervisor',
    mecanico: 'Mecánico',
}

export default function Sidebar() {
    const { user } = useAuthStore()
    const role = user?.role as UserRole | undefined

    // Si no hay usuario o rol, no renderizar nada (o un fallback)
    if (!role) return null

    const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role))

    // Agrupación robusta con reduce
    const grouped = visibleItems.reduce<{ group: string | null; items: NavItem[] }[]>((acc, item, index) => {
        const g = item.group ?? null
        if (index === 0 || g !== acc[acc.length - 1].group) {
            acc.push({ group: g, items: [item] })
        } else {
            acc[acc.length - 1].items.push(item)
        }
        return acc
    }, [])

    return (
        <aside style={{
            width: 220,
            background: '#fff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            flexShrink: 0,
            overflow: 'hidden',
        }}>
            {/* Logo */}
            <div style={{
                padding: '18px 16px 14px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    overflow: 'hidden', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgb(22 163 74 / 0.25)',
                }}>
                    <img
                        src={logo}
                        alt="Manuel Motos"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => {
                            const t = e.currentTarget
                            t.style.display = 'none'
                            const parent = t.parentElement
                            if (parent) {
                                parent.style.background = '#16a34a'
                                parent.innerHTML = '<span style="color:#fff;font-size:14px;font-weight:800">M</span>'
                            }
                        }}
                    />
                </div>
                <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', lineHeight: 1, margin: 0, letterSpacing: '-0.01em' }}>
                        Manuel Motos
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0', fontWeight: 500 }}>
                        Sistema POS
                    </p>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {grouped.map(({ group, items }, gi) => (
                    <div key={gi}>
                        {group && (
                            <p style={{
                                fontSize: 10, fontWeight: 700, color: '#cbd5e1',
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                padding: '8px 6px 4px', margin: 0,
                            }}>
                                {group}
                            </p>
                        )}
                        {items.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className="nav-icon" style={{ color: isActive ? '#16a34a' : undefined }}>
                                            {item.icon}
                                        </span>
                                        <span style={{ flex: 1 }}>{item.label}</span>
                                        {isActive && (
                                            <span style={{
                                                width: 5, height: 5, borderRadius: '50%',
                                                background: '#16a34a', flexShrink: 0,
                                            }} />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* User Info */}
            <div style={{ padding: '10px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 10px', borderRadius: 10,
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #16a34a, #4ade80)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                            {user?.fullName?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                            fontSize: 12, fontWeight: 700, color: '#1e293b',
                            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {user?.fullName}
                        </p>
                        <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0', fontWeight: 500 }}>
                            {ROLE_LABELS[role] ?? role}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
