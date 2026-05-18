import { getSqlite } from '../../database/connection'
import type { IpcResponse, DashboardKPIs, Alert, SalesChartPoint } from '../../../shared/types/index'

export function getDashboardKPIs(): IpcResponse<DashboardKPIs> {
    const db = getSqlite()

    // Usar date('now','localtime') directamente en SQL para evitar desfase UTC vs local
    const salesToday = db.prepare(`
        SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
        FROM sales
        WHERE date(created_at) = date('now','localtime')
          AND status = 'completada'
    `).get() as any

    const salesYesterday = db.prepare(`
        SELECT COALESCE(SUM(total), 0) as total
        FROM sales
        WHERE date(created_at) = date('now','localtime','-1 day')
          AND status = 'completada'
    `).get() as any

    // Ventas del mes actual
    const salesMTD = db.prepare(`
        SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
        FROM sales
        WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now','localtime')
          AND status = 'completada'
    `).get() as any

    // Ventas de la semana (7 días)
    const salesWeek = db.prepare(`
        SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
        FROM sales
        WHERE date(created_at) >= date('now','localtime','-6 days')
          AND status = 'completada'
    `).get() as any

    // Ticket promedio del mes
    const avgTicket = salesMTD.count > 0 ? salesMTD.total / salesMTD.count : 0

    // Margen bruto del mes
    const margin = db.prepare(`
        SELECT
            COALESCE(SUM(si.subtotal), 0) as revenue,
            COALESCE(SUM(si.cost_price * si.quantity), 0) as cost
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now','localtime')
          AND s.status = 'completada'
    `).get() as any

    const grossMargin = margin.revenue > 0
        ? ((margin.revenue - margin.cost) / margin.revenue) * 100
        : 0

    // Stock bajo y agotado
    const lowStock = db.prepare(`
        SELECT COUNT(*) as c FROM products
        WHERE stock > 0 AND stock <= min_stock AND deleted_at IS NULL AND status = 'active'
    `).get() as any

    const outOfStock = db.prepare(`
        SELECT COUNT(*) as c FROM products
        WHERE stock <= 0 AND deleted_at IS NULL AND status = 'active'
    `).get() as any

    // Caja abierta actual
    const cashSession = db.prepare(`
        SELECT opening_balance FROM cash_sessions
        WHERE status = 'abierta'
        ORDER BY opened_at DESC LIMIT 1
    `).get() as any

    // Créditos pendientes (saldo total)
    const pendingCredits = db.prepare(`
        SELECT COALESCE(SUM(balance), 0) as total
        FROM credits WHERE balance > 0
    `).get() as any

    // Órdenes activas
    const activeWO = db.prepare(`
        SELECT COUNT(*) as c FROM work_orders
        WHERE status IN ('pendiente', 'en_proceso') AND deleted_at IS NULL
    `).get() as any

    // Créditos vencidos
    const overdueCredits = db.prepare(`
        SELECT COUNT(*) as c FROM credits WHERE status = 'vencido'
    `).get() as any

    const variation = salesYesterday.total > 0
        ? ((salesToday.total - salesYesterday.total) / salesYesterday.total) * 100
        : 0

    return {
        success: true,
        data: {
            salesToday: salesToday.total,
            salesYesterday: salesYesterday.total,
            salesVariation: variation,
            salesMTD: salesMTD.total,
            transactionsToday: salesMTD.count,
            averageTicket: avgTicket,
            avgTicket,
            grossMargin,
            unitsSoldToday: salesWeek.count,
            cashBalance: cashSession?.opening_balance ?? 0,
            pendingCredits: pendingCredits.total,
            lowStockCount: lowStock.c,
            outOfStockCount: outOfStock.c,
            activeWorkOrders: activeWO.c,
            overdueCredits: overdueCredits.c,
        } as DashboardKPIs,
    }
}

export function getDashboardAlerts(): IpcResponse<Alert[]> {
    const db = getSqlite()
    const alerts: Alert[] = []

    const lowStock = db.prepare(`
        SELECT name, stock, min_stock FROM products
        WHERE stock <= min_stock AND deleted_at IS NULL AND status = 'active'
        ORDER BY stock ASC LIMIT 5
    `).all() as any[]

    for (const p of lowStock) {
        alerts.push({
            id: `stock_${p.name}`,
            type: 'stock_bajo',
            severity: p.stock <= 0 ? 'error' : 'warning',
            title: p.stock <= 0 ? 'Producto agotado' : 'Stock bajo',
            message: `${p.name} (${p.stock} und)`,
            createdAt: new Date().toISOString(),
            isRead: false,
        })
    }

    const overdue = db.prepare(`
        SELECT c.invoice_number, cl.name, c.balance, c.due_date
        FROM credits c
        LEFT JOIN clients cl ON c.client_id = cl.id
        WHERE c.status = 'vencido'
        ORDER BY c.due_date ASC LIMIT 5
    `).all() as any[]

    for (const c of overdue) {
        alerts.push({
            id: `credit_${c.invoice_number}`,
            type: 'credito_vencido',
            severity: 'error',
            title: 'Crédito vencido',
            message: `${c.name} — ${c.invoice_number} ($${Number(c.balance).toLocaleString('es-CO')})`,
            createdAt: new Date().toISOString(),
            isRead: false,
        })
    }

    return { success: true, data: alerts }
}

export function getDashboardTop(): IpcResponse<{ topProducts: any[]; topMechanics: any[] }> {
    const db = getSqlite()

    // Top productos del mes
    const products = db.prepare(`
        SELECT p.name, COALESCE(SUM(si.quantity), 0) as qty, COALESCE(SUM(si.subtotal), 0) as total
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        WHERE strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now','localtime')
          AND s.status = 'completada'
        GROUP BY p.id
        ORDER BY qty DESC
        LIMIT 10
    `).all() as any[]

    // Top mecánicos del mes
    const mechanics = db.prepare(`
        SELECT me.name, COUNT(wo.id) as orders,
               COALESCE(SUM(wo.total), 0) as total
        FROM work_orders wo
        JOIN mechanics me ON wo.mechanic_id = me.id
        WHERE strftime('%Y-%m', wo.created_at) = strftime('%Y-%m', 'now','localtime')
        GROUP BY me.id
        ORDER BY total DESC
        LIMIT 5
    `).all() as any[]

    return {
        success: true,
        data: {
            topProducts: products.map(p => ({ name: p.name, qty: p.qty, total: p.total })),
            topMechanics: mechanics.map(m => ({ name: m.name, orders: m.orders, total: m.total })),
        },
    }
}

export function getDashboardCharts(params?: { days?: number }): IpcResponse<SalesChartPoint[]> {
    const db = getSqlite()
    const days = params?.days ?? 7
    const points: SalesChartPoint[] = []

    for (let i = days - 1; i >= 0; i--) {
        const row = db.prepare(`
            SELECT
                COALESCE(SUM(total), 0) as sales,
                COALESCE(SUM(s.total - (
                    SELECT COALESCE(SUM(si2.cost_price * si2.quantity), 0)
                    FROM sale_items si2 WHERE si2.sale_id = s.id
                )), 0) as margin,
                COUNT(*) as transactions
            FROM sales s
            WHERE date(created_at) = date('now','localtime',? || ' days')
              AND status = 'completada'
        `).get(`-${i}`) as any

        const label = new Date(Date.now() - i * 86400000)
            .toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

        points.push({
            label,
            sales: row.sales,
            cost: Math.max(0, row.sales - row.margin),
            transactions: row.transactions,
        })
    }

    return { success: true, data: points }
}
