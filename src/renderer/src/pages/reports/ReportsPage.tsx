// src/renderer/src/pages/reports/ReportsPage.tsx
import { useState } from 'react'
import {
    IconPos, IconInventory, IconPurchases, IconCredits, IconMechanics,
    IconHistory, IconCash, IconDownload, IconCheckCircle, IconSpinner, IconLink,
} from '../../components/shared/Icons'

type ReportType = 'sales' | 'inventory' | 'purchases' | 'credits' | 'mechanics' | 'kardex' | 'cash'

interface ReportConfig {
    key: ReportType
    label: string
    description: string
    icon: React.ReactNode
    color: string
    filters: { key: string; label: string; type: 'date' | 'select' | 'checkbox'; options?: { value: string; label: string }[] }[]
}

const REPORTS: ReportConfig[] = [
    {
        key: 'sales', label: 'Ventas', description: 'Ventas por fecha, estado y método de pago',
        icon: <IconPos size={20} />, color: '#16a34a',
        filters: [
            { key: 'startDate', label: 'Desde', type: 'date' },
            { key: 'endDate', label: 'Hasta', type: 'date' },
            { key: 'status', label: 'Estado', type: 'select', options: [{ value: 'completada', label: 'Completada' }, { value: 'anulada', label: 'Anulada' }] },
        ],
    },
    {
        key: 'inventory', label: 'Inventario', description: 'Productos con stock, costos y precios',
        icon: <IconInventory size={20} />, color: '#3b82f6',
        filters: [
            { key: 'status', label: 'Estado', type: 'select', options: [{ value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' }] },
            { key: 'lowStock', label: 'Solo stock bajo', type: 'checkbox' },
        ],
    },
    {
        key: 'purchases', label: 'Compras', description: 'Compras a proveedores por período',
        icon: <IconPurchases size={20} />, color: '#f59e0b',
        filters: [
            { key: 'startDate', label: 'Desde', type: 'date' },
            { key: 'endDate', label: 'Hasta', type: 'date' },
            { key: 'status', label: 'Estado', type: 'select', options: [{ value: 'pendiente', label: 'Pendiente' }, { value: 'recibida', label: 'Recibida' }] },
        ],
    },
    {
        key: 'credits', label: 'Cartera', description: 'Créditos activos y aging por cliente',
        icon: <IconCredits size={20} />, color: '#8b5cf6',
        filters: [
            { key: 'status', label: 'Estado', type: 'select', options: [{ value: 'al_dia', label: 'Al día' }, { value: 'proximo', label: 'Por vencer' }, { value: 'vencido', label: 'Vencido' }] },
        ],
    },
    {
        key: 'mechanics', label: 'Mecánicos', description: 'Liquidaciones y pagos de patio',
        icon: <IconMechanics size={20} />, color: '#ef4444',
        filters: [
            { key: 'startDate', label: 'Desde', type: 'date' },
            { key: 'endDate', label: 'Hasta', type: 'date' },
        ],
    },
    {
        key: 'kardex', label: 'Kardex', description: 'Movimientos de inventario por período',
        icon: <IconHistory size={20} />, color: '#0891b2',
        filters: [
            { key: 'startDate', label: 'Desde', type: 'date' },
            { key: 'endDate', label: 'Hasta', type: 'date' },
        ],
    },
    {
        key: 'cash', label: 'Caja', description: 'Sesiones de caja con cuadres y diferencias',
        icon: <IconCash size={20} />, color: '#16a34a',
        filters: [
            { key: 'startDate', label: 'Desde', type: 'date' },
            { key: 'endDate', label: 'Hasta', type: 'date' },
        ],
    },
]

export default function ReportsPage() {
    const [selected, setSelected] = useState<ReportType>('sales')
    const [filters, setFilters] = useState<Record<string, any>>({})
    const [exporting, setExporting] = useState(false)
    const [lastExport, setLastExport] = useState<{ filePath: string; count: number } | null>(null)

    const config = REPORTS.find(r => r.key === selected)!

    function updateFilter(key: string, value: any) { setFilters(f => ({ ...f, [key]: value })) }

    async function handleExport() {
        setExporting(true); setLastExport(null)
        const apiMap: Record<ReportType, string> = {
            sales: 'exportSales', inventory: 'exportInventory', purchases: 'exportPurchases',
            credits: 'exportCredits', mechanics: 'exportMechanics', kardex: 'exportKardex', cash: 'exportCash',
        }
        const cleanFilters: Record<string, any> = {}
        for (const [k, v] of Object.entries(filters)) { if (v !== '' && v !== false) cleanFilters[k] = v }
        const res = await (window.api as any)[apiMap[selected]]?.(cleanFilters)
        if (res?.success) setLastExport(res.data)
        else alert(res?.error || 'Error al exportar')
        setExporting(false)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeIn 0.2s ease-out' }}>

            <div className="page-header">
                <div>
                    <h2 className="page-title">Reportes</h2>
                    <p className="page-subtitle">Exporta información a Excel desde cualquier módulo</p>
                </div>
                <button onClick={() => (window.api as any).openExportFolder?.()} className="btn btn-secondary">
                    <IconLink size={15} />
                    Abrir carpeta
                </button>
            </div>

            {/* Grid de reportes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
                {REPORTS.map(r => (
                    <button
                        key={r.key}
                        onClick={() => { setSelected(r.key); setFilters({}); setLastExport(null) }}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                            gap: 8, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                            border: selected === r.key ? `2px solid ${r.color}` : '1px solid #e2e8f0',
                            background: selected === r.key ? `${r.color}08` : '#fff',
                            transition: 'all 0.15s', textAlign: 'left',
                            boxShadow: selected === r.key ? `0 0 0 3px ${r.color}18` : 'none',
                        }}
                        onMouseEnter={e => { if (selected !== r.key) { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc' } }}
                        onMouseLeave={e => { if (selected !== r.key) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' } }}
                    >
                        <div style={{
                            width: 36, height: 36, borderRadius: 9,
                            background: `${r.color}15`, color: r.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {r.icon}
                        </div>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{r.label}</p>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0', lineHeight: 1.4 }}>{r.description}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Panel de filtros y exportación */}
            <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${config.color}15`, color: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {config.icon}
                    </div>
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Exportar {config.label}</p>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{config.description}</p>
                    </div>
                </div>

                {/* Filtros */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                    {config.filters.map(f => (
                        <div key={f.key} className="form-group" style={{ minWidth: 150 }}>
                            <label className="label">{f.label}</label>
                            {f.type === 'date' && (
                                <input type="date" value={filters[f.key] || ''} onChange={e => updateFilter(f.key, e.target.value)} className="input" />
                            )}
                            {f.type === 'select' && (
                                <select value={filters[f.key] || ''} onChange={e => updateFilter(f.key, e.target.value)} className="select">
                                    <option value="">Todos</option>
                                    {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            )}
                            {f.type === 'checkbox' && (
                                <label className="checkbox-label" style={{ paddingTop: 6 }}>
                                    <input type="checkbox" checked={filters[f.key] || false} onChange={e => updateFilter(f.key, e.target.checked)} />
                                    Solo stock bajo
                                </label>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button onClick={handleExport} disabled={exporting} className="btn btn-primary" style={{ gap: 8 }}>
                        {exporting ? <><IconSpinner size={15} /> Exportando...</> : <><IconDownload size={15} /> Descargar Excel</>}
                    </button>

                    {lastExport && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: '#f0fdf6', border: '1px solid #bbf7d2' }}>
                            <IconCheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#15803d', margin: 0 }}>{lastExport.count} registros exportados</p>
                                <p style={{ fontSize: 11, color: '#64748b', margin: 0, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastExport.filePath}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

