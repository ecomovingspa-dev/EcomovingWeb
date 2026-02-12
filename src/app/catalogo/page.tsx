'use client';

import React from 'react';
import ProductCatalog from '@/components/ProductCatalog';
import MediaSidebar from '@/components/MediaSidebar';
import Link from 'next/link';
import { Search, Settings } from 'lucide-react';

export default function CatalogPage() {
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [search, setSearch] = React.useState('');

    return (
        <main style={{ backgroundColor: '#050505', minHeight: '100vh' }}>
            {/* Header del Catálogo */}
            <nav className="nav-premium">
                <Link href="/" className="brand-logo">ECOMOVING</Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                    <Link href="/" className="nav-item" style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>Volver a Inicio</Link>

                    <div style={{ position: 'relative', width: '250px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 35px',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                color: 'white',
                                outline: 'none',
                                fontSize: '12px'
                            }}
                        />
                    </div>

                    <button
                        onClick={() => setIsAdmin(!isAdmin)}
                        title={isAdmin ? 'Desactivar Edición' : 'Activar Edición'}
                        style={{
                            background: isAdmin ? 'rgba(0, 212, 189, 0.1)' : 'transparent',
                            border: 'none',
                            color: isAdmin ? 'var(--accent-turquoise)' : '#666',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.3s'
                        }}
                    >
                        <Settings size={20} className={isAdmin ? 'spin-slow' : ''} />
                    </button>
                </div>
            </nav>

            <div style={{ paddingTop: '0px' }}>
                <ProductCatalog adminMode={isAdmin} externalSearch={search} />
            </div>

            <footer className="footer-minimal">
                <div>
                    <h2 className="footer-brand">CATÁLOGO DIGITAL</h2>
                    <p style={{ marginTop: '20px', color: '#666', fontSize: '0.9rem' }}>
                        Curatoría Exclusiva para Empresas<br />
                        Ecomoving Premium
                    </p>
                </div>
                <div className="copyright">
                    &copy; 2024 Ecomoving SPA.
                </div>
            </footer>

            <MediaSidebar />
        </main>
    );
}
