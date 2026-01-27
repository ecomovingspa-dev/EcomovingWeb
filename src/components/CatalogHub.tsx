'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Trash2, Star, CheckCircle2, Package, Layers, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PendingProduct {
    id: string;
    wholesaler: string;
    external_id: string;
    name: string;
    original_description: string;
    images: string[];
    technical_specs: any;
    found_at: string;
    status: string;
}

interface CatalogHubProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CatalogHub({ isOpen, onClose }: CatalogHubProps) {
    const [selectedWholesaler, setSelectedWholesaler] = useState('Todos');
    const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const wholesalers = ['Todos', 'Stocksur', 'Promoimport', 'ImBlasco', 'Zecat'];

    // Cargar productos del buffer
    useEffect(() => {
        if (isOpen) {
            fetchBuffer();
        }
    }, [isOpen]);

    const fetchBuffer = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('agent_buffer')
                .select('*')
                .eq('status', 'pending')
                .order('found_at', { ascending: false });

            if (error) throw error;
            setPendingProducts(data || []);
            if (data && data.length > 0 && !selectedProduct) {
                setSelectedProduct(data[0]);
                setActiveImage(data[0].images[0]);
            }
        } catch (error) {
            console.error('Error al cargar el buffer:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProductSelect = (p: PendingProduct) => {
        setSelectedProduct(p);
        setActiveImage(p.images[0]);
    };

    const handlePublish = async () => {
        if (!selectedProduct || !activeImage) return;

        try {
            // 1. Marcar como aprobado en Supabase
            const { error } = await supabase
                .from('agent_buffer')
                .update({ status: 'approved', images: [activeImage, ...selectedProduct.images.filter(i => i !== activeImage)] })
                .eq('id', selectedProduct.id);

            if (error) throw error;

            // 2. Aquí normalmente se integraría al catalog.json (en un flujo automatizado)
            // Por ahora, lo removemos de la lista local para reflejar que se "procesó"
            setPendingProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
            setSelectedProduct(null);

            alert('¡Producto Publicado! El agente lo integrará en la próxima actualización del catálogo.');
        } catch (error) {
            console.error('Error al publicar:', error);
        }
    };

    const handleReject = async () => {
        if (!selectedProduct) return;

        if (confirm('¿Estás seguro de que quieres eliminar este producto del buffer?')) {
            try {
                const { error } = await supabase
                    .from('agent_buffer')
                    .update({ status: 'rejected' })
                    .eq('id', selectedProduct.id);

                if (error) throw error;

                setPendingProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
                setSelectedProduct(null);
            } catch (error) {
                console.error('Error al rechazar:', error);
            }
        }
    };

    const filteredProducts = pendingProducts.filter(p => {
        const matchesWholesaler = selectedWholesaler === 'Todos' || p.wholesaler === selectedWholesaler;
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.external_id.toLowerCase().includes(search.toLowerCase());
        return matchesWholesaler && matchesSearch;
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        backdropFilter: 'blur(20px)',
                        zIndex: 100000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.98, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.98, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                        style={{
                            width: '96vw',
                            height: '92vh',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            backdropFilter: 'blur(30px) saturate(180%)',
                            borderRadius: '32px',
                            border: '1px solid rgba(0, 212, 189, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5), 0 0 80px rgba(0, 212, 189, 0.15)',
                        }}
                    >
                        {/* Header Premium */}
                        <div style={{ padding: '32px 60px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '16px', letterSpacing: '-0.5px' }}>
                                    <div style={{ padding: '8px', background: 'linear-gradient(135deg, #00d4bd 0%, #008f7a 100%)', borderRadius: '12px' }}>
                                        <Layers style={{ color: 'white', width: '28px', height: '28px' }} />
                                    </div>
                                    ECOMOVING <span style={{ color: '#00d4bd' }}>HUB</span>
                                </h2>
                                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: '500' }}>Centro de Curación de Catálogo Inteligente</p>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                {selectedProduct && (
                                    <button
                                        onClick={handleReject}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '16px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}
                                    >
                                        <Trash2 size={20} />
                                        ELIMINAR
                                    </button>
                                )}
                                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '50%', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.3s' }}>
                                    <X size={28} />
                                </button>
                            </div>
                        </div>

                        {/* Top Bar / Mega Filters */}
                        <div style={{ padding: '24px 60px', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', gap: '40px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {wholesalers.map(w => (
                                    <button
                                        key={w}
                                        onClick={() => setSelectedWholesaler(w)}
                                        style={{
                                            padding: '12px 28px',
                                            borderRadius: '14px',
                                            border: '1px solid',
                                            borderColor: selectedWholesaler === w ? '#00d4bd' : 'rgba(255,255,255,0.1)',
                                            backgroundColor: selectedWholesaler === w ? '#00d4bd' : 'transparent',
                                            color: selectedWholesaler === w ? 'black' : '#94a3b8',
                                            fontSize: '15px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px'
                                        }}
                                    >
                                        {w}
                                    </button>
                                ))}
                            </div>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', width: '22px', height: '22px', color: '#475569' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar en el catálogo del agente..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ width: '100%', padding: '18px 20px 18px 60px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontSize: '16px', outline: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '450px 1fr', overflow: 'hidden' }}>
                            {/* Left List */}
                            <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', padding: '32px 40px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '2px' }}>
                                    {loading ? 'Cargando buffer...' : `Nuevos Descubrimientos (${filteredProducts.length})`}
                                </p>

                                {loading ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                        <Loader2 className="animate-spin" color="#00d4bd" size={32} />
                                    </div>
                                ) : filteredProducts.map(p => (
                                    <motion.div
                                        key={p.id}
                                        onClick={() => handleProductSelect(p)}
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        style={{
                                            padding: '20px',
                                            backgroundColor: selectedProduct?.id === p.id ? 'rgba(0, 212, 189, 0.15)' : 'rgba(0, 212, 189, 0.03)',
                                            borderRadius: '24px',
                                            border: '1px solid',
                                            borderColor: selectedProduct?.id === p.id ? '#00d4bd' : 'rgba(0, 212, 189, 0.2)',
                                            cursor: 'pointer',
                                            marginBottom: '20px',
                                            display: 'flex',
                                            gap: '20px',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'black' }}>
                                            <img src={p.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '10px', color: '#00d4bd', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{p.wholesaler}</span>
                                                <span style={{ color: '#475569' }}>•</span>
                                                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>{p.external_id}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white', letterSpacing: '-0.3px' }}>{p.name}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Right Detail */}
                            <div style={{ padding: '60px', overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                {selectedProduct ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 1.2fr', gap: '80px', maxWidth: '1400px', margin: '0 auto' }}>
                                        {/* Column 1: Media */}
                                        <div>
                                            <h4 style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '32px', letterSpacing: '3px' }}>Selección Visual HD</h4>
                                            <div style={{ borderRadius: '32px', overflow: 'hidden', backgroundColor: 'black', aspectRatio: '1/1', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                                                <img src={activeImage || selectedProduct.images[0]} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20px' }} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                                                {selectedProduct.images.slice(0, 12).map((img, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setActiveImage(img)}
                                                        style={{
                                                            position: 'relative',
                                                            aspectRatio: '1/1',
                                                            borderRadius: '16px',
                                                            overflow: 'hidden',
                                                            border: '3px solid',
                                                            borderColor: activeImage === img ? '#00d4bd' : 'transparent',
                                                            backgroundColor: 'black',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Column 2: Content */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                                            <div>
                                                <h4 style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '32px', letterSpacing: '3px' }}>Narrativa & SEO de Vanguardia</h4>
                                                <div style={{ marginBottom: '32px' }}>
                                                    <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '12px', fontWeight: '800', letterSpacing: '2px' }}>TÍTULO CURADO POR IA</label>
                                                    <input type="text" defaultValue={selectedProduct.name} style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', color: 'white', fontSize: '28px', fontWeight: '800', outline: 'none' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '12px', fontWeight: '800', letterSpacing: '2px' }}>DESCRIPCIÓN EXPERIENCIAL (SEO READY)</label>
                                                    <textarea style={{ width: '100%', height: '220px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', color: '#cbd5e1', fontSize: '17px', lineHeight: '1.8', resize: 'none', outline: 'none' }} defaultValue={selectedProduct.original_description} />
                                                </div>
                                            </div>

                                            <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                <p style={{ margin: '0 0 24px 0', fontSize: '11px', color: '#64748b', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>Ficha Logística y Técnica</p>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Imágenes HD</p>
                                                        <p style={{ margin: '4px 0 0 0', fontSize: '32px', color: 'white', fontWeight: '800' }}>{selectedProduct.images.length}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Capacidad</p>
                                                        <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: 'white', fontWeight: '600' }}>{selectedProduct.technical_specs?.capacidad || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Packing</p>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                                            <CheckCircle2 size={24} color="#00d4bd" />
                                                            <span style={{ fontSize: '14px', color: 'white', fontWeight: '600' }}>LISTO</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handlePublish}
                                                style={{ backgroundColor: '#00d4bd', color: 'black', border: 'none', padding: '24px', borderRadius: '20px', fontWeight: '900', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}
                                            >
                                                <Package size={24} />
                                                PUBLICAR EN CATÁLOGO PREMIUM
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
                                        Selecciona un producto para comenzar la curación
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
