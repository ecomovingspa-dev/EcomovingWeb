'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Move, FileText, Layers, Plus, Trash2, Sparkles, Loader2,
    Image as ImageIcon, ChevronRight, Layout, Palette, Save, Copy
} from 'lucide-react';
import { LayoutBlock } from '@/hooks/useWebContent';
import { getSupabaseClient } from '@/lib/supabase';

const resolveImageUrl = (img: string, projectPath?: string) => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
    return img;
  }
  if (projectPath && img.startsWith('/')) {
    if (img.startsWith('/api/local-asset')) return img;
    const normalizedPath = projectPath.replace(/\\/g, '/');
    return `/api/local-asset?path=${encodeURIComponent(normalizedPath + '/public' + img)}`;
  }
  return img;
};

interface BlockInspectorProps {
    // Bloque actualmente seleccionado (null = modo canvas)
    block: LayoutBlock | null;
    // Todos los bloques de la grilla (para listar en modo canvas)
    allBlocks: LayoutBlock[];
    // Colores del lienzo
    canvasBgColor: string;
    // Categorías del brochure
    categories?: string[];
    onAddCategory?: () => void;
    onRenameCategory?: (idx: number, newVal: string) => void;
    onDeleteCategory?: (cat: string) => void;
    // Callbacks
    onClose: () => void;
    onUpdate: (blockId: string, updates: Partial<LayoutBlock>) => void;
    onDelete: (blockId: string) => void;
    onDuplicate?: (blockId: string) => void;
    onAddBlock: () => void;
    onSelectBlock: (blockId: string) => void;
    onCanvasBgChange: (color: string) => void;
    projectId?: string;
    projectPath?: string;
}

export default function BlockInspector({
    block, allBlocks, canvasBgColor, categories,
    onAddCategory, onRenameCategory, onDeleteCategory,
    onClose, onUpdate, onDelete, onDuplicate, onAddBlock, onSelectBlock, onCanvasBgChange,
    projectId, projectPath
}: BlockInspectorProps) {
    const supabase = getSupabaseClient(projectId);

    const [activeTab, setActiveTab] = useState<'layout' | 'header' | 'content' | 'visual' | 'cta'>('layout');
    const [generatingAI, setGeneratingAI] = useState(false);
    const [aiRefKeyword, setAiRefKeyword] = useState('');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerImages, setPickerImages] = useState<{ url: string; name: string }[]>([]);
    const [pickerLoading, setPickerLoading] = useState(false);
    const [pickerQuery, setPickerQuery] = useState('');
    const pickerSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [pickerTab, setPickerTab] = useState<'productos' | 'grilla'>('productos');
    const [grillaImages, setGrillaImages] = useState<{ url: string; name: string }[]>([]);
    const [loadingGrilla, setLoadingGrilla] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Drag-to-move ──────────────────────────────────────────────────────────
    const PANEL_W = 500; // Aumentado 30% proporcionalmente
    const PANEL_H_APPROX = 600;
    const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
        x: typeof window !== 'undefined' ? window.innerWidth - PANEL_W - 8 : 800,
        y: 0
    }));
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleHeaderMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Solo arrastrar con botón izquierdo; ignorar clicks en botones hijos
        if ((e.target as HTMLElement).closest('button')) return;
        isDragging.current = true;
        dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        e.preventDefault();
    }, [pos]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const maxX = window.innerWidth - PANEL_W;
            const maxY = window.innerHeight - 60; // mínimo header visible
            const newX = Math.max(0, Math.min(e.clientX - dragOffset.current.x, maxX));
            const newY = Math.max(0, Math.min(e.clientY - dragOffset.current.y, maxY));
            setPos({ x: newX, y: newY });
        };
        const onMouseUp = () => { isDragging.current = false; };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);
    // ─────────────────────────────────────────────────────────────────────────

    // Reset tab cuando cambia el bloque
    useEffect(() => { setActiveTab('layout'); setPickerOpen(false); }, [block?.id]);
    const isEcomoving = !projectId || projectId === 'ecomoving-public';

    const update = useCallback((updates: Partial<LayoutBlock>) => {
        if (!block) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        onUpdate(block.id, updates);
    }, [block, onUpdate]);

    // ── BIBLIOTECA: búsqueda en tabla productos o web sync unificado ───────────
    const searchPickerImages = useCallback(async (query: string) => {
        if (!isEcomoving) {
            setPickerLoading(true);
            try {
                if (projectPath) {
                    const localPath = `${projectPath}/public/grilla`;
                    const res = await fetch(`/api/local-folder?path=${encodeURIComponent(localPath.replace(/\\/g, '/'))}`);
                    const data = await res.json();
                    let results: { url: string; name: string }[] = [];
                    if (data.items) {
                        results = data.items
                            .filter((item: any) => item.type === 'file' && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.name))
                            .map((item: any) => ({
                                url: `/grilla/${item.name}`,
                                name: item.name
                            }));
                    }
                    if (query.trim()) {
                        const q = query.toLowerCase().trim();
                        results = results.filter(img => img.name.toLowerCase().includes(q));
                    }
                    setPickerImages(results);
                } else {
                    // Fallback to supabase grilla bucket if no projectPath
                    const { data } = await supabase.storage.from('grilla').list('', { limit: 100 });
                    let results: { url: string; name: string }[] = [];
                    if (data) {
                        results = data
                            .filter(f => f.name !== '.emptyKeepFile' && f.name !== '.emptyFolderPlaceholder')
                            .map(f => {
                                const { data: { publicUrl } } = supabase.storage.from('grilla').getPublicUrl(f.name);
                                return { url: publicUrl, name: f.name };
                            });
                    }
                    if (query.trim()) {
                        const q = query.toLowerCase().trim();
                        results = results.filter(img => img.name.toLowerCase().includes(q));
                    }
                    setPickerImages(results);
                }
            } catch (e) {
                console.error('[BIBLIOTECA LOCAL SUPABASE]', e);
                setPickerImages([]);
            }
            setPickerLoading(false);
            return;
        }

        if (!query.trim()) {
            setPickerImages([]);
            setPickerLoading(false);
            return;
        }
        setPickerLoading(true);
        try {
            if (isEcomoving) {
                const { data } = await supabase
                    .from('productos')
                    .select('nombre, categoria, imagen_principal, imagenes_galeria')
                    .eq('status', 'approved')
                    .ilike('nombre', `%${query.trim()}%`)
                    .limit(40);

                const res: { url: string; name: string }[] = [];
                if (data) {
                    for (const p of data) {
                        if (p.imagen_principal) {
                            res.push({ url: p.imagen_principal, name: p.nombre });
                        }
                        if (Array.isArray(p.imagenes_galeria)) {
                            p.imagenes_galeria.forEach((url: string) => {
                                if (url && url !== p.imagen_principal) {
                                    res.push({ url, name: p.nombre });
                                }
                            });
                        }
                    }
                }
                setPickerImages(res);
            }
        } catch (e) {
            console.error('[BIBLIOTECA]', e);
            setPickerImages([]);
        }
        setPickerLoading(false);
    }, [isEcomoving, projectPath]);

    // Debounce: dispara la búsqueda 350ms después de que el usuario deje de escribir
    const handlePickerQueryChange = (q: string) => {
        setPickerQuery(q);
        setPickerLoading(q.trim().length > 0);
        if (pickerSearchRef.current) clearTimeout(pickerSearchRef.current);
        pickerSearchRef.current = setTimeout(() => searchPickerImages(q), 350);
    };

    // ── BIBLIOTECA: fetch imágenes de GRILLA o LOCAL ────────
    const fetchGrillaImages = useCallback(async () => {
        setLoadingGrilla(true);
        try {
            if (isEcomoving) {
                const { data: files } = await supabase.storage.from('imagenes-marketing').list('grilla');
                if (files) {
                    const results = files
                        .filter(f => f.name !== '.emptyKeepFile' && !['grilla', 'catalogo', 'hero', 'marketing'].includes(f.name))
                        .map(f => {
                            const { data: { publicUrl } } = supabase.storage.from('imagenes-marketing').getPublicUrl(`grilla/${f.name}`);
                            return { url: publicUrl, name: f.name };
                        });
                    setGrillaImages(results);
                }
            } else if (projectPath) {
                const localPath = `${projectPath}/public/grilla`;
                const res = await fetch(`/api/local-folder?path=${encodeURIComponent(localPath.replace(/\\/g, '/'))}`);
                const data = await res.json();
                if (data.items) {
                    const results = data.items
                        .filter((item: any) => item.type === 'file' && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.name))
                        .map((item: any) => ({
                            url: `/grilla/${item.name}`,
                            name: item.name
                        }));
                    setGrillaImages(results);
                }
            } else {
                const { data: files } = await supabase.storage.from('grilla').list('');
                if (files) {
                    const results = files
                        .filter(f => f.name !== '.emptyKeepFile' && f.name !== '.emptyFolderPlaceholder')
                        .map(f => {
                            const { data: { publicUrl } } = supabase.storage.from('grilla').getPublicUrl(f.name);
                            return { url: publicUrl, name: f.name };
                        });
                    setGrillaImages(results);
                }
            }
        } catch (err) {
            console.error('[GRILLA]', err);
        }
        setLoadingGrilla(false);
    }, [isEcomoving, projectPath]);

    useEffect(() => {
        if (pickerOpen && pickerTab === 'grilla' && grillaImages.length === 0) {
            fetchGrillaImages();
        }
    }, [pickerOpen, pickerTab, grillaImages.length, fetchGrillaImages]);

    useEffect(() => {
        if (pickerOpen && pickerTab === 'productos' && !isEcomoving && pickerImages.length === 0) {
            searchPickerImages('');
        }
    }, [pickerOpen, pickerTab, isEcomoving, pickerImages.length, searchPickerImages]);
    // ───────────────────────────────────────────────────────────────────

    const handleGenerateAI = async () => {
        if (!block) return;
        if (!block.blockTitle && !block.label && !aiRefKeyword.trim()) {
            alert("No hay palabra clave, título ni nombre de bloque para guiar a la IA");
            return;
        }
        setGeneratingAI(true);
        try {
            const query = aiRefKeyword.trim();
            if (!query) {
                alert("Por favor, ingresa un SKU en el campo de Referencia IA (ej: T679)");
                setGeneratingAI(false);
                return;
            }

            // Avisamos visualmente que estamos buscando
            onUpdate(block.id, {
                blockTitle: `🔍 Buscando SKU: ${query}...`,
                blockParagraph: 'Conectando con la base de datos...'
            });

            // Buscar producto por SKU o nombre de manera flexible
            const { data, error } = await supabase.from('productos')
                .select('*') // Seleccionamos todo para evitar fallos por columnas faltantes
                .or(`sku_externo.ilike.%${query}%,nombre.ilike.%${query}%`)
                .limit(1);

            if (error) {
                onUpdate(block.id, {
                    blockTitle: `⚠️ ERROR DB: ${error.message}`,
                    blockParagraph: 'Hubo un error al consultar Supabase. Revisa la consola.'
                });
                setGeneratingAI(false);
                return;
            }

            if (!data || data.length === 0) {
                onUpdate(block.id, {
                    blockTitle: `🚫 SKU '${query}' NO ENCONTRADO`,
                    blockParagraph: 'Verifica que el SKU esté escrito correctamente y exista en tu catálogo Mkt/Insumos.'
                });
                setGeneratingAI(false);
                return;
            }

            // Producto encontrado
            const foundProduct = data[0];

            let cleanFeature = '';
            const rawDescription = foundProduct.descripcion || '';
            const allFeaturesText = `${rawDescription}. ${foundProduct.material || ''}. ${Array.isArray(foundProduct.features) ? foundProduct.features.join('. ') : (foundProduct.features || '')}`;

            // Extraer oraciones separadas por punto o línea
            const rawSentences = allFeaturesText.split(/(?:\.|\n)+/);

            let bestHook = '';
            for (let s of rawSentences) {
                let text = s.trim();
                let lower = text.toLowerCase();

                // Ignorar oraciones vacías o extremadamente cortas
                if (lower.length < 5) continue;

                // Ignorar oraciones que sean pura medida o capacidad técnica abstracta (ej: "Ø 7,2 x 22,3 cm" o "capacidad 550 ml")
                if (/^(?:ø|diámetro|diametro|capacidad|peso|medida|talla|largo|ancho|alto)?\s*[:\-]*\s*[\d,.\-x\s]*(?:cm|mm|ml|gr|kg|oz|lts|litros)?\s*$/i.test(lower)) continue;

                // Si la oración suena a buen gancho descriptivo o material principal
                if (lower.match(/(botella|taza|mug|termo|mochila|bolígrafo|bolsa|libreta|acero|doble pared|sellada|térmic|sustentable|ecológic|bambú|premium|algodón|cerámica|vidrio|cuero|rpet|reciclado)/i)) {
                    bestHook = text;
                    // Si tiene un largo ideal (entre 15 y 65 chars), es excelente y la elegimos definitivamente
                    if (lower.length >= 15 && lower.length <= 65) {
                        break;
                    }
                } else if (!bestHook && lower.length > 10) {
                    bestHook = text;
                }
            }

            cleanFeature = bestHook || 'Alta funcionalidad y diseño premium corporativo';

            // Formatear: Primera letra mayúscula, máximo 70 caracteres
            if (cleanFeature.length > 70) {
                cleanFeature = cleanFeature.substring(0, 67).trim() + '...';
            }
            cleanFeature = cleanFeature.charAt(0).toUpperCase() + cleanFeature.slice(1);

            // Asignar los valores definitivos al bloque
            onUpdate(block.id, {
                blockTitle: foundProduct.nombre || 'Sin nombre definido',
                blockParagraph: cleanFeature,
                link: `/catalogo?q=${foundProduct.sku_externo || query}`
            });

        } catch (e: any) {
            onUpdate(block.id, {
                blockTitle: `⚠️ ERROR CRÍTICO`,
                blockParagraph: e?.message || 'Fallo inesperado de conexión'
            });
        }
        setGeneratingAI(false);
    };

    // Bloques ordenados por fila+col
    const sortedBlocks = [...allBlocks].sort((a, b) => (a.row ?? 0) - (b.row ?? 0) || (a.col ?? 0) - (b.col ?? 0));

    const tabs = [
        { id: 'layout', label: 'POSICIÓN', icon: <Move size={11} /> },
        { id: 'header', label: 'ENCABEZADO', icon: <FileText size={11} /> },
        { id: 'content', label: 'CONTENIDO', icon: <Layers size={11} /> },
        { id: 'cta', label: 'CTA TOOL', icon: <Sparkles size={11} /> },
        { id: 'visual', label: 'EFECTOS', icon: <Palette size={11} /> },
    ];

    return (
        <motion.div
            key="inspector-panel"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            style={{
                position: 'fixed',
                left: pos.x,
                top: pos.y,
                width: `${PANEL_W}px`,
                maxHeight: 'calc(100vh - 20px)',
                backgroundColor: '#080808',
                border: '1px solid rgba(0,212,189,0.18)',
                borderRadius: '12px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.95), 0 0 0 1px rgba(0,212,189,0.08)',
                zIndex: 99998,
                display: 'flex', flexDirection: 'column',
                fontFamily: 'var(--font-body, sans-serif)', color: 'white',
                overflow: 'hidden',
                userSelect: 'none',
            }}
        >
            {/* ═══════════════════════════════════════════
                MODO CANVAS: sin bloque seleccionado
            ═══════════════════════════════════════════ */}
            {!block ? (
                <>
                    {/* Header Canvas — Drag Handle */}
                    <div
                        onMouseDown={handleHeaderMouseDown}
                        style={{
                            padding: '14px 16px', borderBottom: '1px solid #1a1a1a',
                            background: 'linear-gradient(135deg, #0c0c0c, #0a0a0a)',
                            borderRadius: '12px 12px 0 0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            cursor: 'grab', userSelect: 'none'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Grip dots */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,4px)', gap: '3px', opacity: 0.35, flexShrink: 0 }}>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#00d4bd' }} />
                                ))}
                            </div>
                            <div>
                                <div style={{ fontSize: '9px', color: '#00d4bd', letterSpacing: '2px', fontWeight: 900, marginBottom: '2px' }}>▤ CANVAS MANAGER</div>
                                <div style={{ fontSize: '11px', color: '#555' }}>{allBlocks.length} bloques · click para editar</div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', flexShrink: 0 }}><X size={18} /></button>
                    </div>

                    {/* Acciones globales */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #141414', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button onClick={onAddBlock} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '13px', background: 'linear-gradient(90deg, rgba(0,212,189,0.12), rgba(0,212,189,0.06))',
                            border: '1px solid rgba(0,212,189,0.3)', color: '#00d4bd',
                            borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 900,
                            textTransform: 'uppercase', letterSpacing: '1px', transition: 'all 0.2s'
                        }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,189,0.18)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(90deg, rgba(0,212,189,0.12), rgba(0,212,189,0.06))')}
                        >
                            <Plus size={15} /> AGREGAR BLOQUE
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ fontSize: '9px', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', flex: 1 }}>COLOR DE FONDO</div>
                            <input type="color" value={canvasBgColor || '#000000'}
                                onChange={e => onCanvasBgChange(e.target.value)}
                                style={{ width: '36px', height: '28px', border: '1px solid #222', background: 'none', borderRadius: '5px', cursor: 'pointer' }} />
                            <span style={{ fontSize: '10px', color: '#444', fontFamily: 'monospace' }}>{canvasBgColor || '#000000'}</span>
                        </div>
                    </div>

                    {/* Gestión de Categorías (Solo en Brochure) */}
                    {categories && categories.length > 0 && (
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #141414', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '9px', color: '#00d4bd', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>CATEGORÍAS DE PORTAFOLIO</div>
                                <button 
                                    onClick={onAddCategory}
                                    style={{ background: 'rgba(0,212,189,0.08)', border: '1px dashed rgba(0,212,189,0.3)', color: '#00d4bd', borderRadius: '4px', fontSize: '9px', fontWeight: 700, padding: '4px 8px', cursor: 'pointer' }}
                                >
                                    + AÑADIR
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                                {categories.map((cat, idx) => (
                                    <div key={cat + idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                                        <span style={{ fontSize: '11px', color: '#ccc' }}>{cat}</span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => {
                                                    const newVal = prompt('Renombrar categoría:', cat);
                                                    if (newVal && newVal.trim() && onRenameCategory) {
                                                        onRenameCategory(idx, newVal.trim());
                                                    }
                                                }}
                                                style={{ background: 'none', border: 'none', color: '#666', fontSize: '10px', cursor: 'pointer' }}
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                onClick={() => onDeleteCategory && onDeleteCategory(cat)}
                                                style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '10px', cursor: 'pointer' }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lista de bloques */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }} className="custom-scroll">
                        <div style={{ fontSize: '9px', color: '#333', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 8px 8px' }}>
                            BLOQUES — ordenados por posición
                        </div>
                        {sortedBlocks.map((b) => (
                            <motion.div
                                key={b.id}
                                onClick={() => onSelectBlock(b.id)}
                                whileHover={{ x: 3 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px 10px', borderRadius: '8px', cursor: 'pointer',
                                    marginBottom: '3px', border: '1px solid transparent',
                                    transition: 'background 0.15s, border-color 0.15s'
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,189,0.06)';
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,189,0.15)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                                }}
                            >
                                {/* Thumbnail */}
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '5px', overflow: 'hidden', flexShrink: 0,
                                    background: b.bgColor || '#111', border: '1px solid #222', position: 'relative'
                                }}>
                                    {(b.gallery?.[0] || b.image) && (
                                        <img src={resolveImageUrl(b.gallery?.[0] || b.image, projectPath)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                                    )}
                                </div>
                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#ddd', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                            {b.label || 'BLOQUE'}
                                        </div>
                                        <input 
                                            type="color" 
                                            value={b.bgColor || '#111111'} 
                                            onChange={e => {
                                                e.stopPropagation();
                                                onUpdate(b.id, { bgColor: e.target.value });
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            style={{ width: '12px', height: '12px', border: 'none', background: 'none', borderRadius: '50%', cursor: 'pointer', padding: 0, outline: '1px solid rgba(255,255,255,0.1)' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                                        <span style={chipStyle('#00d4bd')}>F:{b.row ?? '?'}</span>
                                        <span style={chipStyle('#00d4bd')}>C:{b.col ?? '?'}</span>
                                        <span style={chipStyle('#444')}>▤ {b.span || '?'}</span>
                                    </div>
                                </div>
                                <ChevronRight size={14} color="#333" />
                            </motion.div>
                        ))}
                        {allBlocks.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#333', fontSize: '11px' }}>
                                No hay bloques aún.<br />Usa + AGREGAR BLOQUE para comenzar.
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* ═══════════════════════════════════════════
                   MODO EDITOR: bloque seleccionado
                ═══════════════════════════════════════════ */
                <>
                    {/* Header Bloque — Drag Handle */}
                    <div
                        onMouseDown={handleHeaderMouseDown}
                        style={{
                            padding: '14px 16px', borderBottom: '1px solid #1a1a1a',
                            background: 'linear-gradient(135deg, #0c0c0c, #0a0a0a)',
                            borderRadius: '12px 12px 0 0',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            cursor: 'grab', userSelect: 'none'
                        }}
                    >
                        {/* Back button → vuelve al canvas */}
                        <button onClick={() => onSelectBlock('')} title="Volver al canvas" style={{
                            background: 'none', border: '1px solid #222', color: '#555', cursor: 'pointer',
                            padding: '5px 8px', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 700
                        }}>
                            <Layout size={11} /> CANVAS
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '9px', color: '#555', letterSpacing: '1px', marginBottom: '2px' }}>INSPECTOR</div>
                            <input value={block.label} onChange={e => update({ label: e.target.value })}
                                style={{ background: 'none', border: 'none', color: '#00d4bd', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', width: '100%', outline: 'none', textTransform: 'uppercase' }} />
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                <span style={chipStyle('#00d4bd')}>F:{block.row ?? '?'}</span>
                                <span style={chipStyle('#00d4bd')}>C:{block.col ?? '?'}</span>
                                <span style={chipStyle('#444')}>▤ {block.span || '?'}</span>
                                {block.zIndex && block.zIndex > 1 && <span style={chipStyle('#efb810')}>Z:{block.zIndex}</span>}
                            </div>
                        </div>
                        <button onClick={onAddBlock} title="Añadir nuevo bloque" style={{
                            background: 'rgba(0,212,189,0.08)', border: '1px solid rgba(0,212,189,0.2)', color: '#00d4bd', cursor: 'pointer',
                            padding: '6px', borderRadius: '6px', display: 'flex', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,189,0.15)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,189,0.08)'}
                        >
                            <Plus size={14} />
                        </button>
                        <button onClick={() => onDuplicate && onDuplicate(block.id)} title="Duplicar bloque" style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', cursor: 'pointer',
                            padding: '6px', borderRadius: '6px', display: 'flex', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                            (e.currentTarget as HTMLElement).style.color = '#fff';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                            (e.currentTarget as HTMLElement).style.color = '#aaa';
                        }}
                        >
                            <Copy size={14} />
                        </button>
                        <button onClick={() => { if (confirm('¿Eliminar este bloque?')) onDelete(block.id); }}
                            style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff4444', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', transition: 'all 0.2s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,68,68,0.15)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,68,68,0.08)'}
                        >
                            <Trash2 size={14} />
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', padding: '4px' }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', background: '#050505', borderBottom: '1px solid #111', padding: '3px 3px' }}>
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
                                    padding: '8px 2px', fontSize: '8px', fontWeight: 900,
                                    border: 'none', borderRadius: '5px', cursor: 'pointer',
                                    backgroundColor: isActive ? '#151515' : 'transparent',
                                    color: isActive ? '#00d4bd' : '#333',
                                    letterSpacing: '0.5px', transition: 'all 0.2s'
                                }}>
                                    {tab.icon} {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }} className="custom-scroll">

                        {/* ── TAB POSICIÓN ── */}
                        {activeTab === 'layout' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                                {/* PALETA DE MARCA RÁPIDA */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '5px' }}>
                                    <div style={{ fontSize: '8px', color: '#555', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>COLOR DEL BLOQUE</div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {/* Custom Color Picker Button */}
                                        <div style={{ position: 'relative', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <input 
                                                type="color" 
                                                value={block.bgColor || '#111111'} 
                                                onChange={e => update({ bgColor: e.target.value })}
                                                title="Personalizado"
                                                style={{
                                                    position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2
                                                }}
                                            />
                                            <div style={{
                                                width: '22px', height: '22px', borderRadius: '50%',
                                                background: 'conic-gradient(from 0deg, red, yellow, green, cyan, blue, magenta, red)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                boxShadow: 'inset 0 0 2px rgba(0,0,0,0.5)',
                                                transform: 'scale(1)', transition: 'transform 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            />
                                        </div>
                                        {/* Display selected color code */}
                                        <span style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', fontWeight: 900 }}>
                                            {(block.bgColor || '#111111').toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <Row label="COLUMNA (1-48)">
                                    <input type="number" value={block.col || 1} onChange={e => update({ col: parseInt(e.target.value) || 1 })} style={inputStyle} />
                                </Row>
                                <Row label="FILA">
                                    <input type="number" value={block.row || 1} onChange={e => update({ row: parseInt(e.target.value) || 1 })} style={inputStyle} />
                                </Row>
                                <Row label="TAMAÑO  (ej: 8x5)">
                                    <input type="text" value={block.span || '4x2'} onChange={e => update({ span: e.target.value })} style={inputStyle} />
                                </Row>
                                <Row label="CAPA (Z-INDEX)">
                                    <input type="number" value={block.zIndex || 1} onChange={e => update({ zIndex: parseInt(e.target.value) || 1 })} style={inputStyle} />
                                </Row>
                            </div>
                        )}

                        {/* ── TAB ENCABEZADO ── */}
                        {activeTab === 'header' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                                <Row label="TÍTULO"><input type="text" value={block.blockTitle || ''} onChange={e => update({ blockTitle: e.target.value })} placeholder="Título del bloque..." style={inputStyle} /></Row>
                                <Row label="PÁRRAFO"><textarea value={block.blockParagraph || ''} onChange={e => update({ blockParagraph: e.target.value })} placeholder="Descripción corta..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></Row>
                                <div style={{ borderTop: '1px solid #151515', paddingTop: '11px' }}>
                                    <div style={{ fontSize: '9px', color: '#00d4bd', fontWeight: 900, letterSpacing: '1px', marginBottom: '9px' }}>🎨 TIPOGRAFÍA</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                                        <div><div style={labelStyle}>TAMAÑO PÁRRAFO</div>
                                            <select value={block.paragraphSize || '16px'} onChange={e => update({ paragraphSize: e.target.value })} style={selectStyle}>
                                                <option value="12px">X-Small (12)</option><option value="14px">Small (14)</option><option value="16px">Normal (16)</option>
                                                <option value="18px">Medium (18)</option><option value="20px">Large (20)</option><option value="24px">X-Large (24)</option>
                                            </select>
                                        </div>
                                        <div><div style={labelStyle}>TAMAÑO</div>
                                            <select value={block.titleSize || '24px'} onChange={e => update({ titleSize: e.target.value })} style={selectStyle}>
                                                <option value="18px">Pequeño (18)</option><option value="24px">Medio (24)</option>
                                                <option value="32px">Grande (32)</option><option value="48px">Gigante (48)</option><option value="64px">Massive (64)</option>
                                            </select>
                                        </div>
                                        <div><div style={labelStyle}>PESO</div>
                                            <select value={block.fontWeight || '700'} onChange={e => update({ fontWeight: e.target.value })} style={selectStyle}>
                                                <option value="400">Normal</option><option value="600">Medio</option><option value="700">Bold</option><option value="900">Black</option>
                                            </select>
                                        </div>
                                        <div><div style={labelStyle}>ALINEACIÓN</div>
                                            <div style={{ display: 'flex', gap: '3px' }}>
                                                {['left', 'center', 'right'].map(a => (
                                                    <button key={a} onClick={() => update({ textAlign: a as any })} style={{ flex: 1, padding: '6px 2px', fontSize: '9px', background: block.textAlign === a ? '#00d4bd' : '#111', color: block.textAlign === a ? '#000' : '#666', border: '1px solid #222', borderRadius: '4px', cursor: 'pointer' }}>
                                                        {a === 'left' ? 'IZQ' : a === 'center' ? 'CEN' : 'DER'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div><div style={labelStyle}>COLOR</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <input type="color" value={block.textColor || '#ffffff'} onChange={e => update({ textColor: e.target.value })} style={{ width: '30px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                                                <span style={{ fontSize: '9px', color: '#555', fontFamily: 'monospace' }}>{block.textColor || '#fff'}</span>
                                            </div>
                                        </div>
                                        <div><div style={labelStyle}>TRANSFORM</div>
                                            <select value={block.textTransform || 'none'} onChange={e => update({ textTransform: e.target.value as any })} style={selectStyle}>
                                                <option value="none">Normal</option><option value="uppercase">MAYÚSCULAS</option><option value="lowercase">minúsculas</option><option value="capitalize">Capitalizar</option>
                                            </select>
                                        </div>
                                        <div><div style={labelStyle}>INTERL. TÍTULO</div>
                                            <select value={block.titleLineHeight || '1.1'} onChange={e => update({ titleLineHeight: e.target.value })} style={selectStyle}>
                                                <option value="0.9">Muy Compacto</option><option value="1.0">Sólido (1)</option><option value="1.1">Normal (1.1)</option><option value="1.2">Abierto (1.2)</option><option value="1.5">Espaciado</option>
                                            </select>
                                        </div>
                                        <div><div style={labelStyle}>INTERL. PÁRRAFO</div>
                                            <select value={block.lineHeight || '1.5'} onChange={e => update({ lineHeight: e.target.value })} style={selectStyle}>
                                                <option value="1.2">Compacto</option><option value="1.5">Normal</option><option value="1.8">Relajado</option><option value="2.0">Abierto</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px solid #151515', paddingTop: '11px', marginTop: '5px' }}>
                                    <div style={{ fontSize: '9px', color: '#efb810', fontWeight: 900, letterSpacing: '1px', marginBottom: '9px' }}>📐 DIMENSIONES Y POSICIÓN TEXTO</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                                        <div><div style={labelStyle}>ANCHO MÁXIMO</div>
                                            <select value={block.textMaxWidth || '90%'} onChange={e => update({ textMaxWidth: e.target.value })} style={selectStyle}>
                                                <option value="100%">Completo (100%)</option>
                                                <option value="90%">Normal (90%)</option>
                                                <option value="80%">Contenido (80%)</option>
                                                <option value="70%">Estrecho (70%)</option>
                                                <option value="60%">Muy Estrecho (60%)</option>
                                                <option value="400px">Fijo 400px</option>
                                                <option value="600px">Fijo 600px</option>
                                            </select>
                                        </div>
                                        <div><div style={labelStyle}>PADDING (AIRE)</div>
                                            <select value={block.textPadding || '30px'} onChange={e => update({ textPadding: e.target.value })} style={selectStyle}>
                                                <option value="10px">Mínimo (10px)</option>
                                                <option value="20px">Pequeño (20px)</option>
                                                <option value="30px">Medio (30px)</option>
                                                <option value="40px">Grande (40px)</option>
                                                <option value="60px">Extra (60px)</option>
                                                <option value="20px 40px">Lateral Extendido</option>
                                                <option value="40px 20px">Vertical Extendido</option>
                                            </select>
                                        </div>
                                        <div><div style={labelStyle}>SEP. / GAP</div>
                                            <select value={block.textGap || '15px'} onChange={e => update({ textGap: e.target.value })} style={selectStyle}>
                                                <option value="5px">Mínimo (5px)</option>
                                                <option value="15px">Normal (15px)</option>
                                                <option value="30px">Amplio (30px)</option>
                                                <option value="50px">Extra (50px)</option>
                                            </select>
                                        </div>
                                        <div style={{ gridColumn: 'span 2', marginTop: '10px', padding: '12px', background: 'rgba(0,212,189,0.03)', borderRadius: '8px', border: '1px solid rgba(0,212,189,0.1)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => update({ textProtection: !block.textProtection })}>
                                                <div style={{ width: '18px', height: '18px', border: '1px solid #00d4bd', borderRadius: '4px', background: block.textProtection ? '#00d4bd' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                                                    {block.textProtection && <div style={{ width: '8px', height: '8px', background: '#000', borderRadius: '1px' }} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#00d4bd', letterSpacing: '1px' }}>🛡️ PROTECCIÓN DE TEXTO</div>
                                                    <div style={{ fontSize: '8px', color: '#555', marginTop: '2px' }}>Asegura legibilidad en fondos claros.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <div style={labelStyle}>ALINEACIÓN VERTICAL (ALTURA)</div>
                                            <div style={{ display: 'flex', gap: '3px' }}>
                                                {[
                                                    { id: 'flex-start', label: 'SUPERIOR' },
                                                    { id: 'center', label: 'CENTRO' },
                                                    { id: 'flex-end', label: 'INFERIOR' }
                                                ].map(v => (
                                                    <button key={v.id} onClick={() => update({ textVerticalAlign: v.id as any })} style={{ flex: 1, padding: '6px 2px', fontSize: '9px', background: (block.textVerticalAlign || 'flex-start') === v.id ? '#efb810' : '#111', color: (block.textVerticalAlign || 'flex-start') === v.id ? '#000' : '#666', border: '1px solid #222', borderRadius: '4px', cursor: 'pointer' }}>
                                                        {v.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB CONTENIDO ── */}
                        {activeTab === 'content' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                                {categories && categories.length > 0 && (
                                    <Row label="CATEGORÍA (BROCHURE)">
                                        <select 
                                            value={block.category || block.label || ''} 
                                            onChange={e => update({ category: e.target.value, label: e.target.value.toUpperCase() })} 
                                            style={selectStyle}
                                        >
                                            <option value="">Sin Categoría</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </Row>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                                    <div><div style={labelStyle}>TIPO</div>
                                        <select value={block.type || 'image'} onChange={e => update({ type: e.target.value as any })} style={selectStyle}>
                                            <option value="image">Imagen</option><option value="text">Texto</option><option value="both">Ambos</option><option value="video">Video</option>
                                        </select>
                                    </div>
                                    <div><div style={labelStyle}>FONDO</div>
                                        <input type="color" value={block.bgColor || '#111111'} onChange={e => update({ bgColor: e.target.value })} style={{ width: '100%', height: '35px', border: '1px solid #222', background: 'none', borderRadius: '6px' }} />
                                    </div>
                                </div>

                                {block.type === 'video' && (
                                    <Row label="URL DEL VIDEO (MP4 o Vimeo)">
                                        <input type="text" value={block.videoUrl || ''} onChange={e => update({ videoUrl: e.target.value })} placeholder="https://vimeo.com/930646527 o URL .mp4..." style={inputStyle} />
                                    </Row>
                                )}

                                {block.type !== 'text' && (
                                    <>
                                        {block.type !== 'video' && (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ fontSize: '9px', color: '#efb810', fontWeight: 900, textTransform: 'uppercase' }}>GALERÍA</div>
                                                    <button
                                                        onClick={() => {
                                                            const next = !pickerOpen;
                                                            setPickerOpen(next);
                                                            if (!next) {
                                                                setPickerQuery('');
                                                                setPickerImages([]);
                                                            }
                                                        }}
                                                        style={{ fontSize: '9px', background: 'rgba(0,212,189,0.08)', border: '1px solid #00d4bd', color: '#00d4bd', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <ImageIcon size={10} /> {pickerOpen ? 'CERRAR' : 'BIBLIOTECA'}
                                                    </button>
                                                </div>

                                                <AnimatePresence>
                                                    {pickerOpen && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            style={{ overflow: 'hidden' }}
                                                        >
                                                            <div style={{ background: '#050505', borderRadius: '8px', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
                                                                {/* ─ Pestañas de la Galería ─ */}
                                                                <div style={{ padding: '4px', borderBottom: '1px solid #111', display: 'flex', gap: '4px' }}>
                                                                    <button onClick={() => setPickerTab('productos')} style={{ flex: 1, background: pickerTab === 'productos' ? '#151515' : 'transparent', color: pickerTab === 'productos' ? '#00d4bd' : '#666', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: 900, padding: '8px 0', cursor: 'pointer', letterSpacing: '1px' }}>PRODUCTOS</button>
                                                                    <button onClick={() => setPickerTab('grilla')} style={{ flex: 1, background: pickerTab === 'grilla' ? '#151515' : 'transparent', color: pickerTab === 'grilla' ? '#00d4bd' : '#666', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: 900, padding: '8px 0', cursor: 'pointer', letterSpacing: '1px' }}>GRILLA (INSUMOS)</button>
                                                                </div>

                                                                {pickerTab === 'productos' ? (
                                                                    <>
                                                                        {/* ─ Buscador ─ */}
                                                                        <div style={{ padding: '8px', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <span style={{ fontSize: '11px', flexShrink: 0 }}>🔍</span>
                                                                            <input
                                                                                type="text"
                                                                                value={pickerQuery}
                                                                                onChange={e => handlePickerQueryChange(e.target.value)}
                                                                                placeholder="Buscar en catálogo... (ej: mochila)"
                                                                                autoFocus
                                                                                style={{
                                                                                    flex: 1, background: 'transparent', border: 'none',
                                                                                    color: '#ddd', fontSize: '11px', outline: 'none',
                                                                                    fontFamily: 'var(--font-body, sans-serif)'
                                                                                }}
                                                                            />
                                                                            {pickerQuery && (
                                                                                <button
                                                                                    onClick={() => handlePickerQueryChange('')}
                                                                                    style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '12px', padding: '0 2px', lineHeight: 1 }}
                                                                                >✕</button>
                                                                            )}
                                                                        </div>

                                                                        {/* ─ Contenido Productos ─ */}
                                                                        <div style={{ height: 200, overflowY: 'auto', padding: '7px' }} className="custom-scroll">
                                                                            {!pickerQuery.trim() && isEcomoving ? (
                                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: '#333' }}>
                                                                                    <span style={{ fontSize: '22px' }}>🗂️</span>
                                                                                    <span style={{ fontSize: '10px', textAlign: 'center', lineHeight: 1.5, maxWidth: '160px' }}>
                                                                                        Escribe el nombre o categoría del producto
                                                                                    </span>
                                                                                </div>
                                                                            ) : pickerLoading ? (
                                                                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                                                    <Loader2 size={22} style={{ color: '#00d4bd', animation: 'spin 1s linear infinite' }} />
                                                                                </div>
                                                                            ) : pickerImages.length === 0 ? (
                                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '6px', color: '#444' }}>
                                                                                    <span style={{ fontSize: '20px' }}>🔎</span>
                                                                                    <span style={{ fontSize: '10px', textAlign: 'center' }}>
                                                                                        Sin resultados para «{pickerQuery}»
                                                                                    </span>
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    <div style={{ fontSize: '8px', color: '#444', marginBottom: '5px', fontFamily: 'monospace' }}>
                                                                                        {pickerImages.length} imagen{pickerImages.length !== 1 ? 'es' : ''} encontrada{pickerImages.length !== 1 ? 's' : ''}
                                                                                    </div>
                                                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                                                                                        {pickerImages.map((img, i) => (
                                                                                            <div
                                                                                                key={i}
                                                                                                onClick={() => {
                                                                                                    update({ gallery: [...(block.gallery || []), img.url] });
                                                                                                }}
                                                                                                title={img.name}
                                                                                                style={{
                                                                                                    aspectRatio: '1/1', borderRadius: '5px',
                                                                                                    overflow: 'hidden', cursor: 'pointer',
                                                                                                    border: '1px solid #1a1a1a',
                                                                                                    transition: 'border-color 0.15s, transform 0.15s'
                                                                                                }}
                                                                                                onMouseEnter={e => {
                                                                                                    (e.currentTarget as HTMLElement).style.borderColor = '#00d4bd';
                                                                                                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
                                                                                                }}
                                                                                                onMouseLeave={e => {
                                                                                                    (e.currentTarget as HTMLElement).style.borderColor = '#1a1a1a';
                                                                                                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                                                                                                }}
                                                                                            >
                                                                                                <img
                                                                                                    src={resolveImageUrl(img.url, projectPath)}
                                                                                                    alt={img.name}
                                                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                                                    onError={e => (e.target as HTMLImageElement).style.display = 'none'}
                                                                                                />
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    /* ─ Contenido Grilla (Insumos) ─ */
                                                                    <div style={{ height: 200, overflowY: 'auto', padding: '7px' }} className="custom-scroll">
                                                                        {loadingGrilla ? (
                                                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                                                <Loader2 size={22} style={{ color: '#00d4bd', animation: 'spin 1s linear infinite' }} />
                                                                            </div>
                                                                        ) : grillaImages.length === 0 ? (
                                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '6px', color: '#444' }}>
                                                                                <span style={{ fontSize: '20px' }}>📦</span>
                                                                                <span style={{ fontSize: '10px', textAlign: 'center' }}>No hay imágenes en la carpeta Grilla</span>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <div style={{ fontSize: '8px', color: '#444', marginBottom: '5px', fontFamily: 'monospace' }}>
                                                                                    {grillaImages.length} imágenes listas
                                                                                </div>
                                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                                                                                    {grillaImages.map((img, i) => (
                                                                                        <div
                                                                                            key={i}
                                                                                            onClick={() => update({ gallery: [...(block.gallery || []), img.url] })}
                                                                                            title={img.name}
                                                                                            style={{
                                                                                                aspectRatio: '1/1', borderRadius: '5px',
                                                                                                overflow: 'hidden', cursor: 'pointer',
                                                                                                border: '1px solid #1a1a1a', background: '#111',
                                                                                                transition: 'border-color 0.15s, transform 0.15s'
                                                                                            }}
                                                                                            onMouseEnter={e => {
                                                                                                (e.currentTarget as HTMLElement).style.borderColor = '#00d4bd';
                                                                                                (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
                                                                                            }}
                                                                                            onMouseLeave={e => {
                                                                                                (e.currentTarget as HTMLElement).style.borderColor = '#1a1a1a';
                                                                                                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                                                                                            }}
                                                                                        >
                                                                                            <img
                                                                                                src={resolveImageUrl(img.url, projectPath)}
                                                                                                alt={img.name}
                                                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                                                onError={e => (e.target as HTMLImageElement).style.display = 'none'}
                                                                                            />
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <div><div style={labelStyle}>ANIMACIÓN SLIDESHOW</div>
                                                    <select value={block.galleryAnimation || 'fade'} onChange={e => update({ galleryAnimation: e.target.value as any })} style={selectStyle}>
                                                        <option value="fade">Fade</option>
                                                        <option value="crossfade">Crossfade (Estático)</option>
                                                        <option value="slide-h">Deslizar →</option><option value="slide-v">Deslizar ↓</option><option value="zoom">Zoom</option><option value="none">Sin animación</option>
                                                        <option value="full-carousel">Carrusel Completo (Full)</option>
                                                        <option value="peek">⟵ Carrusel Peek (Apple/Tesla) ⟶</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <div style={labelStyle}>URLs DE GALERÍA</div>
                                                    <textarea value={(block.gallery || []).join('\n')} onChange={e => update({ gallery: e.target.value.split('\n').filter(Boolean) })}
                                                        rows={4} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '9px', color: '#00d4bd', resize: 'vertical' }} placeholder="Una URL por línea..." />
                                                    {(block.gallery || []).length > 0 && (
                                                        <div style={{ display: 'flex', gap: '4px', marginTop: '5px', flexWrap: 'wrap' }}>
                                                            {block.gallery!.slice(0, 5).map((url, i) => (
                                                                <div key={i} style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #222' }}>
                                                                    <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                                                                    <button onClick={() => update({ gallery: (block.gallery || []).filter((_, idx) => idx !== i) })}
                                                                        style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,0,0,0.8)', border: 'none', color: 'white', cursor: 'pointer', padding: '1px 3px', fontSize: '8px', lineHeight: 1 }}>✕</button>
                                                                </div>
                                                            ))}
                                                            {block.gallery!.length > 5 && <div style={{ width: '36px', height: '36px', border: '1px solid #222', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#555' }}>+{block.gallery!.length - 5}</div>}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        <div style={{ borderTop: '1px solid #111', paddingTop: '10px' }}>
                                            <div style={{ fontSize: '9px', color: '#efb810', fontWeight: 900, letterSpacing: '1px', marginBottom: '8px' }}>📐 TRANSFORMACIÓN</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                                                <div><div style={labelStyle}>POS X ({block.transform_posX ?? 50}%)</div><input type="range" min={0} max={100} value={block.transform_posX ?? 50} onChange={e => update({ transform_posX: +e.target.value })} style={{ width: '100%', accentColor: '#00d4bd' }} /></div>
                                                <div><div style={labelStyle}>POS Y ({block.transform_posY ?? 50}%)</div><input type="range" min={0} max={100} value={block.transform_posY ?? 50} onChange={e => update({ transform_posY: +e.target.value })} style={{ width: '100%', accentColor: '#00d4bd' }} /></div>
                                                <div style={{ gridColumn: 'span 2' }}><div style={labelStyle}>ZOOM ({block.transform_zoom ?? 1}x)</div><input type="range" min={0.5} max={3} step={0.05} value={block.transform_zoom ?? 1} onChange={e => update({ transform_zoom: +e.target.value })} style={{ width: '100%', accentColor: '#00d4bd' }} /></div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── TAB CTA TOOL ── */}
                        {activeTab === 'cta' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                                <div style={{ fontSize: '9px', color: '#efb810', fontWeight: 900, letterSpacing: '1px', marginBottom: '5px' }}>🔗 ACCIÓN Y SKU MAPPING</div>
                                <Row label="TEXTO DEL BOTÓN">
                                    <input type="text" value={block.buttonText || ''} onChange={e => update({ buttonText: e.target.value })} placeholder="Ej: COMPRAR AHORA" style={inputStyle} />
                                </Row>
                                <Row label="SKU VINCULADO">
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <input type="text" value={block.buttonSku || ''} onChange={e => update({ buttonSku: e.target.value })} placeholder="Ej: T679" style={inputStyle} />
                                        <button
                                            onClick={() => {
                                                if (block.buttonSku) {
                                                    update({ link: `/catalogo?q=${block.buttonSku}` });
                                                    alert('Vínculo de catálogo generado para el SKU: ' + block.buttonSku);
                                                }
                                            }}
                                            style={{ background: '#111', border: '1px solid #333', color: '#00d4bd', padding: '0 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px' }}>
                                            LINK
                                        </button>
                                    </div>
                                </Row>
                                <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(255,184,16,0.05)', borderRadius: '8px', border: '1px solid rgba(255,184,16,0.1)' }}>
                                    <div style={{ fontSize: '10px', color: '#efb810', fontWeight: 900, marginBottom: '5px' }}>💡 TIP DE DISEÑO 2026</div>
                                    <p style={{ fontSize: '10px', color: '#888', margin: 0, lineHeight: 1.4 }}>
                                        Vincular un SKU activa automáticamente un **Botón de Alto Impacto** en el bloque. Usa verbos de acción cortos.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── TAB EFECTOS ── */}
                        {activeTab === 'visual' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                                <div><div style={labelStyle}>OPACIDAD ({Math.round((block.opacity ?? 1) * 100)}%)</div><input type="range" min={0} max={1} step={0.05} value={block.opacity ?? 1} onChange={e => update({ opacity: +e.target.value })} style={{ width: '100%', accentColor: '#00d4bd' }} /></div>
                                <Row label="REDONDEO"><input type="text" value={block.borderRadius || '12px'} onChange={e => update({ borderRadius: e.target.value })} placeholder="ej: 20px" style={inputStyle} /></Row>
                                <Row label="BLUR"><input type="text" value={block.blur || ''} onChange={e => update({ blur: e.target.value })} placeholder="ej: 10px" style={inputStyle} /></Row>
                                <div><div style={labelStyle}>SOMBRA</div>
                                    <select value={block.shadow || 'none'} onChange={e => update({ shadow: e.target.value as any })} style={selectStyle}>
                                        <option value="none">Sin Sombra</option><option value="soft">Suave</option><option value="strong">Fuerte</option><option value="neon">Neón</option>
                                    </select>
                                </div>
                                <div><div style={labelStyle}>COLOR BORDE</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input type="color" value={block.borderColor || '#333333'} onChange={e => update({ borderColor: e.target.value })} style={{ width: '30px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                                        <span style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace', alignSelf: 'center' }}>{block.borderColor || 'Sin borde'}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    {[{ label: 'GRADIENTE', key: 'gradient', checked: !!block.gradient }, { label: 'CÍRCULO', key: 'isCircle', checked: !!block.isCircle }]
                                        .map(({ label, key, checked }) => (
                                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#aaa', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={checked} onChange={e => update({ [key]: e.target.checked } as any)} style={{ accentColor: '#00d4bd' }} />
                                                {label}
                                            </label>
                                        ))}
                                </div>
                                <div><div style={labelStyle}>ASPECT RATIO</div>
                                    <select value={block.transform_aspectRatio || 'auto'} onChange={e => update({ transform_aspectRatio: e.target.value })} style={selectStyle}>
                                        <option value="auto">Auto</option><option value="1/1">Cuadrado 1:1</option><option value="16/9">Landscape 16:9</option><option value="4/3">Estándar 4:3</option><option value="9/16">Portrait 9:16</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <style jsx global>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
                .custom-scroll::-webkit-scrollbar { width: 3px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }
            `}</style>
        </motion.div>
    );
}

// ── Helpers ──
const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0d0d0d', border: '1px solid #1e1e1e',
    color: 'white', fontSize: '13px', padding: '8px 10px', borderRadius: '6px',
    outline: 'none', boxSizing: 'border-box'
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
const labelStyle: React.CSSProperties = {
    fontSize: '9px', color: '#444', fontWeight: 'bold',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px'
};
const chipStyle = (color: string): React.CSSProperties => ({
    fontSize: '8px', color, background: `${color}14`,
    border: `1px solid ${color}22`, borderRadius: '3px',
    padding: '1px 5px', fontFamily: 'monospace'
});
function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><div style={labelStyle}>{label}</div>{children}</div>;
}
