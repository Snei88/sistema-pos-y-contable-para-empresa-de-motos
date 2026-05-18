import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/index'
import {
    getDashboardKPIs,
    getDashboardAlerts,
    getDashboardTop,
    getDashboardCharts,
} from '../services/dashboard/dashboard.service'

export function registerDashboardHandlers(): void {
    ipcMain.handle(IPC.DASHBOARD_KPIS,   () => getDashboardKPIs())
    ipcMain.handle(IPC.DASHBOARD_ALERTS, () => getDashboardAlerts())
    ipcMain.handle(IPC.DASHBOARD_TOP,    () => getDashboardTop())
    ipcMain.handle(IPC.DASHBOARD_CHARTS, (_, params) => getDashboardCharts(params))
}