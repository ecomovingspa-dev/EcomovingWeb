'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Image as ImageIcon, X, Search, Loader2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CatalogHub from './CatalogHub';

interface MediaImage {
    name: string;
    url: string;
    source: 'marketing' | 'catalog';
    category?: string;
}

export default function MediaSidebar() {
    const [marketingImages, setMarketingImages] = useState<MediaImage[]>([]);
    const [catalogImages, setCatalogImages] = useState<MediaImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isHubOpen, setIsHubOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'marketing' | 'catalog'>('marketing');

    useEffect(() => {
        if (isOpen) {
            fetchAllImages();
        }
    }, [isOpen]);

    const fetchAllImages = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchMarketingImages(),
                fetchCatalogImages()
            ]);
        } catch (error) {
            console.error('Error fetching images:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMarketingImages = async () => {
        try {
            const { data, error } = await supabase
                .storage
                .from('imagenes-marketing')
                .list('', {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'name', order: 'desc' },
                });

            if (error) throw error;

            if (data) {
                const filteredData = data.filter(file =>
                    file.name !== '.emptyFolderPlaceholder' &&
                    !file.name.includes('/') &&
                    file.metadata
                );

                const urls = filteredData.map(file => {
                    const { data: { publicUrl } } = supabase
                        .storage
                        .from('imagenes-marketing')
                        .getPublicUrl(file.name);

                    return {
                        name: file.name,
                        url: publicUrl,
                        source: 'marketing' as const
                    };
                });
                setMarketingImages(urls);
            }
        } catch (error) {
            console.error('Error fetching marketing images:', error);
        }
    };

    const fetchCatalogImages = async () => {
        try {
            let dbProducts: { name?: string; category?: string; technical_specs?: { category?: string }; images?: string[]; image?: string }[] = [];
            try {
                const { data, error } = await supabase
                    .from('agent_buffer')
                    .select('*')
                    .eq('status', 'approved');
                if (!error && data) dbProducts = data;
            } catch (e) {
                console.error('Error fetching agent_buffer:', e);
            }

            const images: MediaImage[] = [];

            dbProducts.forEach((p) => {
                const productName = p.name || 'Producto';
                const category = p.category || p.technical_specs?.category || 'Otros';

                if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                    images.push({
                        name: productName,
                        url: p.images[0],
                        source: 'catalog',
                        category: category
                    });
                } else if (p.image) {
                    images.push({
                        name: productName,
                        url: p.image,
                        source: 'catalog',
                        category: category
                    });
                }
            });

            const uniqueImages = Array.from(new Map(images.map(img => [img.url, img])).values());
            setCatalogImages(uniqueImages);
        } catch (error) {
            console.error('Error fetching catalog images:', error);
        }
    };

    const currentImages = useMemo(() => {
        const baseList = activeTab === 'marketing' ? marketingImages : catalogImages;
        if (!search) return baseList;
        return baseList.filter(img =>
            img.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [activeTab, marketingImages, catalogImages, search]);

    const handleDragStart = (e: React.DragEvent, url: string) => {
        e.dataTransfer.setData('image_url', url);
        e.dataTransfer.setData('source', activeTab);
    };

    return (
        <>
            {/* Sidebar Biblioteca de Imágenes */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '360px',
                            backgroundColor: '#0a0a0a',
                            boxShadow: '-20px 0 80px rgba(0,0,0,0.8)',
                            zIndex: 100000,
                            display: 'flex',
                            flexDirection: 'column',
                            borderLeft: '1px solid rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(30px)'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '32px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: 'rgba(0,0,0,0.2)'
                        }}>
                            <h3 style={{
                                margin: 0,
                                fontWeight: '400',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                fontSize: '18px',
                                fontFamily: 'var(--font-heading)',
                                letterSpacing: '2px'
                            }}>
                                <div style={{ backgroundColor: 'var(--accent-turquoise)', padding: '5px', borderRadius: '4px', display: 'flex' }}>
                                    <ImageIcon style={{ width: '18px', height: '18px', color: 'black' }} />
                                </div>
                                BIBLIOTECA <span style={{ color: 'var(--accent-gold)' }}>IA</span>
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '50%', color: '#666' }}
                            >
                                <X style={{ width: '24px', height: '24px' }} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <button
                                onClick={() => setActiveTab('marketing')}
                                style={{
                                    flex: 1,
                                    padding: '16px 0',
                                    background: 'none',
                                    border: 'none',
                                    color: activeTab === 'marketing' ? 'var(--accent-turquoise)' : '#555',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    cursor: 'pointer',
                                    borderBottom: activeTab === 'marketing' ? '2px solid var(--accent-turquoise)' : '2px solid transparent',
                                    transition: 'all 0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <ImageIcon size={14} />
                                MARKETING
                            </button>
                            <button
                                onClick={() => setActiveTab('catalog')}
                                style={{
                                    flex: 1,
                                    padding: '16px 0',
                                    background: 'none',
                                    border: 'none',
                                    color: activeTab === 'catalog' ? 'var(--accent-turquoise)' : '#555',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    cursor: 'pointer',
                                    borderBottom: activeTab === 'catalog' ? '2px solid var(--accent-turquoise)' : '2px solid transparent',
                                    transition: 'all 0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Package size={14} />
                                CATÁLOGO
                            </button>
                        </div>

                        {/* Search */}
                        <div style={{ padding: '24px 24px 0 24px' }}>
                            <div style={{ position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#444' }} />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'marketing' ? "Buscar por nombre..." : "Buscar por nombre de producto..."}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 48px',
                                        backgroundColor: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '2px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        color: 'white',
                                        fontFamily: 'var(--font-body)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Grid de Imágenes */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="custom-scroll">
                            {loading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '20px' }}>
                                    <Loader2 style={{ width: '40px', height: '40px', color: 'var(--accent-turquoise)', animation: 'spin 1s linear infinite' }} />
                                    <p style={{ margin: 0, fontSize: '11px', color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px' }}>Sincronizando...</p>
                                </div>
                            ) : currentImages.length === 0 ? (
                                <p style={{ textAlign: 'center', fontSize: '14px', color: '#444', padding: '100px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Sin resultados.</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                    {currentImages.map((img, idx) => (
                                        <div
                                            key={`${img.url}-${idx}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, img.url)}
                                            style={{
                                                position: 'relative',
                                                aspectRatio: '1/1',
                                                backgroundColor: 'black',
                                                borderRadius: '2px',
                                                overflow: 'hidden',
                                                cursor: 'grab',
                                                border: '1px solid rgba(255,255,255,0.03)',
                                                transition: 'all 0.3s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--accent-turquoise)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)';
                                            }}
                                            title={img.name}
                                        >
                                            <img
                                                src={img.url}
                                                alt={img.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    opacity: 0.8
                                                }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Error';
                                                }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                backgroundColor: 'rgba(0,0,0,0.6)',
                                                opacity: 0,
                                                transition: 'opacity 0.3s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '12px'
                                            }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                                            >
                                                <span style={{
                                                    fontSize: '10px',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    textAlign: 'center',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px'
                                                }}>
                                                    {img.name}
                                                </span>
                                            </div>
                                            {activeTab === 'catalog' && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '5px',
                                                    left: '5px',
                                                    backgroundColor: 'var(--accent-gold)',
                                                    color: 'black',
                                                    padding: '2px 6px',
                                                    fontSize: '8px',
                                                    fontWeight: '900',
                                                    borderRadius: '2px',
                                                    letterSpacing: '1px'
                                                }}>
                                                    PRODUCT
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer info */}
                        <div style={{
                            padding: '16px 24px',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            textAlign: 'center'
                        }}>
                            <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>
                                Arrastra imágenes a las celdas de la landing
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Componentes externos */}
            <CatalogHub
                isOpen={isHubOpen}
                onClose={() => setIsHubOpen(false)}
            />

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .custom-scroll::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scroll::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.02);
                }
                .custom-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                }
                .custom-scroll::-webkit-scrollbar-thumb:hover {
                    background: var(--accent-turquoise);
                }
            `}</style>
        </>
    );
}
