// src/renderer/src/pages/pos/components/ProductSearch.tsx
import { useState, useEffect, forwardRef } from 'react'
import type { Product } from '../../../../../shared/types/index'
import { IconSearch, IconPlus, IconAlertTriangle } from '../../../components/shared/Icons'

interface Props {
    onSelect: (product: Product, qty: number) => void
    onManual: () => void
}

const ProductSearch = forwardRef<HTMLInputElement, Props>(({ onSelect, onManual }, ref) => {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Product[]>([])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [showResults, setShowResults] = useState(false)

    useEffect(() => {
        if (query.length < 2) { setResults([]); setShowResults(false); return }
        const timeout = setTimeout(async () => {
            const res = await window.api.searchProducts(query)
            if (res.success && res.data) {
                setResults(res.data)
                setSelectedIndex(0)
                setShowResults(true)
            }
        }, 150)
        return () => clearTimeout(timeout)
    }, [query])

    useEffect(() => {
        let buffer = ''
        let timeout: NodeJS.Timeout
        function handleKey(e: KeyboardEvent) {
            if (document.activeElement === (typeof ref === 'object' ? ref?.current : null)) return
            if (e.key === 'Enter' && buffer.length > 3) {
                e.preventDefault()
                searchBarcode(buffer)
                buffer = ''
                return
            }
            if (e.key.length === 1) {
                buffer += e.key
                clearTimeout(timeout)
                timeout = setTimeout(() => { buffer = '' }, 100)
            }
        }
        window.addEventListener('keypress', handleKey)
        return () => window.removeEventListener('keypress', handleKey)
    }, [ref])

    async function searchBarcode(code: string) {
        const res = await window.api.searchProducts(code)
        if (res.success && res.data && res.data.length > 0) onSelect(res.data[0], 1)
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!showResults) return
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(results.length - 1, i + 1)) }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(0, i - 1)) }
        if (e.key === 'Enter') { e.preventDefault(); if (results[selectedIndex]) selectProduct(results[selectedIndex]) }
        if (e.key === 'Escape') setShowResults(false)
    }

    function selectProduct(p: Product) {
        onSelect(p, 1)
        setQuery(''); setResults([]); setShowResults(false)
        if (typeof ref === 'object' && ref?.current) ref.current.focus()
    }

    const COP = (n: number) => `$${n.toLocaleString('es-CO')}`

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{
                        position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                        color: '#94a3b8', display: 'flex', pointerEvents: 'none',
                    }}>
                        <IconSearch size={16} />
                    </span>
                    <input
                        ref={ref}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => query.length >= 2 && setShowResults(true)}
                        onBlur={() => setTimeout(() => setShowResults(false), 150)}
                        placeholder="Buscar producto o escanear código... (F2)"
                        className="input"
                        style={{
                            height: 42, paddingLeft: 36, fontSize: 14,
                            border: '1.5px solid #e2e8f0',
                        }}
                    />
                </div>
                <button onClick={onManual} className="btn btn-secondary" style={{ height: 42, whiteSpace: 'nowrap' }}>
                    <IconPlus size={15} />
                    Manual
                </button>
            </div>

            {/* Dropdown resultados */}
            {showResults && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: 10, boxShadow: '0 10px 24px rgb(0 0 0 / 0.1)',
                    maxHeight: 340, overflowY: 'auto', zIndex: 200, marginTop: 4,
                    animation: 'fadeIn 0.12s ease-out',
                }}>
                    {results.length === 0 ? (
                        <div style={{ padding: '20px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                            No se encontraron productos para "{query}"
                        </div>
                    ) : results.map((p, i) => {
                        const stockLow = p.stock <= p.minStock
                        const isSelected = i === selectedIndex
                        return (
                            <div
                                key={p.id}
                                onMouseDown={() => selectProduct(p)}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 14px', cursor: 'pointer',
                                    background: isSelected ? '#f0fdf6' : '#fff',
                                    borderBottom: i < results.length - 1 ? '1px solid #f8fafc' : 'none',
                                    transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc' }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#fff' }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{p.name}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                        {p.code}{p.barcode ? ` · ${p.barcode}` : ''}
                                        {' · '}
                                        <span style={{ color: stockLow ? '#d97706' : '#64748b' }}>
                                            Stock: {p.stock} {p.unit}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                                    <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{COP(p.salePrice)}</div>
                                    {stockLow && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 2 }}>
                                            <IconAlertTriangle size={10} style={{ color: '#d97706' }} />
                                            <span style={{ fontSize: 10, color: '#d97706', fontWeight: 600 }}>Stock bajo</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
})

ProductSearch.displayName = 'ProductSearch'
export default ProductSearch
