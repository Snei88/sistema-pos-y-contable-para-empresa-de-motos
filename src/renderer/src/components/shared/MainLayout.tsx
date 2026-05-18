// src/renderer/src/components/shared/MainLayout.tsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function MainLayout() {
    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
            <Sidebar />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <Topbar />
                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '22px 24px',
                    background: '#f8fafc',
                }}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

