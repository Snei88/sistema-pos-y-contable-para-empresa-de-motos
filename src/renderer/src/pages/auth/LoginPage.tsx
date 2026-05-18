// src/renderer/src/pages/auth/LoginPage.tsx
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { IconEye, IconEyeOff, IconLock, IconUser, IconSpinner } from '../../components/shared/Icons'
import logo from '@shared/../assets/logo.jpeg'

export default function LoginPage() {
    const { login, isLoading, error, clearError } = useAuthStore()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)

    useEffect(() => { clearError() }, [])

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        if (!username.trim() || !password.trim()) return
        await login(username.trim(), password)
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0fdf6 0%, #f8fafc 50%, #f0f4ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Fondo decorativo */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: -120, right: -120, width: 480, height: 480,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgb(22 163 74 / 0.07) 0%, transparent 70%)',
                }} />
                <div style={{
                    position: 'absolute', bottom: -100, left: -100, width: 380, height: 380,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgb(22 163 74 / 0.05) 0%, transparent 70%)',
                }} />
            </div>

            <div style={{ width: '100%', maxWidth: 380, position: 'relative', animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)' }}>

                {/* Logo + Branding */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 8px 24px rgb(22 163 74 / 0.18), 0 2px 8px rgb(0 0 0 / 0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 14px',
                        overflow: 'hidden',
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
                                    parent.innerHTML = '<span style="color:#fff;font-size:24px;font-weight:800">M</span>'
                                }
                            }}
                        />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        Manuel Motos
                    </h1>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                        Sistema POS + Contable
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: '#fff',
                    borderRadius: 20,
                    padding: 28,
                    boxShadow: '0 8px 32px rgb(0 0 0 / 0.08), 0 1px 0 rgb(0 0 0 / 0.03)',
                    border: '1px solid rgb(226 232 240 / 0.8)',
                }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
                        Iniciar sesión
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                        {/* Usuario */}
                        <div className="form-group">
                            <label className="label">Usuario</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                                    color: '#94a3b8', display: 'flex', pointerEvents: 'none',
                                }}>
                                    <IconUser size={15} />
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Ingresa tu usuario"
                                    autoFocus
                                    autoComplete="username"
                                    className="input input-lg"
                                    style={{ paddingLeft: 34 }}
                                />
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div className="form-group">
                            <label className="label">Contraseña</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                                    color: '#94a3b8', display: 'flex', pointerEvents: 'none',
                                }}>
                                    <IconLock size={15} />
                                </span>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="⬢⬢⬢⬢⬢⬢⬢⬢"
                                    autoComplete="current-password"
                                    className="input input-lg"
                                    style={{ paddingLeft: 34, paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(v => !v)}
                                    style={{
                                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#94a3b8', display: 'flex', padding: 4,
                                        transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                                >
                                    {showPass ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="alert alert-error animate-fadeIn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || !username || !password}
                            className="btn btn-primary btn-xl"
                            style={{ marginTop: 4, width: '100%' }}
                        >
                            {isLoading ? (
                                <><IconSpinner size={16} /> Verificando...</>
                            ) : (
                                'Ingresar al sistema'
                            )}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 16 }}>
                    Manuel Motos v1.0 &mdash; Acceso solo personal autorizado
                </p>
            </div>
        </div>
    )
}

