// src/renderer/src/components/shared/Topbar.tsx
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { IconLogout, IconCalendar } from './Icons'

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
    '/dashboard':  { title: 'Dashboard', subtitle: 'Resumen general del negocio' },
    '/pos':        { title: 'Punto de Venta', subtitle: 'Gestión de ventas en tiempo real' },
    '/inventory':  { title: 'Inventario', subtitle: 'Productos, stock y categorías' },
    '/clients':    { title: 'Clientes', subtitle: 'Base de datos de clientes' },
    '/purchases':  { title: 'Compras', subtitle: 'Gestión de pedidos a proveedores' },
    '/workshop':   { title: 'Taller', subtitle: 'Órdenes de trabajo y motos' },
    '/mechanics':  { title: 'Mecánicos', subtitle: 'Personal técnico y liquidaciones' },
    '/credits':    { title: 'Cartera y Créditos', subtitle: 'Gestión de créditos a clientes' },
    '/cash':       { title: 'Caja', subtitle: 'Apertura, cierre y arqueo de caja' },
    '/accounting': { title: 'Contabilidad', subtitle: 'Libro diario, mayor y balance' },
    '/reports':    { title: 'Reportes', subtitle: 'Exportar y analizar información' },
    '/settings':   { title: 'Configuración', subtitle: 'Empresa, usuarios y sistema' },
}

export default function Topbar() {
    const { logout } = useAuthStore()
    const location = useLocation()
    const navigate = useNavigate()

    const page = PAGE_TITLES[location.pathname] ?? { title: 'Manuel Motos' }

    async function handleLogout(): Promise<void> {
        await logout()
        navigate('/', { replace: true })
    }

    const now = new Date()
    const dateStr = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

    return (
        <header style={{
            height: 58,
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 16,
            flexShrink: 0,
            boxShadow: '0 1px 0 #f1f5f9',
        }}>
            {/* Títulos de página */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{
                    fontSize: 15, fontWeight: 800, color: '#0f172a',
                    margin: 0, lineHeight: 1.2, letterSpacing: '-0.01em',
                }}>
                    {page.title}
                </h1>
                {page.subtitle && (
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0', fontWeight: 400 }}>
                        {page.subtitle}
                    </p>
                )}
            </div>

            {/* Fecha y hora */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '5px 12px', borderRadius: 8,
                background: '#f8fafc', border: '1px solid #e2e8f0',
            }}>
                <IconCalendar size={13} className="" style={{ color: '#94a3b8' }} />
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, textTransform: 'capitalize' }}>
                    {dateStr}
                </span>
                <span style={{
                    fontSize: 12, color: '#0f172a', fontWeight: 700,
                    paddingLeft: 7, borderLeft: '1px solid #e2e8f0', marginLeft: 4,
                }}>
                    {timeStr}
                </span>
            </div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
                style={{ gap: 6 }}
                title="Cerrar sesión"
            >
                <IconLogout size={15} />
                <span>Salir</span>
            </button>
        </header>
    )
}

