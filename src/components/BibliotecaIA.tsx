'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Image as ImageIcon, X, Search, Loader2, Package, ChevronDown, Grid } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';

interface MediaImage {
    name: string;
    url: string;
    source: 'marketing' | 'catalog' | 'grilla';
    category?: string;
}

interface BibliotecaIAProps {
    onClose: () => void;
}

export default function BibliotecaIA({ onClose }: BibliotecaIAProps) {
    // Data States
    const [marketingImages, setMarketingImages] = useState<MediaImage[]>([]);
    const [catalogImages, setCatalogImages] = useState<MediaImage[]>([]);
    const [grillaImages, setGrillaImages] = useState<MediaImage[]>([]);

    // UI States
    const [activeTab, setActiveTab] = useState<'grilla' | 'marketing' | 'catalog'>('grilla');
    const [loadingMarketing, setLoadingMarketing] = useState(false);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [loadingGrilla, setLoadingGrilla] = useState(false);

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [visibleCount, setVisibleCount] = useState(24);

    const dragControls = useDragControls();

    // FETCH MARKETING (Source: Carpeta 'marketing' en Storage + Tabla opcional)
    const fetchMarketing = async () => {
        if (marketingImages.length > 0) return;
        setLoadingMarketing(true);
        try {
            const { data } = await supabase.storage
                .from('imagenes-marketing')
                .list('', {
                    limit: 100,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (data) {
                // Filtramos para ignorar carpetas y archivos ocultos, solo archivos en la raíz para marketing
                const filteredData = data.filter(item =>
                    item.name !== '.emptyFolderPlaceholder' &&
                    item.name !== '.emptyKeepFile' &&
                    !['grilla', 'catalogo', 'hero', 'marketing'].includes(item.name)
                );

                const images: MediaImage[] = filteredData.map(item => {
                    const { data: { publicUrl } } = supabase.storage
                        .from('imagenes-marketing')
                        .getPublicUrl(item.name);

                    return {
                        name: item.name || 'Imagen Marketing',
                        url: publicUrl,
                        source: 'marketing' as const,
                        category: 'General'
                    };
                }).filter(img => img.url && !img.url.includes('.emptyKeepFile'));

                setMarketingImages(images);
            }
        } catch (e) { console.error("Error fetching marketing storage:", e); }
        setLoadingMarketing(false);
    };

    // FETCH CATALOG (Solo desde la tabla unificada 'productos')
    const fetchCatalog = async () => {
        if (catalogImages.length > 0) return;
        setLoadingCatalog(true);
        try {
            // Carga desde 'productos' (Catálogo oficial publicados y unificados)
            const { data: prodData } = await supabase
                .from('productos')
                .select('nombre, imagen_principal, imagenes_galeria, categoria')
                .limit(2000);

            if (prodData && prodData.length > 0) {
                const images: MediaImage[] = prodData.flatMap(p => {
                    const validImgs = [p.imagen_principal, ...(p.imagenes_galeria || [])].filter(Boolean);
                    let cat = (p.categoria || 'OTROS').trim().toUpperCase();

                    return validImgs.map(url => ({
                        name: p.nombre || 'Producto',
                        url: url,
                        source: 'catalog' as const,
                        category: cat
                    }));
                });

                const unique = Array.from(new Map(images.map(i => [i.url, i])).values());
                setCatalogImages(unique);
            }
        } catch (e) {
            console.error("Error fetching unified catalog for AI Library:", e);
        } finally {
            setLoadingCatalog(false);
        }
    };

    // FETCH GRILLA (Source: Carpeta 'grilla' en Storage para consistencia con Hub)
    const fetchGrilla = async () => {
        if (grillaImages.length > 0) return;
        setLoadingGrilla(true);
        try {
            const { data, error } = await supabase.storage
                .from('imagenes-marketing')
                .list('grilla', {
                    limit: 100,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (data) {
                const images: MediaImage[] = data.map(item => {
                    const { data: { publicUrl } } = supabase.storage
                        .from('imagenes-marketing')
                        .getPublicUrl(`grilla/${item.name}`);

                    return {
                        name: item.name || 'Imagen Grilla',
                        url: publicUrl,
                        source: 'grilla' as const,
                        category: 'General'
                    };
                }).filter(img => img.url && !img.url.includes('.emptyKeepFile'));

                setGrillaImages(images);
            }
        } catch (e) { console.error("Error fetching grilla storage:", e); }
        setLoadingGrilla(false);
    };

    // Effects
    useEffect(() => {
        if (activeTab === 'marketing') fetchMarketing();
        else if (activeTab === 'catalog') fetchCatalog();
        else if (activeTab === 'grilla') fetchGrilla();
    }, [activeTab]);

    // ...

    // Filters
    const categories = useMemo(() => {
        if (activeTab === 'marketing') return [];
        let list = activeTab === 'grilla' ? grillaImages : catalogImages;
        const cats = new Set(list.map(img => img.category).filter(Boolean));
        return ['Todas', ...Array.from(cats)].sort() as string[];
    }, [catalogImages, grillaImages, activeTab]);

    const currentImages = useMemo(() => {
        let list = activeTab === 'marketing' ? marketingImages : (activeTab === 'grilla' ? grillaImages : catalogImages);

        if ((activeTab === 'catalog' || activeTab === 'grilla') && selectedCategory !== 'Todas') {
            list = list.filter(img => img.category === selectedCategory);
        }

        if (search) {
            list = list.filter(img => img.name.toLowerCase().includes(search.toLowerCase()));
        }
        return list;
    }, [activeTab, marketingImages, catalogImages, grillaImages, search, selectedCategory]);

    const loading = activeTab === 'marketing' ? loadingMarketing : (activeTab === 'grilla' ? loadingGrilla : loadingCatalog);

    // Pagination
    const visibleImages = currentImages.slice(0, visibleCount);

    const handleDragStart = (e: React.DragEvent, url: string) => {
        e.dataTransfer.setData('image_url', url);
    };

    return (
        <motion.div
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
                position: 'fixed',
                top: '12vh',
                right: '25px',
                width: '500px',
                height: '75vh',
                backgroundColor: 'var(--eco-bg-glass)',
                backdropFilter: 'blur(24px) saturate(1.5)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)',
                zIndex: 100000,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
        >
            {/* Header / Drag Handle */}
            <div
                onPointerDown={(e) => dragControls.start(e)}
                style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'grab',
                    background: 'rgba(255,255,255,0.03)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ImageIcon size={20} style={{ color: 'var(--eco-accent-primary)' }} />
                    <h3 style={{
                        margin: 0,
                        color: 'white',
                        fontSize: '18px',
                        fontFamily: 'var(--eco-font-display)',
                        letterSpacing: '3px',
                        textTransform: 'uppercase'
                    }}>
                        BIBLIOTECA <span style={{ color: 'var(--eco-accent-secondary)', opacity: 0.8 }}>IA</span>
                    </h3>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px', transition: 'color 0.3s' }} className="hover-text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                {['grilla', 'catalog', 'marketing'].map(tab => (
                    <button key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        style={{
                            flex: 1, padding: '16px 12px', background: 'none', border: 'none',
                            color: activeTab === tab ? 'var(--eco-accent-primary)' : '#666',
                            fontSize: '11px', fontFamily: 'var(--eco-font-mono)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer',
                            borderBottom: activeTab === tab ? '2px solid var(--eco-accent-primary)' : 'none',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                            transition: 'all 0.3s ease',
                            boxShadow: activeTab === tab ? 'inset 0 -10px 20px rgba(0, 212, 189, 0.05)' : 'none'
                        }}
                    >
                        {tab === 'marketing' ? <><ImageIcon size={14} /> MARKETING</> :
                            tab === 'catalog' ? <><Package size={14} /> CATÁLOGO</> :
                                <><Grid size={14} /> GRILLA</>}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onPointerDown={(e) => e.stopPropagation()}>

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

                {/* Categories (Only Catalog) */}
                {activeTab === 'catalog' && !loading && categories.length > 1 && (
                    <div style={{ padding: '0 16px 16px 16px', display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }} className="custom-scroll">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    border: '1px solid',
                                    borderColor: selectedCategory === cat ? 'var(--eco-accent-primary)' : 'rgba(255,255,255,0.05)',
                                    backgroundColor: selectedCategory === cat ? 'rgba(0,212,189,0.05)' : 'rgba(255,255,255,0.02)',
                                    color: selectedCategory === cat ? 'var(--eco-accent-primary)' : '#666',
                                    fontSize: '10px', fontFamily: 'var(--eco-font-mono)', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grid */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }} className="custom-scroll">
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                            <Loader2 size={32} style={{ color: 'var(--accent-turquoise)', animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : visibleImages.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#444', padding: '60px 0' }}>Sin resultados</p>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                {visibleImages.map((img, i) => (
                                    <div key={`${img.url}-${i}`} draggable onDragStart={e => handleDragStart(e, img.url)}
                                        style={{ aspectRatio: '1/1', backgroundColor: '#111', borderRadius: '4px', overflow: 'hidden', cursor: 'grab', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}
                                    >
                                        <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                                        {activeTab === 'catalog' && <span style={{ position: 'absolute', top: '4px', left: '4px', backgroundColor: 'var(--accent-gold)', color: 'black', padding: '2px 5px', fontSize: '8px', fontWeight: '900', borderRadius: '2px' }}>PRODUCT</span>}
                                        {activeTab === 'grilla' && <span style={{ position: 'absolute', top: '4px', left: '4px', backgroundColor: 'var(--accent-turquoise)', color: 'black', padding: '2px 5px', fontSize: '8px', fontWeight: '900', borderRadius: '2px' }}>GRILLA</span>}
                                    </div>
                                ))}
                            </div>

                            {/* Load More */}
                            {currentImages.length > visibleCount && (
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 24)}
                                    style={{
                                        width: '100%', marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.05)',
                                        color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    CARGAR MÁS IMÁGENES <ChevronDown size={14} />
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>Arrastra imágenes a las celdas</p>
                </div>
            </div>

            <style jsx global>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: #000; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #555; }
            `}</style>
        </motion.div>
    );
}
