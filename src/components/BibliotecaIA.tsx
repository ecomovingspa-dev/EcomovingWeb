'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Image as ImageIcon, X, Search, Loader2, Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface MediaImage {
    name: string;
    url: string;
    source: 'marketing' | 'catalog';
    category?: string;
}

interface BibliotecaIAProps {
    onClose: () => void;
}

export default function BibliotecaIA({ onClose }: BibliotecaIAProps) {
    const [marketingImages, setMarketingImages] = useState<MediaImage[]>([]);
    const [catalogImages, setCatalogImages] = useState<MediaImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'marketing' | 'catalog'>('catalog');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [isDraggable, setIsDraggable] = useState(true);

    useEffect(() => {
        fetchAllImages();
    }, []);

    const fetchAllImages = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchMarketingImages(), fetchCatalogImages()]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMarketingImages = async () => {
        try {
            const { data } = await supabase.storage.from('imagenes-marketing').list('', { limit: 100 });
            if (data) {
                const urls = data
                    .filter(f => f.name !== '.emptyFolderPlaceholder' && f.metadata)
                    .map(f => ({
                        name: f.name,
                        url: supabase.storage.from('imagenes-marketing').getPublicUrl(f.name).data.publicUrl,
                        source: 'marketing' as const
                    }));
                setMarketingImages(urls);
            }
        } catch (e) { console.error(e); }
    };

    const fetchCatalogImages = async () => {
        try {
            const { data } = await supabase.from('agent_buffer').select('*').eq('status', 'approved');
            if (data) {
                const images: MediaImage[] = data.map(p => {
                    let cat = p.category;
                    // Intentar extraer de technical_specs si no está en la columna principal
                    if (!cat && p.technical_specs && typeof p.technical_specs === 'object') {
                        cat = p.technical_specs.category;
                    }

                    let normalizedCat = (cat || 'Otros').trim().toUpperCase();

                    // Corrección manual para productos mal categorizados reportados por el usuario
                    if (p.name?.toUpperCase().includes('BOTELLA') || p.images?.[0]?.toLowerCase().includes('botella')) {
                        normalizedCat = 'BOTELLAS';
                    }

                    return {
                        name: p.name || 'Producto',
                        url: p.images?.[0] || p.image || '',
                        source: 'catalog' as const,
                        category: normalizedCat
                    };
                }).filter(img => img.url);
                setCatalogImages(Array.from(new Map(images.map(i => [i.url, i])).values()));
            }
        } catch (e) { console.error(e); }
    };

    const categories = useMemo(() => {
        if (activeTab === 'marketing') return [];
        const cats = new Set(catalogImages.map(img => img.category).filter(Boolean));
        return ['Todas', ...Array.from(cats)].sort() as string[];
    }, [catalogImages, activeTab]);

    const currentImages = useMemo(() => {
        let list = activeTab === 'marketing' ? marketingImages : catalogImages;

        if (activeTab === 'catalog' && selectedCategory !== 'Todas') {
            list = list.filter(img => img.category === selectedCategory);
        }

        if (!search) return list;
        return list.filter(img => img.name.toLowerCase().includes(search.toLowerCase()));
    }, [activeTab, marketingImages, catalogImages, search, selectedCategory]);

    const handleDragStart = (e: React.DragEvent, url: string) => {
        e.dataTransfer.setData('image_url', url);
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
                position: 'fixed',
                top: '10vh',
                right: '40px',
                width: '550px',
                height: '80vh',
                backgroundColor: '#0a0a0a',
                boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
                zIndex: 100000,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'default'
            }}
        >
            {/* Header / Drag Handle */}
            <div
                style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'grab',
                    background: 'rgba(255,255,255,0.02)'
                }}
                onMouseDown={e => e.currentTarget.style.cursor = 'grabbing'}
                onMouseUp={e => e.currentTarget.style.cursor = 'grab'}
            >
                <h3 style={{ margin: 0, color: 'white', fontSize: '16px', fontFamily: 'var(--font-heading)', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ImageIcon size={18} style={{ color: 'var(--accent-turquoise)' }} />
                    BIBLIOTECA <span style={{ color: 'var(--accent-gold)' }}>IA</span>
                </h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px' }}>
                    <X size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['marketing', 'catalog'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as 'marketing' | 'catalog')} style={{
                        flex: 1, padding: '12px', background: 'none', border: 'none',
                        color: activeTab === tab ? 'var(--accent-turquoise)' : '#555',
                        fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer',
                        borderBottom: activeTab === tab ? '2px solid var(--accent-turquoise)' : 'none'
                    }}>
                        {tab === 'marketing' ? <><ImageIcon size={12} /> MARKETING</> : <><Package size={12} /> CATÁLOGO</>}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div style={{ padding: '16px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                    <input
                        type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 36px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px', color: 'white', fontSize: '13px', outline: 'none' }}
                    />
                </div>
            </div>

            {/* Category Filter (Solo para catálogo) */}
            {activeTab === 'catalog' && !loading && categories.length > 1 && (
                <div style={{ padding: '0 16px 16px 16px', display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }} className="custom-scroll">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                border: '1px solid',
                                borderColor: selectedCategory === cat ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.1)',
                                backgroundColor: selectedCategory === cat ? 'rgba(0,212,189,0.1)' : 'transparent',
                                color: selectedCategory === cat ? 'var(--accent-turquoise)' : '#888',
                                fontSize: '10px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                transition: 'all 0.3s'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Images Grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                        <Loader2 size={32} style={{ color: 'var(--accent-turquoise)', animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : currentImages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#444', padding: '60px 0' }}>Sin resultados</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        {currentImages.map((img, i) => (
                            <div key={`${img.url}-${i}`} draggable onDragStart={e => handleDragStart(e, img.url)}
                                style={{ aspectRatio: '1/1', backgroundColor: '#111', borderRadius: '4px', overflow: 'hidden', cursor: 'grab', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}
                            >
                                <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                                {activeTab === 'catalog' && <span style={{ position: 'absolute', top: '4px', left: '4px', backgroundColor: 'var(--accent-gold)', color: 'black', padding: '2px 5px', fontSize: '8px', fontWeight: '900', borderRadius: '2px' }}>PRODUCT</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>Arrastra imágenes a las celdas</p>
            </div>

            <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </motion.div>
    );
}
