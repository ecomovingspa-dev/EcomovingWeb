'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Save, Trash2, X, Move, ChevronDown, ChevronUp, Image as ImageIcon, Search, FileText, Sparkles, Loader2 } from 'lucide-react';
import { WebContent, DynamicSection, LayoutBlock } from '@/hooks/useWebContent';
import { CATHEDRAL_TEMPLATE_2026 } from '@/data/template2026';
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
    const [blockTabs, setBlockTabs] = useState<Record<string, 'layout' | 'visual' | 'content' | 'header'>>({});

    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
    const [pickerTab, setPickerTab] = useState<'grilla' | 'catalog' | 'marketing'>('grilla');
    const [allImages, setAllImages] = useState<{ url: string, name: string, source: string }[]>([]);
    const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTarget, setActiveTarget] = useState<{ sectionId: string, blockId: string } | null>(null);
    const [generatingBlockId, setGeneratingBlockId] = useState<string | null>(null);
    const [loadingImages, setLoadingImages] = useState(false);

    // Sincronización única: Forzar modo 'Lienzo Infinito'
    useEffect(() => {
        if (isOpen) {
            let masterSection: DynamicSection | undefined;

            if (content?.sections) {
                const safeSections = (Array.isArray(content.sections) ? content.sections : Object.values(content.sections)) as DynamicSection[];
                masterSection = safeSections.find(s => s.id === 'infinite_grid');
            }

            if (masterSection) {
                setSections([masterSection]);
                setActiveSectionId('infinite_grid');
            } else {
                // Si no existe, inicializamos el Lienzo Infinito vacío
                const newMaster: DynamicSection = {
                    id: 'infinite_grid',
                    order: 1,
                    title1: 'LIENZO INFINITO',
                    paragraph1: 'Grid maestra de 24 columnas.',
                    bgColor: '#0a0a0a',
                    blocks: []
                };
                setSections([newMaster]);
                setActiveSectionId('infinite_grid');
            }
        }
    }, [isOpen, content?.sections]);

    // EFECTO VISTA PREVIA EN VIVO
    useEffect(() => {
        // Solo emitimos cambios si tenemos la grid maestra cargada
        if (onChange && sections.length > 0 && sections[0].id === 'infinite_grid') {
            onChange(sections);
        }
    }, [sections, onChange]);

    // FETCH UNIFICADO: GRILLA, CATÁLOGO Y MARKETING
    const fetchAllSources = async () => {
        setLoadingImages(true);
        try {
            const results: { url: string, name: string, source: string }[] = [];

            // 1. Catálogo (Tabla productos)
            const { data: prodData } = await supabase.from('productos').select('nombre, imagen_principal, imagenes_galeria');
            if (prodData) {
                prodData.forEach(p => {
                    if (p.imagen_principal) results.push({ url: p.imagen_principal, name: p.nombre, source: 'catalog' });
                    (p.imagenes_galeria || []).forEach((img: string) => {
                        if (img && img !== p.imagen_principal) results.push({ url: img, name: p.nombre, source: 'catalog' });
                    });
                });
            }

            // 2. Grilla (Carpeta grilla en bucket principal)
            const { data: grillaFiles } = await supabase.storage.from('imagenes-marketing').list('grilla');
            if (grillaFiles) {
                grillaFiles.forEach(f => {
                    if (f.name !== '.emptyKeepFile') {
                        const { data: { publicUrl } } = supabase.storage.from('imagenes-marketing').getPublicUrl(`grilla/${f.name}`);
                        results.push({ url: publicUrl, name: f.name, source: 'grilla' });
                    }
                });
            }

            // 3. Marketing (Raíz de imagenes-marketing)
            const { data: mktFiles } = await supabase.storage.from('imagenes-marketing').list('');
            if (mktFiles) {
                mktFiles.forEach(f => {
                    // Evitamos carpetas y archivos ocultos, solo archivos en la raíz
                    if (f.name !== '.emptyKeepFile' && !['grilla', 'catalog', 'catalog-manual', 'catalog-live', 'marketing'].includes(f.name)) {
                        const { data: { publicUrl } } = supabase.storage.from('imagenes-marketing').getPublicUrl(f.name);
                        results.push({ url: publicUrl, name: f.name, source: 'marketing' });
                    }
                });
            }

            setAllImages(results);
        } catch (err) {
            console.error("Error unificando biblioteca:", err);
        } finally {
            setLoadingImages(false);
        }
    };

    useEffect(() => {
        if (isImagePickerOpen) fetchAllSources();
    }, [isImagePickerOpen]);

    if (!isOpen) return null;



    const addBlock = (sectionId: string) => {
        // Siempre añadimos a la grid maestra
        const targetId = 'infinite_grid';

        setSections(prev => prev.map(s => {
            if (s.id !== targetId) return s;

            // Calcular posición inteligente (siguiente fila disponible)
            const lastBlock = s.blocks[s.blocks.length - 1];
            const nextRow = lastBlock ? (lastBlock.row + 3) : 1; // Espacio vertical

            const newBlock: LayoutBlock = {
                id: `block_${Date.now()}`,
                label: 'BLOQUE NUEVO',
                image: '',
                span: '12x8', // Adaptado a grilla 48x48
                col: 1,
                row: nextRow,
                zIndex: 10,
                opacity: 1,
                borderRadius: '0px',
                shadow: 'none',
                textAlign: 'center'
            };
            return { ...s, blocks: [...(s.blocks || []), newBlock] };
        }));
    };

    const updateBlock = (sectionId: string, blockId: string, updates: Partial<LayoutBlock>) => {
        setSections(sections.map(s => {
            if (s.id !== 'infinite_grid') return s;
            return {
                ...s,
                blocks: (s.blocks || []).map(b => b.id === blockId ? { ...b, ...updates } : b)
            };
        }));
    };

    // Deshabilitado: No permitir crear más secciones, solo bloques
    const addNewSection = () => { };

    // Deshabilitado: No borrar la grid maestra
    const deleteSection = (id: string) => { };

    const deleteBlock = (sectionId: string, blockId: string) => {
        setSections(sections.map(s => {
            if (s.id !== 'infinite_grid') return s;
            return { ...s, blocks: (s.blocks || []).filter(b => b.id !== blockId) };
        }));
    };

    // --- AI GENERATION LOGIC ---

    const handleMagicGenerate = async (sectionId: string, block: LayoutBlock) => {
        if (!block.label || block.label.trim().length === 0) {
            alert('⚠️ Primero escribe un IDENTIFICADOR (ej: "Botellas, Mugs") para que la IA sepa qué buscar.');
            return;
        }

        setGeneratingBlockId(block.id);

        try {
            // 1. Lógica de Búsqueda Mejorada: Soporte para múltiples términos (ej: "botella, mug")
            const searchTerms = block.label.split(',').map(s => s.trim()).filter(s => s.length > 0);
            let combinedContext = [];

            // Buscamos productos para CADA término por separado
            for (const term of searchTerms) {
                const { data: products } = await supabase
                    .from('productos')
                    .select('nombre, descripcion, material, features')
                    .ilike('nombre', `%${term}%`)
                    .limit(2); // Traemos 2 de cada tipo

                if (products && products.length > 0) {
                    const termContext = products.map(p =>
                        `[TIPO: ${term.toUpperCase()} -> Material: ${p.material}, Rasgos: ${p.features?.slice(0, 3)}]`
                    ).join('; ');
                    combinedContext.push(termContext);
                }
            }

            const finalContextString = combinedContext.join(' | ');
            console.log("Contexto Combinado:", finalContextString);

            // 2. Generar TÍTULO FUSIONADO
            const titleRes = await fetch('/api/seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'improve',
                    text: `Crear título que fusione: ${block.label}`,
                    section: 'Grid Producto',
                    context: `DATOS TÉCNICOS: ${finalContextString || 'Sin datos específicos'}. MISION: Crear un título corto (3-6 palabras) que integre coherentemente los productos mencionados. Tono: Corporativo Premium.`
                })
            });
            const titleJson = await titleRes.json();
            const cleanTitle = (titleJson.data?.improved || block.label).replace(/^["']|["']$/g, '');

            // 3. Generar PÁRRAFO INTEGRADO
            const descRes = await fetch('/api/seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'improve',
                    text: `Redactar párrafo persuasivo y detallado sobre: ${block.label}`,
                    section: 'Grid Producto',
                    context: `USAR DATOS DEL CATÁLOGO: ${finalContextString || 'Sin datos'}. MISION: Redactar un párrafo comercial extenso (40-50 palabras). DESTACAR: Calidad de materiales (acero 304, bambú, cerámica), durabilidad, diseño premium y el impacto positivo para la marca en entornos corporativos. Tono: Experto y sofisticado.`
                })
            });
            const descJson = await descRes.json();
            const cleanDesc = (descJson.data?.improved || "Descripción técnica detallada no disponible.").replace(/^["']|["']$/g, '');

            // 4. Actualizar Bloque
            updateBlock(sectionId, block.id, {
                blockTitle: cleanTitle,
                blockParagraph: cleanDesc
            });

        } catch (error) {
            console.error("Error generando contenido IA:", error);
            alert("Error conectando con el redactor IA.");
        } finally {
            setGeneratingBlockId(null);
        }
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
                maxWidth: '1100px',
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
                    {/* Botón eliminado por solicitud: solo se mantiene el superior */}
                </div>

                {/* CONTENIDO DE LA SECCIÓN ACTIVA */}
                {sections.find(s => s.id === activeSectionId) ? (() => {
                    const section = sections.find(s => s.id === activeSectionId)!;
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

                            {/* BARRA DE HERRAMIENTAS GLOBAL (Antes Panel Izquierdo) */}
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px', padding: '15px 25px', backgroundColor: '#0c0c0c', borderRadius: '12px', border: '1px solid rgba(0, 212, 189, 0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Sparkles size={16} style={{ color: 'var(--eco-accent-primary)' }} />
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--eco-accent-primary)', letterSpacing: '2px', textTransform: 'uppercase' }}>CONFIGURACIÓN DEL LIENZO</span>
                                </div>

                                <div style={{ width: '1px', height: '20px', backgroundColor: '#333', margin: '0 10px' }} />

                                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#888', cursor: 'pointer', transition: 'color 0.3s' }} className="hover-text-white">
                                    COLOR DE FONDO
                                    <input
                                        type="color"
                                        value={section.bgColor || '#050505'}
                                        onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, bgColor: e.target.value } : s))}
                                        style={{ width: '24px', height: '24px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '4px' }}
                                    />
                                </label>
                            </div>

                            {/* ÁREA DE BLOQUES (Full Width) */}
                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }} className="custom-scroll">

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'sticky', top: 0, backgroundColor: '#0a0a0a', padding: '10px 0', zIndex: 10 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--eco-accent-primary)', letterSpacing: '3px' }}>COMPOSICIÓN DE GRILLA</span>
                                        <span style={{ fontSize: '9px', color: '#555', letterSpacing: '1px' }}>MICRO-RESOLUCIÓN ACTIVADA (48 COLUMNAS)</span>
                                    </div>
                                    <button
                                        onClick={() => addBlock(section.id)}
                                        style={{ backgroundColor: '#00d4bd', color: '#000', border: 'none', fontSize: '11px', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0, 212, 189, 0.4)' }}
                                    >
                                        + AÑADIR NUEVO BLOQUE
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px', paddingBottom: '40px' }}>
                                    {(section.blocks || []).map(block => (
                                        <div key={block.id} style={{ backgroundColor: '#111', padding: '20px', borderRadius: '16px', border: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative' }}>
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', fontSize: '10px', color: '#555', marginBottom: '4px', fontWeight: 'bold', letterSpacing: '0.5px' }}>IDENTIFICADOR DEL BLOQUE (REF. SEO)</label>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                                    <input
                                                        style={{
                                                            background: '#050505',
                                                            border: '1px solid #333',
                                                            color: '#00d4bd',
                                                            fontSize: '13px',
                                                            fontWeight: 900,
                                                            width: '100%',
                                                            outline: 'none',
                                                            padding: '10px 12px',
                                                            borderRadius: '6px',
                                                            letterSpacing: '0.5px'
                                                        }}
                                                        value={block.label}
                                                        onChange={(e) => updateBlock(section.id, block.id, { label: e.target.value })}
                                                        placeholder="Ej: Botella Térmica Negra"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('¿Eliminar este bloque?')) deleteBlock(section.id, block.id);
                                                        }}
                                                        style={{
                                                            background: 'rgba(255, 68, 68, 0.1)',
                                                            border: '1px solid rgba(255, 68, 68, 0.3)',
                                                            color: '#ff4444',
                                                            cursor: 'pointer',
                                                            padding: '8px',
                                                            borderRadius: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                        title="Eliminar Bloque"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* SISTEMA DE PESTAÑAS PARA BLOQUE */}
                                            <div style={{ display: 'flex', gap: '2px', backgroundColor: '#000', padding: '3px', borderRadius: '8px' }}>
                                                {[
                                                    { id: 'layout', label: 'POSICIÓN', icon: <Move size={12} /> },
                                                    { id: 'header', label: 'ENCABEZADO', icon: <FileText size={12} /> },
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
                                                            <div style={{ fontSize: '10px', color: '#555', marginBottom: '5px', fontWeight: 'bold' }}>COLUMNA (1-48)</div>
                                                            <input type="number" value={block.col || 1} onChange={(e) => updateBlock(section.id, block.id, { col: parseInt(e.target.value) || 1 })} style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', fontSize: '14px', padding: '10px', borderRadius: '8px' }} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '10px', color: '#555', marginBottom: '5px', fontWeight: 'bold' }}>FILA (PRECISIÓN)</div>
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

                                                {/* TAB: HEADER */}
                                                {(blockTabs[block.id] === 'header') && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                        <button
                                                            onClick={() => handleMagicGenerate(section.id, block)}
                                                            disabled={generatingBlockId === block.id}
                                                            style={{
                                                                background: 'linear-gradient(90deg, rgba(0,212,189,0.1) 0%, rgba(212,175,55,0.1) 100%)',
                                                                border: '1px solid rgba(0,212,189,0.3)',
                                                                color: '#00d4bd',
                                                                padding: '12px',
                                                                borderRadius: '8px',
                                                                cursor: generatingBlockId === block.id ? 'wait' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                                fontSize: '11px',
                                                                fontWeight: 900,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '1px'
                                                            }}
                                                        >
                                                            {generatingBlockId === block.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                                            {generatingBlockId === block.id ? 'ANALIZANDO CATÁLOGO...' : 'GENERAR CON DATOS DEL CATÁLOGO'}
                                                        </button>
                                                        <div>
                                                            <div style={{ fontSize: '10px', color: '#555', marginBottom: '5px', fontWeight: 'bold' }}>TÍTULO DE BLOQUE</div>
                                                            <input
                                                                type="text"
                                                                value={block.blockTitle || ''}
                                                                onChange={(e) => updateBlock(section.id, block.id, { blockTitle: e.target.value })}
                                                                placeholder="Ej: Innovación Sostenible"
                                                                style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', fontSize: '14px', padding: '10px', borderRadius: '8px' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '10px', color: '#555', marginBottom: '5px', fontWeight: 'bold' }}>PÁRRAFO / BAJADA</div>
                                                            <textarea
                                                                value={block.blockParagraph || ''}
                                                                onChange={(e) => updateBlock(section.id, block.id, { blockParagraph: e.target.value })}
                                                                placeholder="Descripción corta que acompaña al bloque..."
                                                                rows={3}
                                                                style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', fontSize: '12px', padding: '10px', borderRadius: '8px', resize: 'vertical' }}
                                                            />
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #222' }}>
                                                            <div style={{ gridColumn: 'span 2', fontSize: '10px', color: '#00d4bd', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '5px' }}>
                                                                🎨 ESTILO DE TIPOGRAFÍA
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>TAMAÑO TÍTULO</label>
                                                                <select
                                                                    value={block.titleSize || '24px'}
                                                                    onChange={(e) => updateBlock(section.id, block.id, { titleSize: e.target.value })}
                                                                    style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', padding: '8px', fontSize: '11px', borderRadius: '6px' }}
                                                                >
                                                                    <option value="18px">Pequeño (18px)</option>
                                                                    <option value="24px">Medio (24px)</option>
                                                                    <option value="32px">Grande (32px)</option>
                                                                    <option value="48px">Gigante (48px)</option>
                                                                    <option value="64px">Massive (64px)</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>COLOR TEXTO</label>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <input
                                                                        type="color"
                                                                        value={block.textColor || '#ffffff'}
                                                                        onChange={(e) => updateBlock(section.id, block.id, { textColor: e.target.value })}
                                                                        style={{ width: '30px', height: '30px', border: 'none', background: 'none', cursor: 'pointer' }}
                                                                    />
                                                                    <span style={{ fontSize: '10px', color: '#666' }}>{block.textColor || '#fff'}</span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>ALINEACIÓN</label>
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    {['left', 'center', 'right'].map(align => (
                                                                        <button
                                                                            key={align}
                                                                            onClick={() => updateBlock(section.id, block.id, { textAlign: align as any })}
                                                                            style={{
                                                                                flex: 1,
                                                                                padding: '6px',
                                                                                background: block.textAlign === align ? '#00d4bd' : '#111',
                                                                                color: block.textAlign === align ? '#000' : '#666',
                                                                                border: '1px solid #222',
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer',
                                                                                fontSize: '10px'
                                                                            }}
                                                                        >
                                                                            {align === 'left' ? 'IZQ' : align === 'center' ? 'CEN' : 'DER'}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>PESO FUENTE</label>
                                                                <select
                                                                    value={block.fontWeight || '700'}
                                                                    onChange={(e) => updateBlock(section.id, block.id, { fontWeight: e.target.value })}
                                                                    style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', padding: '8px', fontSize: '11px', borderRadius: '6px' }}
                                                                >
                                                                    <option value="400">Normal (400)</option>
                                                                    <option value="600">Medio (600)</option>
                                                                    <option value="700">Bold (700)</option>
                                                                    <option value="900">Black (900)</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>TRANSFORMACIÓN</label>
                                                                <select
                                                                    value={block.textTransform || 'none'}
                                                                    onChange={(e) => updateBlock(section.id, block.id, { textTransform: e.target.value as any })}
                                                                    style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', padding: '8px', fontSize: '11px', borderRadius: '6px' }}
                                                                >
                                                                    <option value="none">Normal</option>
                                                                    <option value="uppercase">MAYÚSCULAS</option>
                                                                    <option value="lowercase">minúsculas</option>
                                                                    <option value="capitalize">Capitalizar</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>ESPACIADO (TRACKING)</label>
                                                                <select
                                                                    value={block.letterSpacing || 'normal'}
                                                                    onChange={(e) => updateBlock(section.id, block.id, { letterSpacing: e.target.value })}
                                                                    style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', padding: '8px', fontSize: '11px', borderRadius: '6px' }}
                                                                >
                                                                    <option value="normal">Normal</option>
                                                                    <option value="1px">Amplio (1px)</option>
                                                                    <option value="2px">Muy Amplio (2px)</option>
                                                                    <option value="4px">Extra (4px)</option>
                                                                    <option value="-1px">Compacto (-1px)</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>INTERLINEADO</label>
                                                                <select
                                                                    value={block.lineHeight || '1.5'}
                                                                    onChange={(e) => updateBlock(section.id, block.id, { lineHeight: e.target.value })}
                                                                    style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', padding: '8px', fontSize: '11px', borderRadius: '6px' }}
                                                                >
                                                                    <option value="1.2">Compacto (1.2)</option>
                                                                    <option value="1.5">Normal (1.5)</option>
                                                                    <option value="1.8">Relajado (1.8)</option>
                                                                    <option value="2.0">Abierto (2.0)</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>ESTILO / FAMILIA</label>
                                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                                    <button
                                                                        onClick={() => updateBlock(section.id, block.id, { fontStyle: block.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                                                        style={{ flex: 1, background: block.fontStyle === 'italic' ? '#00d4bd' : '#111', color: block.fontStyle === 'italic' ? '#000' : '#fff', border: '1px solid #222', borderRadius: '4px', fontSize: '10px', fontStyle: 'italic', cursor: 'pointer' }}
                                                                    >
                                                                        I
                                                                    </button>
                                                                    <select
                                                                        value={block.fontFamily || 'sans'}
                                                                        onChange={(e) => updateBlock(section.id, block.id, { fontFamily: e.target.value as any })}
                                                                        style={{ flex: 3, background: '#000', border: '1px solid #222', color: 'white', fontSize: '10px', borderRadius: '4px' }}
                                                                    >
                                                                        <option value="sans">Sans (Moderna)</option>
                                                                        <option value="serif">Serif (Elegante)</option>
                                                                        <option value="mono">Mono (Técnica)</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: '9px', color: '#444', fontStyle: 'italic' }}>
                                                            * Este contenido aparecerá integrado visualmente con el bloque.
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

                                                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>ANIMACIÓN SLIDESHOW</label>
                                                                        <select
                                                                            value={block.galleryAnimation || 'fade'}
                                                                            onChange={(e) => updateBlock(section.id, block.id, { galleryAnimation: e.target.value as any })}
                                                                            style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', padding: '8px', fontSize: '11px', borderRadius: '6px' }}
                                                                        >
                                                                            <option value="fade">Desvanecer (Fade)</option>
                                                                            <option value="slide-h">Deslizar Horizontal</option>
                                                                            <option value="slide-v">Deslizar Vertical</option>
                                                                            <option value="zoom">Zoom Suave</option>
                                                                            <option value="none">Sin Animación</option>
                                                                        </select>
                                                                    </div>
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

                                                        {/* TRANSFORMACIÓN EXPERTA */}
                                                        <div style={{ gridColumn: 'span 2', borderTop: '1px solid #222', paddingTop: '15px', marginTop: '5px' }}>
                                                            <label style={{ display: 'block', fontSize: '10px', color: '#00d4bd', fontWeight: 'bold', marginBottom: '10px', letterSpacing: '1px' }}>TRANSFORMACIÓN EXPERTA</label>

                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                                {/* Zoom */}
                                                                <div style={{ gridColumn: 'span 2' }}>
                                                                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#888', marginBottom: '5px' }}>
                                                                        <span>ZOOM (ALEJAR / ACERCAR)</span>
                                                                        <span>{(block.transform_zoom || 1).toFixed(1)}x</span>
                                                                    </label>
                                                                    <input
                                                                        type="range" min="0.5" max="3" step="0.1"
                                                                        value={block.transform_zoom || 1}
                                                                        onChange={(e) => updateBlock(section.id, block.id, { transform_zoom: parseFloat(e.target.value) })}
                                                                        style={{ width: '100%', accentColor: '#00d4bd' }}
                                                                    />
                                                                </div>

                                                                {/* Posición X */}
                                                                <div>
                                                                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#888', marginBottom: '5px' }}>
                                                                        <span>POSICIÓN X</span>
                                                                        <span>{block.transform_posX ?? 50}%</span>
                                                                    </label>
                                                                    <input
                                                                        type="range" min="0" max="100" step="1"
                                                                        value={block.transform_posX ?? 50}
                                                                        onChange={(e) => updateBlock(section.id, block.id, { transform_posX: parseInt(e.target.value) })}
                                                                        style={{ width: '100%', accentColor: '#00d4bd' }}
                                                                    />
                                                                </div>

                                                                {/* Posición Y */}
                                                                <div>
                                                                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#888', marginBottom: '5px' }}>
                                                                        <span>POSICIÓN Y</span>
                                                                        <span>{block.transform_posY ?? 50}%</span>
                                                                    </label>
                                                                    <input
                                                                        type="range" min="0" max="100" step="1"
                                                                        value={block.transform_posY ?? 50}
                                                                        onChange={(e) => updateBlock(section.id, block.id, { transform_posY: parseInt(e.target.value) })}
                                                                        style={{ width: '100%', accentColor: '#00d4bd' }}
                                                                    />
                                                                </div>

                                                                {/* Aspect Ratio Manual Override */}
                                                                <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                                                                    <label style={{ display: 'block', fontSize: '9px', color: '#888', marginBottom: '5px' }}>ASPECT RATIO (Forzado)</label>
                                                                    <select
                                                                        value={block.transform_aspectRatio || 'auto'}
                                                                        onChange={(e) => updateBlock(section.id, block.id, { transform_aspectRatio: e.target.value })}
                                                                        style={{ width: '100%', background: '#000', border: '1px solid #222', color: 'white', padding: '8px', fontSize: '11px' }}
                                                                    >
                                                                        <option value="auto">Automático (Grid)</option>
                                                                        <option value="1/1">Cuadrado (1:1)</option>
                                                                        <option value="4/3">Estándar (4:3)</option>
                                                                        <option value="16/9">Panorámico (16:9)</option>
                                                                        <option value="9/16">Vertical Móvil (9:16)</option>
                                                                        <option value="2/3">Vertical Poster (2:3)</option>
                                                                    </select>
                                                                </div>
                                                            </div>
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
                            <div style={{ padding: '20px', borderBottom: '1px solid #222' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: 'var(--eco-accent-primary)', fontSize: '18px', fontFamily: 'var(--eco-font-display)', letterSpacing: '2px' }}>BIBLIOTECA UNIFICADA</h3>
                                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '10px', fontFamily: 'var(--eco-font-mono)' }}>ORIGEN: STORAGE / CATÁLOGO / MARKETING</p>
                                    </div>
                                    <button onClick={() => setIsImagePickerOpen(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
                                </div>

                                {/* Pestañas del Picker */}
                                <div style={{ display: 'flex', gap: '2px', background: '#111', padding: '4px', borderRadius: '8px', marginBottom: '15px' }}>
                                    {['grilla', 'catalog', 'marketing'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setPickerTab(tab as any)}
                                            style={{
                                                flex: 1, padding: '8px', border: 'none', borderRadius: '6px',
                                                background: pickerTab === tab ? 'var(--eco-accent-primary)' : 'transparent',
                                                color: pickerTab === tab ? '#000' : '#888',
                                                fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer'
                                            }}
                                        >
                                            {tab === 'catalog' ? 'Catálogo' : tab.toUpperCase()}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                                    <input
                                        placeholder="Filtrar por nombre..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        style={{ width: '100%', backgroundColor: '#000', border: '1px solid #222', color: 'white', padding: '12px 12px 12px 40px', borderRadius: '8px', fontSize: '12px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                                {/* Sidebar para Catálogo (Listado de Nombres) */}
                                {pickerTab === 'catalog' && (
                                    <div style={{ width: '250px', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.3)' }}>
                                        <div style={{ padding: '15px', fontSize: '10px', color: '#444', fontWeight: 'bold', letterSpacing: '1px', borderBottom: '1px solid #222' }}>
                                            LISTADO DE PRODUCTOS
                                        </div>
                                        <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scroll">
                                            {Array.from(new Set(allImages.filter(img => img.source === 'catalog').map(img => img.name)))
                                                .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                .map(name => (
                                                    <div
                                                        key={name}
                                                        onClick={() => setSelectedCatalogProduct(name)}
                                                        style={{
                                                            padding: '12px 15px',
                                                            fontSize: '11px',
                                                            color: selectedCatalogProduct === name ? 'var(--eco-accent-primary)' : '#aaa',
                                                            background: selectedCatalogProduct === name ? 'rgba(0,212,189,0.05)' : 'transparent',
                                                            cursor: 'pointer',
                                                            borderLeft: selectedCatalogProduct === name ? '3px solid var(--eco-accent-primary)' : '3px solid transparent',
                                                            transition: 'all 0.2s',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            fontFamily: 'var(--eco-font-mono)',
                                                            fontWeight: selectedCatalogProduct === name ? 'bold' : 'normal'
                                                        }}
                                                    >
                                                        {name}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Área de Visor / Grid */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    {pickerTab === 'catalog' && selectedCatalogProduct && (
                                        <div style={{ padding: '15px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #222' }}>
                                            <span style={{ fontSize: '9px', color: '#555', letterSpacing: '1px' }}>VIENDO IMÁGENES DE:</span>
                                            <h4 style={{ margin: '4px 0 0 0', color: 'white', fontSize: '14px', fontFamily: 'var(--eco-font-display)', letterSpacing: '1px' }}>{selectedCatalogProduct}</h4>
                                        </div>
                                    )}

                                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }} className="custom-scroll">
                                        {loadingImages ? (
                                            <div style={{ gridColumn: '1 / -1', padding: '50px', textAlign: 'center', color: 'var(--eco-accent-primary)' }}>
                                                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                                                <p style={{ fontSize: '11px', fontWeight: 'bold' }}>SINCRONIZANDO CON SUPABASE...</p>
                                            </div>
                                        ) : allImages
                                            .filter(img => {
                                                if (pickerTab === 'catalog') {
                                                    return img.source === 'catalog' && img.name === selectedCatalogProduct;
                                                }
                                                return img.source === pickerTab && (img.name.toLowerCase().includes(searchQuery.toLowerCase()));
                                            })
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
                                                        transition: 'all 0.3s', backgroundColor: '#050505',
                                                        boxShadow: '0 10px 20px rgba(0,0,0,0.5)'
                                                    }}
                                                    className="img-hover"
                                                >
                                                    <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    {pickerTab !== 'catalog' && (
                                                        <div style={{
                                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                                            background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                                                            padding: '10px', fontSize: '9px', color: 'white', fontFamily: 'var(--eco-font-mono)'
                                                        }}>
                                                            {img.name.substring(0, 20)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                        {pickerTab === 'catalog' && !selectedCatalogProduct && (
                                            <div style={{ gridColumn: '1 / -1', padding: '100px 50px', textAlign: 'center', color: '#333' }}>
                                                <ImageIcon size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                                                <p style={{ letterSpacing: '2px', fontSize: '10px', fontWeight: 'bold' }}>SELECCIONA UN PRODUCTO DEL LISTADO PARA VER SUS IMÁGENES</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
