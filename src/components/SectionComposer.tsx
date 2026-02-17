'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Save, Trash2, X, Move, ChevronDown, ChevronUp, Image as ImageIcon, Search } from 'lucide-react';
import { WebContent, DynamicSection, LayoutBlock } from '@/hooks/useWebContent';
import { supabase } from '@/lib/supabase';

interface SectionComposerProps {
    isOpen: boolean;
    onClose: () => void;
    content: WebContent;
    onSave: (newSections: DynamicSection[]) => void;
    onChange?: (newSections: DynamicSection[]) => void;
}

export default function SectionComposer({ isOpen, onClose, content, onSave, onChange }: SectionComposerProps) {
    const [sections, setSections] = useState<DynamicSection[]>([]);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [blockTabs, setBlockTabs] = useState<Record<string, 'layout' | 'visual' | 'content'>>({});

    // Estados para el selector de imágenes de productos
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
    const [productImages, setProductImages] = useState<{ url: string, name: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTarget, setActiveTarget] = useState<{ sectionId: string, blockId: string } | null>(null);

    // Sincronizar estado interno
    useEffect(() => {
        if (isOpen && content?.sections) {
            const safeSections = Array.isArray(content.sections) ? content.sections : Object.values(content.sections);
            const parsed = JSON.parse(JSON.stringify(safeSections));
            setSections(parsed);
            if (parsed.length > 0 && !activeSectionId) {
                setActiveSectionId(parsed[0].id);
            }
        }
    }, [isOpen, content?.sections]);

    // EFECTO VISTA PREVIA EN VIVO
    useEffect(() => {
        if (onChange && sections.length > 0) {
            onChange(sections);
        }
    }, [sections, onChange]);

    // Cargar imágenes de productos desde Supabase
    useEffect(() => {
        const fetchImages = async () => {
            const { data, error } = await supabase
                .from('productos')
                .select('nombre, imagen_principal, imagenes_galeria');

            if (!error && data) {
                const allImages: { url: string, name: string }[] = [];
                data.forEach(item => {
                    if (item.imagen_principal) allImages.push({ url: item.imagen_principal, name: item.nombre });
                    if (Array.isArray(item.imagenes_galeria)) {
                        item.imagenes_galeria.forEach((img: string) => {
                            if (img && img !== item.imagen_principal) {
                                allImages.push({ url: img, name: item.nombre });
                            }
                        });
                    }
                });
                // Eliminar duplicados por URL
                const uniqueImages = allImages.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);
                setProductImages(uniqueImages);
            }
        };
        if (isOpen) fetchImages();
    }, [isOpen]);

    if (!isOpen) return null;

    const addNewSection = () => {
        const newSection: DynamicSection = {
            id: `section_${Date.now()}`,
            order: sections.length + 1,
            title1: 'NUEVA SECCIÓN SEO',
            paragraph1: 'Descripción optimizada para palabras clave orgánicas.',
            bgColor: '#050505',
            blocks: []
        };
        setSections([...sections, newSection]);
        setActiveSectionId(newSection.id);
    };


    const addBlock = (sectionId: string) => {
        const newSections = sections.map(s => {
            if (s.id !== sectionId) return s;
            const newBlock: LayoutBlock = {
                id: `block_${Date.now()}`,
                label: 'NUEVO BLOQUE',
                image: '',
                span: '4x2', // Ajustado para grilla 24x8 (equivalente al 4x1 anterior)
                col: 1,
                row: 1,
                zIndex: (s.blocks?.length || 0) + 1,
                opacity: 1,
                borderRadius: '0px',
                shadow: 'none',
                textAlign: 'center'
            };
            return { ...s, blocks: [...(s.blocks || []), newBlock] };
        });
        setSections(newSections);
    };

    const updateBlock = (sectionId: string, blockId: string, updates: Partial<LayoutBlock>) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                blocks: (s.blocks || []).map(b => b.id === blockId ? { ...b, ...updates } : b)
            };
        }));
    };

    const deleteSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const deleteBlock = (sectionId: string, blockId: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return { ...s, blocks: (s.blocks || []).filter(b => b.id !== blockId) };
        }));
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                x: '-50%',
                y: '-50%',
                width: '95vw',
                maxWidth: '1200px',
                height: '85vh',
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(0, 212, 189, 0.4)',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                color: 'white',
                fontFamily: 'sans-serif',
                cursor: 'default'
            }}
        >
            {/* Header / Drag Handle */}
            <div style={{
                padding: '20px',
                borderBottom: '1px solid #222',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#111',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                cursor: 'grab'
            }}
                onMouseDown={e => e.currentTarget.style.cursor = 'grabbing'}
                onMouseUp={e => e.currentTarget.style.cursor = 'grab'}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Layers size={22} style={{ color: '#00d4bd' }} />
                    <span style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '3px' }}>SECTION COMPOSER</span>
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }} className="custom-scroll">
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button
                        onClick={addNewSection}
                        style={{
                            flex: 1,
                            backgroundColor: '#111',
                            border: '1px solid #333',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> NUEVA SECCIÓN
                    </button>
                    <button
                        onClick={() => onSave(sections)}
                        style={{
                            flex: 1,
                            backgroundColor: '#00d4bd',
                            border: 'none',
                            color: '#000',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        <Save size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> GUARDAR
                    </button>
                </div>

                {/* BARRA DE PESTAÑAS (SECCIONES) */}
                <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '10px', overflowX: 'auto', whiteSpace: 'nowrap' }} className="custom-scroll-h">
                    {sections.map(section => (
                        <div key={section.id} style={{ display: 'flex', alignItems: 'center' }}>
                            <button
                                onClick={() => setActiveSectionId(section.id)}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: activeSectionId === section.id ? 'rgba(0, 212, 189, 0.1)' : 'transparent',
                                    border: '1px solid',
                                    borderColor: activeSectionId === section.id ? '#00d4bd' : '#333',
                                    color: activeSectionId === section.id ? '#00d4bd' : '#888',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}
                            >
                                {section.title1 || 'SIN TÍTULO'}
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addNewSection}
                        style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#00d4bd', borderRadius: '6px', cursor: 'pointer' }}
                        title="Nueva Sección"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => onSave(sections)}
                        style={{
                            backgroundColor: '#00d4bd',
                            border: 'none',
                            color: '#000',
                            padding: '10px 30px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(0, 212, 189, 0.3)'
                        }}
                    >
                        <Save size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> GUARDAR TODO
                    </button>
                </div>

                {/* CONTENIDO DE LA SECCIÓN ACTIVA */}
                {sections.find(s => s.id === activeSectionId) ? (() => {
                    const section = sections.find(s => s.id === activeSectionId)!;
                    return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 400px) 1fr', gap: '30px', flex: 1, overflow: 'hidden' }}>
                            {/* COLUMNA IZQUIERDA: CONFIG SECCIÓN (Scrollable) */}
                            <div style={{ backgroundColor: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #222', overflowY: 'auto' }} className="custom-scroll">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00d4bd', letterSpacing: '1px' }}>DISEÑO SECCIÓN</span>
                                    <button
                                        onClick={() => deleteSection(section.id)}
                                        style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', opacity: 0.6 }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px', fontWeight: 'bold' }}>TÍTULO PRINCIPAL</label>
                                        <input
                                            style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '12px', borderRadius: '6px', fontSize: '14px' }}
                                            value={section.title1 || ''}
                                            onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, title1: e.target.value } : s))}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px', fontWeight: 'bold' }}>DESCRIPCIÓN PRINCIPAL</label>
                                        <textarea
                                            style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '12px', borderRadius: '6px', fontSize: '14px', resize: 'none' }}
                                            rows={2}
                                            value={section.paragraph1 || ''}
                                            onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, paragraph1: e.target.value } : s))}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px' }}>TÍTULO 2</label>
                                            <input
                                                style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '10px', borderRadius: '6px', fontSize: '12px' }}
                                                value={section.title2 || ''}
                                                onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, title2: e.target.value } : s))}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px' }}>DESCRIPCIÓN 2</label>
                                            <input
                                                style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '10px', borderRadius: '6px', fontSize: '12px' }}
                                                value={section.paragraph2 || ''}
                                                onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, paragraph2: e.target.value } : s))}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px' }}>FONDO</label>
                                            <input type="color" value={section.bgColor || '#050505'} onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, bgColor: e.target.value } : s))} style={{ width: '100%', height: '35px', border: '1px solid #333', background: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px' }}>COLOR TÍTULO</label>
                                            <input type="color" value={section.titleColor || '#ffffff'} onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, titleColor: e.target.value } : s))} style={{ width: '100%', height: '35px', border: '1px solid #333', background: 'none' }} />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px' }}>TAMAÑO TÍTULO (em/px)</label>
                                        <input
                                            style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '10px', borderRadius: '6px', fontSize: '13px' }}
                                            value={section.titleSize || '4.5rem'}
                                            onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, titleSize: e.target.value } : s))}
                                        />
                                    </div>

                                    <div style={{ borderTop: '1px solid #222', paddingTop: '15px' }}>
                                        <span style={{ fontSize: '11px', color: '#00d4bd', fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>ESTILO DESCRIPCIÓN</span>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                            <select value={section.descAlign || 'left'} onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, descAlign: e.target.value as any } : s))} style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '8px', fontSize: '12px' }}>
                                                <option value="left">Izquierda</option>
                                                <option value="center">Centro</option>
                                                <option value="right">Derecha</option>
                                            </select>
                                            <input type="text" value={section.descSize || '1.2rem'} onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, descSize: e.target.value } : s))} style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '8px', fontSize: '12px' }} placeholder="Size" />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px' }}>GALERÍA INFERIOR (URLs ,)</label>
                                        <textarea
                                            style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '10px', borderRadius: '6px', fontSize: '12px', resize: 'none' }}
                                            rows={2}
                                            value={section.gallery?.join(', ') || ''}
                                            onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, gallery: e.target.value.split(',').map(u => u.trim()).filter(Boolean) } : s))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: BLOQUES (Scrollable) */}
                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }} className="custom-scroll">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'sticky', top: 0, backgroundColor: '#0a0a0a', padding: '10px 0', zIndex: 10 }}>
                                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#00d4bd', letterSpacing: '2px' }}>BLOQUES DE LA GRILLA (24x8)</span>
                                    <button
                                        onClick={() => addBlock(section.id)}
                                        style={{ backgroundColor: '#00d4bd', color: '#000', border: 'none', fontSize: '11px', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0, 212, 189, 0.4)' }}
                                    >
                                        + AÑADIR NUEVO BLOQUE
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', paddingBottom: '40px' }}>
                                    {(section.blocks || []).map(block => (
                                        <div key={block.id} style={{ backgroundColor: '#111', padding: '20px', borderRadius: '16px', border: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <input
                                                    style={{ background: 'none', border: 'none', color: '#00d4bd', fontSize: '15px', fontWeight: 900, width: '70%', outline: 'none' }}
                                                    value={block.label}
                                                    onChange={(e) => updateBlock(section.id, block.id, { label: e.target.value })}
                                                />
                                                <button onClick={() => deleteBlock(section.id, block.id)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* SISTEMA DE PESTAÑAS PARA BLOQUE */}
                                            <div style={{ display: 'flex', gap: '2px', backgroundColor: '#000', padding: '3px', borderRadius: '8px' }}>
                                                {[
                                                    { id: 'layout', label: 'POSICIÓN', icon: <Move size={12} /> },
                                                    { id: 'content', label: 'CONTENIDO', icon: <Layers size={12} /> },
                                                    { id: 'visual', label: 'EFECTOS', icon: <Plus size={12} /> }
                                                ].map(tab => {
                                                    const isActive = (blockTabs[block.id] || 'layout') === tab.id;
                                                    return (
                                                        <button
                                                            key={tab.id}
                                                            onClick={() => setBlockTabs({ ...blockTabs, [block.id]: tab.id as any })}
                                                            style={{
                                                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                                padding: '8px 4px', fontSize: '10px', fontWeight: 900, border: 'none', borderRadius: '6px',
                                                                cursor: 'pointer', backgroundColor: isActive ? '#1a1a1a' : 'transparent',
                                                                color: isActive ? '#00d4bd' : '#666', transition: 'all 0.3s'
                                                            }}
                                                        >
                                                            {tab.icon} {tab.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div style={{ minHeight: '160px' }}>
                                                {/* TAB: LAYOUT */}
                                                {(blockTabs[block.id] || 'layout') === 'layout' && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '10px', color: '#555', marginBottom: '5px', fontWeight: 'bold' }}>COLUMNA (1-24)</div>
                                                            <input type="number" value={block.col || 1} onChange={(e) => updateBlock(section.id, block.id, { col: parseInt(e.target.value) || 1 })} style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', fontSize: '14px', padding: '10px', borderRadius: '8px' }} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '10px', color: '#555', marginBottom: '5px', fontWeight: 'bold' }}>FILA (1-8)</div>
                                                            <input type="number" value={block.row || 1} onChange={(e) => updateBlock(section.id, block.id, { row: parseInt(e.target.value) || 1 })} style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', fontSize: '14px', padding: '10px', borderRadius: '8px' }} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '10px', color: '#555', marginBottom: '5px', fontWeight: 'bold' }}>TAMAÑO (WxH ej: 4x2)</div>
                                                            <input type="text" value={block.span || '4x2'} onChange={(e) => updateBlock(section.id, block.id, { span: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', fontSize: '14px', padding: '10px', borderRadius: '8px' }} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '10px', color: '#555', marginBottom: '5px', fontWeight: 'bold' }}>CAPA (Z-INDEX)</div>
                                                            <input type="number" value={block.zIndex || 1} onChange={(e) => updateBlock(section.id, block.id, { zIndex: parseInt(e.target.value) || 1 })} style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', fontSize: '14px', padding: '10px', borderRadius: '8px' }} />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* TAB: CONTENT */}
                                                {(blockTabs[block.id] === 'content') && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>TIPO</label>
                                                                <select value={block.type || 'image'} onChange={(e) => updateBlock(section.id, block.id, { type: e.target.value as any })} style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', fontSize: '12px', padding: '10px', borderRadius: '8px' }}>
                                                                    <option value="image">Imagen</option>
                                                                    <option value="text">Texto</option>
                                                                    <option value="both">Ambos</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>FONDO</label>
                                                                <input type="color" value={block.bgColor || '#111111'} onChange={(e) => updateBlock(section.id, block.id, { bgColor: e.target.value })} style={{ width: '100%', height: '35px', border: '1px solid #222', background: 'none' }} />
                                                            </div>
                                                        </div>

                                                        {block.type !== 'text' && (
                                                            <div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                    <label style={{ fontSize: '10px', color: '#efb810', fontWeight: 900 }}>GALERÍA / SLIDESHOW (URLs)</label>
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveTarget({ sectionId: section.id, blockId: block.id });
                                                                            setIsImagePickerOpen(true);
                                                                        }}
                                                                        style={{
                                                                            backgroundColor: 'rgba(0, 212, 189, 0.1)',
                                                                            border: '1px solid #00d4bd',
                                                                            color: '#00d4bd',
                                                                            fontSize: '9px',
                                                                            padding: '2px 8px',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px'
                                                                        }}
                                                                    >
                                                                        <ImageIcon size={10} /> BIBLIOTECA
                                                                    </button>
                                                                </div>
                                                                <textarea
                                                                    value={(block.gallery || []).join('\n')}
                                                                    onChange={(e) => updateBlock(section.id, block.id, { gallery: e.target.value.split('\n').filter(Boolean) })}
                                                                    style={{ width: '100%', background: '#000', border: '1px solid #222', color: '#00d4bd', fontSize: '11px', padding: '10px', minHeight: '80px', fontFamily: 'monospace', borderRadius: '8px' }}
                                                                    placeholder="Patea una URL por línea o usa el botón Biblioteca..."
                                                                />
                                                            </div>
                                                        )}

                                                        {(block.type === 'text' || block.type === 'both') && (
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '10px', color: '#555', marginBottom: '5px' }}>CONTENIDO TEXTO</label>
                                                                <textarea
                                                                    value={block.textContent || ''}
                                                                    onChange={(e) => updateBlock(section.id, block.id, { textContent: e.target.value })}
                                                                    style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', fontSize: '12px', padding: '10px', height: '60px', borderRadius: '8px' }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* TAB: VISUAL / EFFECTS */}
                                                {(blockTabs[block.id] === 'visual') && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '9px', color: '#555' }}>OPACIDAD</label>
                                                            <input type="range" min="0" max="1" step="0.1" value={block.opacity ?? 1} onChange={(e) => updateBlock(section.id, block.id, { opacity: parseFloat(e.target.value) })} style={{ width: '100%', accentColor: '#00d4bd' }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '9px', color: '#555' }}>REDONDEO</label>
                                                            <input type="text" value={block.borderRadius || '32px'} onChange={(e) => updateBlock(section.id, block.id, { borderRadius: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', padding: '8px', fontSize: '12px' }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '9px', color: '#555' }}>SOMBRA</label>
                                                            <select value={block.shadow || 'none'} onChange={(e) => updateBlock(section.id, block.id, { shadow: e.target.value as any })} style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', padding: '8px', fontSize: '11px' }}>
                                                                <option value="none">Sin Sombra</option>
                                                                <option value="soft">Suave</option>
                                                                <option value="strong">Neón</option>
                                                            </select>
                                                        </div>
                                                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px' }}>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#aaa', cursor: 'pointer' }}>
                                                                <input type="checkbox" checked={!!block.gradient} onChange={(e) => updateBlock(section.id, block.id, { gradient: e.target.checked })} /> GRADIENTE
                                                            </label>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#aaa', cursor: 'pointer' }}>
                                                                <input type="checkbox" checked={!!block.isCircle} onChange={(e) => updateBlock(section.id, block.id, { isCircle: e.target.checked })} /> CÍRCULO
                                                            </label>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#efb810', cursor: 'pointer' }}>
                                                                <input type="checkbox" checked={block.writingMode === 'vertical-rl'} onChange={(e) => updateBlock(section.id, block.id, { writingMode: e.target.checked ? 'vertical-rl' : 'horizontal-tb' })} /> VERTICAL
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })() : (
                    <div style={{ padding: '100px', textAlign: 'center', color: '#444' }}>
                        <Layers size={64} style={{ marginBottom: '20px', opacity: 0.1 }} />
                        <p style={{ letterSpacing: '2px', fontWeight: 900 }}>SELECCIONA UNA SECCIÓN PARA EDITAR</p>
                    </div>
                )}
            </div >

            {/* MODAL: SELECTOR DE IMÁGENES DE PRODUCTOS */}
            <AnimatePresence>
                {isImagePickerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                        }}
                        onClick={() => setIsImagePickerOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{
                                width: '100%', maxWidth: '800px', maxHeight: '80vh',
                                backgroundColor: '#111', borderRadius: '20px', border: '1px solid #333',
                                overflow: 'hidden', display: 'flex', flexDirection: 'column'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#00d4bd', fontSize: '16px', fontWeight: 900 }}>BIBLIOTECA DE PRODUCTOS</h3>
                                    <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '11px' }}>Selecciona imágenes para añadir al bloque</p>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                                        <input
                                            placeholder="Buscar producto..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            style={{ backgroundColor: '#000', border: '1px solid #222', color: 'white', padding: '8px 12px 8px 30px', borderRadius: '30px', fontSize: '12px' }}
                                        />
                                    </div>
                                    <button onClick={() => setIsImagePickerOpen(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }} className="custom-scroll">
                                {productImages
                                    .filter(img => img.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((img, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                if (activeTarget) {
                                                    const section = sections.find(s => s.id === activeTarget.sectionId);
                                                    if (section) {
                                                        const block = section.blocks?.find(b => b.id === activeTarget.blockId);
                                                        if (block) {
                                                            const currentGallery = block.gallery || [];
                                                            if (!currentGallery.includes(img.url)) {
                                                                updateBlock(activeTarget.sectionId, activeTarget.blockId, {
                                                                    gallery: [...currentGallery, img.url]
                                                                });
                                                            }
                                                        }
                                                    }
                                                }
                                                setIsImagePickerOpen(false);
                                            }}
                                            style={{
                                                cursor: 'pointer', borderRadius: '12px', overflow: 'hidden',
                                                border: '1px solid #222', position: 'relative', aspectRatio: '1/1',
                                                transition: 'all 0.3s'
                                            }}
                                            className="img-hover"
                                        >
                                            <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                                padding: '10px', fontSize: '10px', color: 'white'
                                            }}>
                                                {img.name.substring(0, 20)}...
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .custom-scroll::-webkit-scrollbar { width: 5px; }
                .custom-scroll::-webkit-scrollbar-track { background: #000; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
                .custom-scroll-h::-webkit-scrollbar { height: 5px; }
                .custom-scroll-h::-webkit-scrollbar-track { background: #000; }
                .custom-scroll-h::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
                .img-hover:hover { border-color: #00d4bd !important; transform: scale(1.05); }
            `}</style>
        </motion.div >
    );
}
