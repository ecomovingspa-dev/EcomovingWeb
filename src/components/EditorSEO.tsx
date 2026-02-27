'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Search, Loader2, Sparkles, Check, RefreshCw,
    FileText, Zap, BarChart3, Save, Edit3, Eye, Type, Link as LinkIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface WebContent {
    id: number;
    section: string;
    content: Record<string, unknown>;
    updated_at: string;
}

interface SEOAnalysis {
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
}

interface SEOImprovement {
    improved: string;
    keywords_used: string[];
    reason: string;
}

interface EditorSEOProps {
    isOpen: boolean;
    onClose: () => void;
    onContentUpdate?: () => void;
}

export default function EditorSEO({ isOpen, onClose, onContentUpdate }: EditorSEOProps) {
    const [webContent, setWebContent] = useState<WebContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [improving, setImproving] = useState(false);
    const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
    const [improvement, setImprovement] = useState<SEOImprovement | null>(null);
    const [activeTab, setActiveTab] = useState<'edit' | 'analyze' | 'audit'>('edit');
    const [autoOptimizing, setAutoOptimizing] = useState(false);
    const [optimizationDraft, setOptimizationDraft] = useState<Record<string, string> | null>(null);

    // Contexto de IA para generación de contenido
    const [contextCategory, setContextCategory] = useState<string>('GENERAL');
    const [contextSpecs, setContextSpecs] = useState<string>('');

    // Categorías disponibles para contexto
    const AVAILABLE_CATEGORIES = ['GENERAL', 'BOTELLAS', 'MUGS', 'TAZAS', 'LIBRETAS', 'MOCHILAS', 'TECNOLOGÍA', 'BOLÍGRAFOS', 'ECO'];

    // Listado maestro de secciones con sus etiquetas legibles

    const SECTION_LABELS: Record<string, string> = {
        hero: 'Hero',
        sections: 'Secciones Dinámicas',
    };

    const FIELD_LABELS: Record<string, string> = {
        subtitle: 'ETIQUETA SUPERIOR',
        title1: 'TÍTULO 1',
        paragraph1: 'DESCRIPCIÓN 1',
        title2: 'TÍTULO 2',
        paragraph2: 'DESCRIPCIÓN 2',
        cta_text: 'TEXTO BOTÓN',
        cta_link: 'LINK BOTÓN',
        alt_text: 'TEXTO ALT IMAGEN (SEO)',
        meta_title: 'META TÍTULO GOOGLE',
        focus_keywords: 'PALABRAS CLAVE (Foco)'
    };

    const DEFAULT_SECTION_CONTENT: Record<string, any> = {
        hero: {
            title1: 'ECOMOVING: MERCHANDISING SUSTENTABLE Y DISEÑO PREMIUM',
            paragraph1: 'Elevamos tu marca con productos corporativos de alto impacto y conciencia ecológica.',
            cta_text: 'EXPLORAR CATÁLOGO 2026',
            cta_link: '/catalogo'
        },
        sections: {
            title1: 'Nueva Sección de Alto Impacto',
            paragraph1: 'Añade contenido estratégico para posicionar tus productos premium.',
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchContent();
        }
    }, [isOpen]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('web_contenido')
                .select('*')
                .order('section');

            if (error) throw error;

            // Mapeamos los datos de la DB y rellenamos con secciones que falten
            const dbSections = data || [];

            // Usamos solo las secciones definidas en SECTION_LABELS para evitar mostrar contenido obsoleto
            const allSectionKeys = Object.keys(SECTION_LABELS);

            const completeContent: WebContent[] = allSectionKeys.map(sectionKey => {
                const existing = dbSections.find((s: any) => s.section === sectionKey);
                const defaultSection = DEFAULT_SECTION_CONTENT[sectionKey] || (sectionKey === 'sections' ? [] : {});

                return {
                    id: existing?.id || 0,
                    section: sectionKey,
                    content: existing?.content || defaultSection,
                    updated_at: existing?.updated_at || new Date().toISOString()
                };
            });

            setWebContent(completeContent);
            if (!selectedSection && completeContent.length > 0) {
                // Priorizar Hero o la primera disponible
                const initial = completeContent.find(s => s.section === 'hero') || completeContent[0];
                setSelectedSection(initial.section);
            }
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- FUNCIONES DE UTILIDAD (Definidas antes de su uso) ---
    const getSelectedContent = () => {
        return webContent.find(s => s.section === selectedSection)?.content || {};
    };

    const applyImprovement = () => {
        if (improvement?.improved) {
            setEditValue(improvement.improved);
        }
    };

    const handleAnalyze = async (text: string) => {
        setAnalyzing(true);
        setAnalysis(null);
        try {
            const lowField = (editingField || '').toLowerCase();
            const response = await fetch('/api/seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyze',
                    text: text,
                    section: selectedSection,
                    context: `Eres un Especialista SEO de Élite. Analiza el siguiente texto para una web de merchandising corporativo que abarca desde alta gama.
                    CONTEXTO VISUAL: ${lowField.includes('title') ? 'Es un TÍTULO, debe ser corto y potente.' : 'Es un PÁRRAFO, debe ser explicativo.'}
                    CONTEXTO DE CATEGORÍA: ${contextCategory}
                    
                    REGLAS CRÍTICAS: 
                    1. Brevedad (<25 palabras para párrafos).
                    2. Vocabulario variado (evitar "premium" en exceso).
                    3. Pertinencia con la categoría ${contextCategory}.`
                })
            });

            const data = await response.json();
            if (data.success && data.data) {
                setAnalysis(data.data);
            }
        } catch (error) {
            console.error('Error analyzing:', error);
        } finally {
            setAnalyzing(false);
        }
    };

    // Effect para cargar specs del contexto
    useEffect(() => {
        const fetchContextSpecs = async () => {
            if (contextCategory === 'GENERAL') {
                setContextSpecs('Empresa líder en merchandising corporativo sustentable, diseño premium y personalización.');
                return;
            }

            setLoading(true);
            try {
                const { data } = await supabase
                    .from('productos')
                    .select('nombre, descripcion, features, material')
                    .ilike('categoria', `%${contextCategory}%`)
                    .limit(5);

                if (data && data.length > 0) {
                    const combinedText = data.map(p =>
                        `${p.nombre} (${p.material || 'Material Premium'}): ${Array.isArray(p.features) ? p.features.join(', ') : p.descripcion?.substring(0, 100)}`
                    ).join('. ');
                    setContextSpecs(combinedText.substring(0, 1000));
                } else {
                    setContextSpecs(`Productos de categoría ${contextCategory} con alta calidad y diseño.`);
                }
            } catch (err) {
                console.error('Error fetching context specs:', err);
                setContextSpecs(`Error cargando contexto para ${contextCategory}.`);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchContextSpecs();
        }
    }, [contextCategory, isOpen]);


    const saveContent = async (section: string, newContent: Record<string, unknown>) => {
        setSaving(true);
        try {
            // Usamos upsert para que si la sección no existe (id: 0), se cree
            const { error } = await supabase
                .from('web_contenido')
                .upsert({
                    section,
                    content: newContent,
                    updated_by: 'editor_seo',
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'section'
                });

            if (error) throw error;

            // Refrescamos localmente
            setWebContent(prev => prev.map(item =>
                item.section === section
                    ? { ...item, content: newContent, updated_at: new Date().toISOString() }
                    : item
            ));

            onContentUpdate?.();
            return true;
        } catch (error) {
            console.error('Error saving content:', error);
            alert('Error al guardar. Revisa la consola.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleFieldEdit = (field: string, value: string) => {
        setEditingField(field);
        setEditValue(value);
        setImprovement(null);
    };

    const handleFieldSave = async () => {
        if (!selectedSection || !editingField) return;

        const sectionData = webContent.find(s => s.section === selectedSection);
        if (!sectionData) return;

        let newContent: any;

        // Manejar actualización de bloques dinámicos (formato: "block:sectionId:blockId:field")
        if (editingField.startsWith('block:')) {
            const [, sId, bId, field] = editingField.split(':');
            const sections = Array.isArray(sectionData.content) ? [...(sectionData.content as any)] : [];

            newContent = sections.map((s: any) => {
                if (s.id === sId) {
                    if (bId === 'root') {
                        // Actualizar título o descripción de la sección propia
                        return { ...s, [field]: editValue };
                    }
                    // Actualizar campo dentro de un bloque específico
                    return {
                        ...s,
                        blocks: (s.blocks || []).map((b: any) =>
                            b.id === bId ? { ...b, [field]: editValue } : b
                        )
                    };
                }
                return s;
            });
        } else {
            // Caso estándar para secciones fijas (Hero, Mugs estático, etc)
            newContent = {
                ...(sectionData.content as any),
                [editingField]: editValue
            };
        }

        const success = await saveContent(selectedSection, newContent);

        if (success) {
            setEditingField(null);
            setEditValue('');
            setImprovement(null);
            // Sincronización inmediata
            setTimeout(() => {
                fetchContent(); // Recargar datos locales del editor
                onContentUpdate?.(); // Notificar a la página principal
            }, 100);
        }
    };

    const handleAutoOptimize = async () => {
        if (!selectedSection) return;
        setAutoOptimizing(true);
        setOptimizationDraft(null);
        try {
            const currentContent = getSelectedContent();
            const response = await fetch('/api/seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'auto_optimize',
                    text: currentContent,
                    section: selectedSection,
                    context: 'IMPORTANT: Keep Titles as short titles (5-8 words) and Paragraphs as 2-3 sentence blocks. Do not mix them.'
                })
            });

            const data = await response.json();
            if (data.success && data.data?.optimized) {
                setOptimizationDraft(data.data.optimized);
            }
        } catch (error) {
            console.error('Error auto-optimizing:', error);
        } finally {
            setAutoOptimizing(false);
        }
    };

    const applyGlobalOptimization = async () => {
        if (!selectedSection || !optimizationDraft) return;
        await saveContent(selectedSection, optimizationDraft);
        setOptimizationDraft(null);
        alert('Sección optimizada y guardada correctamente.');
    };





    const handleImprove = async (text: string) => {
        setImproving(true);
        setImprovement(null);
        try {
            const lowField = (editingField || '').toLowerCase();

            // Definir ROLES estrictos para la IA
            let roleDescription = '';
            let maxLength = 0;

            if (lowField.includes('subtitle')) {
                roleDescription = 'ERES UN EXPERTO EN BRANDING. Tu objetivo es crear una "Etiqueta" o "Subtítulo Superior" de alto impacto. Debe ser corto, potente y evocar exclusividad o novedad.';
                maxLength = 4; // Palabras
            } else if (lowField.includes('title')) {
                roleDescription = 'ERES UN COPYWRITER SENIOR. Tu objetivo es crear un TÍTULO (H1/H2) persuasivo que capture la atención al instante. Debe incluir la palabra clave principal de la categoría de forma natural.';
                maxLength = 8;
            } else if (lowField.includes('paragraph') || lowField.includes('description') || lowField.includes('textcontent')) {
                roleDescription = 'ERES UN ESPECIALISTA DE PRODUCTO TÉCNICO. Tu objetivo es redactar una DESCRIPCIÓN comercial que fusione beneficios emocionales con especificaciones técnicas reales (materiales, funciones). NO seas genérico, usa los datos técnicos provistos.';
                maxLength = 35;
            } else if (lowField.includes('cta') || lowField.includes('button')) {
                roleDescription = 'ERES UN EXPERTO EN CRO (Conversión). Tu objetivo es crear un texto para BOTÓN de acción irresistible y directo.';
                maxLength = 3;
            } else {
                roleDescription = 'ERES UN REDACTOR EXPERTO. Crea un texto breve y profesional.';
                maxLength = 15;
            }

            // REGLA DE ORO: No JSON, No Markdown
            const finalContext = `
            CONTEXTO DE CATEGORÍA: ${contextCategory}
            DATOS TÉCNICOS REALES A USAR (ADN): ${contextSpecs}
            
            ROL DE IA: ${roleDescription}
            
            INSTRUCCIONES DE FORMATO:
            1. Devuelve ÚNICAMENTE el texto sugerido.
            2. NO uses comillas.
            3. NO uses markdown.
            4. Longitud máxima aproximada: ${maxLength} palabras.
            5. Tono: Premium, Corporativo, Sustentable.
            `;

            // Determinar el nombre real de la sección para dar contexto (Mugs, Botellas, etc)
            let sectionName = selectedSection ? (SECTION_LABELS[selectedSection] || selectedSection) : 'General';


            // ... (lógica existente para nombres dinámicos) ...

            const response = await fetch('/api/seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'improve',
                    text: text || `Generar texto para ${contextCategory}`, // Si está vacío, dale una semilla
                    section: sectionName,
                    context: finalContext
                })
            });

            const data = await response.json();
            if (data.success && data.data) {
                const rawSuggestion = data.data;
                let improvedText = '';

                // Si la IA mandó un objeto a pesar de la orden, intentamos extraer el texto
                if (typeof rawSuggestion.improved === 'object' && rawSuggestion.improved !== null) {
                    improvedText = rawSuggestion.improved.text || rawSuggestion.improved.titulo || rawSuggestion.improved.improved || Object.values(rawSuggestion.improved)[0] as string;
                } else {
                    improvedText = rawSuggestion.improved || '';
                }

                // Limpieza final
                improvedText = improvedText.replace(/^["'{]+|["'}]+\s*$/g, '').replace(/^[A-Z_]+:\s*/i, '');

                setImprovement({
                    ...rawSuggestion,
                    improved: improvedText,
                    reason: `Optimizado para ${contextCategory} usando specs reales.`
                });
            }
        } catch (error) {
            console.error('Error improving:', error);
        } finally {
            setImproving(false);
        }
    };



    const renderEditableField = (key: string, value: unknown) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        const isEditing = editingField === key;

        // Determinar tipo visual del campo
        const isTitle = key.toLowerCase().includes('title');
        const isParagraph = key.toLowerCase().includes('paragraph') || key.toLowerCase().includes('desc') || key.toLowerCase().includes('textcontent');
        const isSubtitle = key.toLowerCase().includes('subtitle');
        const isLink = key.toLowerCase().includes('link') || key.toLowerCase().includes('cta');

        return (
            <div
                key={key}
                style={{
                    padding: '16px',
                    backgroundColor: isEditing ? 'rgba(0, 212, 189, 0.05)' : 'rgba(255,255,255,0.02)',
                    borderLeft: isEditing ? '3px solid var(--accent-turquoise)' : '3px solid transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '8px',
                    transition: 'all 0.2s ease'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        color: isEditing ? 'var(--accent-turquoise)' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        {isTitle && <Type size={12} />}
                        {isParagraph && <FileText size={12} />}
                        {isSubtitle && <Sparkles size={10} />}
                        {isLink && <LinkIcon size={12} />}

                        {(() => {
                            const realFieldName = key.includes(':') ? key.split(':').pop() || key : key;
                            return FIELD_LABELS[realFieldName] || realFieldName.replace(/_/g, ' ').toUpperCase();
                        })()}
                    </label>
                    {!isEditing && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleFieldEdit(key, stringValue)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }} title="Editar">
                                <Edit3 size={12} />
                            </button>
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <div>
                        <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder={`Escribe un ${isTitle ? 'título' : 'texto'} aquí...`}
                            style={{
                                width: '100%',
                                minHeight: isParagraph ? '120px' : '60px', // Más altura para párrafos
                                padding: '12px',
                                backgroundColor: 'rgba(0,0,0,0.4)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: isTitle ? '16px' : '13px', // Títulos más grandes visualmente
                                fontWeight: isTitle ? '600' : '400',
                                lineHeight: 1.5,
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                        />

                        {/* Contexto Activo (Feedback visual) */}
                        <div style={{ fontSize: '9px', color: '#555', marginTop: '6px', fontStyle: 'italic' }}>
                            Generando con contexto: <span style={{ color: 'var(--accent-gold)' }}>{contextCategory}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button onClick={handleFieldSave} disabled={saving} style={{ padding: '8px 16px', backgroundColor: 'var(--accent-turquoise)', color: 'black', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} GUARDAR
                            </button>

                            <button onClick={() => handleImprove(editValue)} disabled={improving} style={{ padding: '8px 16px', backgroundColor: 'var(--accent-gold)', color: 'black', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {improving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} MEJORAR (IA)
                            </button>

                            <button onClick={() => { setEditingField(null); setImprovement(null); }} style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
                                CANCELAR
                            </button>
                        </div>

                        {/* ... (Renderizado de Sugerencia IA igual que antes) ... */}
                        {improvement && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    marginTop: '16px',
                                    padding: '16px',
                                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                    border: '1px solid var(--accent-gold)',
                                    borderRadius: '8px'
                                }}
                            >
                                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-gold)', marginBottom: '8px' }}>
                                    ✨ SUGERENCIA IA ({contextCategory})
                                </div>
                                <p style={{ color: 'white', fontSize: isTitle ? '16px' : '13px', fontWeight: isTitle ? '600' : '400', marginBottom: '8px' }}>
                                    {typeof improvement.improved === 'string' ? improvement.improved : JSON.stringify(improvement.improved)}
                                </p>
                                {/* ... resto del componente de sugerencia ... */}
                                <button
                                    onClick={applyImprovement}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: 'var(--accent-gold)',
                                        color: 'black',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        marginTop: '10px'
                                    }}
                                >
                                    <Check size={12} /> APLICAR SUGERENCIA
                                </button>
                            </motion.div>
                        )}

                    </div>
                ) : (
                    <p style={{
                        color: typeof value === 'string' ? 'white' : '#888',
                        fontSize: isTitle ? '14px' : '12px', // Diferenciación visual en modo lectura
                        fontWeight: isTitle ? '600' : '400',
                        margin: 0,
                        lineHeight: 1.5,
                        opacity: isTitle ? 1 : 0.8
                    }}>
                        {stringValue.substring(0, 150)}{stringValue.length > 150 ? '...' : ''}
                    </p>
                )}
            </div>
        );
    };

    return (
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
                        width: '450px',
                        backgroundColor: '#0a0a0a',
                        boxShadow: '-20px 0 80px rgba(0,0,0,0.8)',
                        zIndex: 100000,
                        display: 'flex',
                        flexDirection: 'column',
                        borderLeft: '1px solid rgba(255,255,255,0.05)'
                    }}
                >
                    {/* Header con Context Selector */}
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        backgroundColor: '#050505'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{
                                margin: 0, fontFamily: 'var(--font-heading)', letterSpacing: '2px',
                                display: 'flex', alignItems: 'center', gap: '12px'
                            }}>
                                <div style={{ backgroundColor: 'var(--accent-gold)', padding: '6px', borderRadius: '4px', display: 'flex' }}>
                                    <FileText size={18} style={{ color: 'black' }} />
                                </div>
                                EDITOR <span style={{ color: 'var(--accent-turquoise)' }}>SEO</span>
                            </h3>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Selector de Contexto */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '9px', fontWeight: '700', color: '#666', textTransform: 'uppercase' }}>
                                Contexto de IA (Categoría para Specs)
                            </label>
                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="custom-scroll">
                                {AVAILABLE_CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setContextCategory(cat)}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '4px',
                                            border: contextCategory === cat ? '1px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.1)',
                                            backgroundColor: contextCategory === cat ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                                            color: contextCategory === cat ? 'var(--accent-gold)' : '#888',
                                            fontSize: '10px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        padding: '0 24px'
                    }}>
                        {[
                            { id: 'edit', label: 'Editar', icon: Edit3 },
                            { id: 'analyze', label: 'Analizar', icon: BarChart3 },
                            { id: 'audit', label: 'Auditoría', icon: Zap }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                style={{
                                    flex: 1,
                                    padding: '14px 0',
                                    background: 'none',
                                    border: 'none',
                                    color: activeTab === tab.id ? 'var(--accent-turquoise)' : '#555',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    cursor: 'pointer',
                                    borderBottom: activeTab === tab.id ? '2px solid var(--accent-turquoise)' : '2px solid transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Section Selector */}
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }} className="custom-scroll">
                        <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
                            {webContent.map(section => (
                                <button
                                    key={section.section}
                                    onClick={() => setSelectedSection(section.section)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: selectedSection === section.section
                                            ? 'var(--accent-turquoise)'
                                            : 'rgba(255,255,255,0.05)',
                                        color: selectedSection === section.section ? 'black' : 'white',
                                        border: 'none',
                                        borderRadius: '20px',
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {SECTION_LABELS[section.section] || section.section}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="custom-scroll">
                        {loading ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '100px 0',
                                gap: '20px'
                            }}>
                                <Loader2 size={40} style={{ color: 'var(--accent-turquoise)' }} className="animate-spin" />
                                <p style={{ color: '#555', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>
                                    Cargando contenido...
                                </p>
                            </div>
                        ) : activeTab === 'edit' ? (
                            <div>
                                {selectedSection === 'sections' ? (
                                    // Renderizado especial para Secciones Dinámicas y sus Bloques
                                    (Array.isArray(getSelectedContent()) ? (getSelectedContent() as unknown as any[]) : []).map((section: any) => (
                                        <div key={section.id} style={{ marginBottom: '40px', borderLeft: '2px solid rgba(255,255,255,0.05)', paddingLeft: '20px' }}>
                                            <div style={{ fontSize: '10px', color: '#666', marginBottom: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: section.bgColor || 'var(--accent-turquoise)' }}></div>
                                                SECCIÓN: {section.title1?.toUpperCase() || 'NUEVA SECCIÓN'}
                                            </div>

                                            {/* Los campos configurables solicitados */}
                                            {renderEditableField(`block:${section.id}:root:subtitle`, section.subtitle || '')}
                                            {renderEditableField(`block:${section.id}:root:title1`, section.title1 || '')}
                                            {renderEditableField(`block:${section.id}:root:paragraph1`, section.paragraph1 || '')}
                                            {renderEditableField(`block:${section.id}:root:title2`, section.title2 || '')}
                                            {renderEditableField(`block:${section.id}:root:paragraph2`, section.paragraph2 || '')}

                                            {/* Opcional: Otros bloques con texto (pueden heredar de los campos anteriores) */}
                                            {section.blocks?.filter((b: any) => (b.type === 'text' || b.type === 'both') && b.textContent).map((block: any) => (
                                                <div key={block.id} style={{ marginTop: '15px', opacity: 0.6 }}>
                                                    <div style={{ fontSize: '8px', color: 'var(--accent-gold)', marginBottom: '5px' }}>
                                                        └ Bloque Específico: {block.label || 'Texto'}
                                                    </div>
                                                    {renderEditableField(`block:${section.id}:${block.id}:textContent`, block.textContent || '')}
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    // Renderizado estándar para secciones fijas (Hero, etc)
                                    Object.entries(getSelectedContent()).map(([key, value]) => {
                                        if (typeof value === 'object' && !Array.isArray(value)) return null;
                                        if (Array.isArray(value)) return null;
                                        // Filtramos campos redundantes si ya los procesamos antes o si son obsoletos
                                        if (key === 'subtitle' || key === 'title2' || key === 'paragraph2' || key === 'title_2' || key === 'description_2') return null;
                                        return renderEditableField(key, value);
                                    })
                                )}
                            </div>
                        ) : activeTab === 'analyze' ? (
                            <div>
                                {/* Botón para analizar toda la sección */}
                                <button
                                    onClick={() => {
                                        const content = getSelectedContent();
                                        const allText = Object.values(content)
                                            .filter(v => typeof v === 'string')
                                            .join(' ');
                                        handleAnalyze(allText);
                                    }}
                                    disabled={analyzing}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        backgroundColor: analyzing ? 'rgba(0, 212, 189, 0.2)' : 'var(--accent-turquoise)',
                                        color: analyzing ? 'var(--accent-turquoise)' : 'black',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        cursor: analyzing ? 'wait' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        marginBottom: '24px'
                                    }}
                                >
                                    {analyzing ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            ANALIZANDO {SECTION_LABELS[selectedSection || '']?.toUpperCase()}...
                                        </>
                                    ) : (
                                        <>
                                            <BarChart3 size={18} />
                                            ANALIZAR {SECTION_LABELS[selectedSection || '']?.toUpperCase()}
                                        </>
                                    )}
                                </button>

                                {analysis ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <div style={{
                                            padding: '24px',
                                            backgroundColor: 'rgba(0, 212, 189, 0.1)',
                                            borderRadius: '12px',
                                            marginBottom: '20px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{
                                                fontSize: '48px',
                                                fontWeight: '800',
                                                color: analysis.score >= 70 ? 'var(--accent-turquoise)' : analysis.score >= 40 ? 'var(--accent-gold)' : '#ef4444'
                                            }}>
                                                {analysis.score}
                                            </div>
                                            <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>
                                                Puntuación SEO
                                            </div>
                                        </div>

                                        {/* Botón de Auto-Optimización Basado en Sugerencias */}
                                        <button
                                            onClick={handleAutoOptimize}
                                            disabled={autoOptimizing}
                                            style={{
                                                width: '100%',
                                                padding: '16px',
                                                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                                                color: 'var(--accent-gold)',
                                                border: '1px solid var(--accent-gold)',
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                                fontWeight: '800',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                marginBottom: '30px'
                                            }}
                                        >
                                            {autoOptimizing ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    GENERANDO MEJORAS...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={16} />
                                                    EJECUTAR MEJORAS SUGERIDAS CON IA
                                                </>
                                            )}
                                        </button>

                                        {optimizationDraft && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                style={{
                                                    padding: '20px',
                                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '12px',
                                                    marginBottom: '24px'
                                                }}
                                            >
                                                <h4 style={{ color: 'var(--accent-gold)', fontSize: '11px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Check size={14} /> VISTA PREVIA DE OPTIMIZACIÓN
                                                </h4>
                                                {Object.entries(optimizationDraft).map(([key, value]) => (
                                                    <div key={key} style={{ marginBottom: '12px' }}>
                                                        <div style={{ fontSize: '9px', color: '#666', marginBottom: '4px' }}>{key.toUpperCase()}</div>
                                                        <div style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.4' }}>{value}</div>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={applyGlobalOptimization}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        backgroundColor: 'var(--accent-turquoise)',
                                                        color: 'black',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: '900',
                                                        marginTop: '16px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    APLICAR TODAS LAS MEJORAS
                                                </button>
                                            </motion.div>
                                        )}

                                        <div style={{ marginBottom: '20px' }}>
                                            <h4 style={{ color: 'var(--accent-turquoise)', fontSize: '12px', marginBottom: '12px' }}>
                                                ✓ Fortalezas
                                            </h4>
                                            {analysis.strengths?.map((s, i) => (
                                                <p key={i} style={{ color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>• {s}</p>
                                            ))}
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <h4 style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>
                                                ✗ Debilidades
                                            </h4>
                                            {analysis.weaknesses?.map((w, i) => (
                                                <p key={i} style={{ color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>• {w}</p>
                                            ))}
                                        </div>

                                        <div>
                                            <h4 style={{ color: 'var(--accent-gold)', fontSize: '12px', marginBottom: '12px' }}>
                                                💡 Sugerencias
                                            </h4>
                                            {analysis.suggestions?.map((s, i) => (
                                                <p key={i} style={{ color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>• {s}</p>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#555' }}>
                                        <BarChart3 size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                        <p style={{ fontSize: '12px' }}>Haz clic en el botón para analizar el contenido SEO</p>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'audit' ? (
                            <div>
                                {/* Auditoría SEO completa */}
                                <button
                                    onClick={async () => {
                                        setAnalyzing(true);
                                        setAnalysis(null);
                                        try {
                                            const allContent = webContent.map(s => ({
                                                section: s.section,
                                                content: Object.values(s.content)
                                                    .filter(v => typeof v === 'string')
                                                    .join(' ')
                                            }));

                                            const response = await fetch('/api/seo', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    action: 'audit',
                                                    sections: allContent
                                                })
                                            });

                                            const data = await response.json();
                                            if (data.success && data.data) {
                                                setAnalysis(data.data);
                                            }
                                        } catch (error) {
                                            console.error('Error:', error);
                                        } finally {
                                            setAnalyzing(false);
                                        }
                                    }}
                                    disabled={analyzing}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        backgroundColor: analyzing ? 'rgba(212, 175, 55, 0.2)' : 'var(--accent-gold)',
                                        color: analyzing ? 'var(--accent-gold)' : 'black',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        cursor: analyzing ? 'wait' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        marginBottom: '24px'
                                    }}
                                >
                                    {analyzing ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            AUDITANDO SITIO COMPLETO...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={18} />
                                            AUDITORÍA COMPLETA DEL SITIO
                                        </>
                                    )}
                                </button>

                                {analysis ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <div style={{
                                            padding: '24px',
                                            backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                            borderRadius: '12px',
                                            marginBottom: '20px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{
                                                fontSize: '48px',
                                                fontWeight: '800',
                                                color: analysis.score >= 70 ? 'var(--accent-turquoise)' : analysis.score >= 40 ? 'var(--accent-gold)' : '#ef4444'
                                            }}>
                                                {analysis.score}
                                            </div>
                                            <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>
                                                Puntuación Global
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <h4 style={{ color: 'var(--accent-turquoise)', fontSize: '12px', marginBottom: '12px' }}>
                                                ✓ Puntos Fuertes
                                            </h4>
                                            {analysis.strengths?.map((s, i) => (
                                                <p key={i} style={{ color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>• {s}</p>
                                            ))}
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <h4 style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>
                                                ✗ Áreas de Mejora
                                            </h4>
                                            {analysis.weaknesses?.map((w, i) => (
                                                <p key={i} style={{ color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>• {w}</p>
                                            ))}
                                        </div>

                                        <div>
                                            <h4 style={{ color: 'var(--accent-gold)', fontSize: '12px', marginBottom: '12px' }}>
                                                🎯 Acciones Recomendadas
                                            </h4>
                                            {analysis.suggestions?.map((s, i) => (
                                                <p key={i} style={{ color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>• {s}</p>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#555' }}>
                                        <Zap size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                        <p style={{ fontSize: '12px', marginBottom: '8px' }}>Auditoría SEO completa del sitio</p>
                                        <p style={{ fontSize: '11px', color: '#444' }}>Analiza todas las secciones y genera recomendaciones</p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '16px 24px',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        backgroundColor: 'rgba(0,0,0,0.3)'
                    }}>
                        <button
                            onClick={fetchContent}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <RefreshCw size={14} />
                            RECARGAR DESDE SUPABASE
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
