'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export interface HeroContent {
    title1: string;
    paragraph1: string;
    cta_text: string;
    cta_link: string;
    background_image: string;
    background_image_2?: string;
    background_image_3?: string;
    alt_text?: string;
    meta_title?: string;
    gallery?: string[];
    drive_folder_id?: string;
    text_align_h?: string;
    text_align_v?: string;
    titleLineHeight?: string;
    paragraphLineHeight?: string;
    titleSize?: string;
    paragraphSize?: string;
    hidden?: boolean;
}

export interface LayoutBlock {
    id: string;
    label: string;
    type?: 'image' | 'text' | 'both' | 'video';
    image?: string;
    videoUrl?: string;
    // Editorial Content for Free Canvas
    blockTitle?: string;
    blockParagraph?: string;
    textContent?: string;
    bgColor?: string;
    textColor?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    span: string; // formato "ancho x alto" ej: "4x2"
    col: number;  // 1-12
    row: number;  // 1-5
    zIndex: number; // Para traslapes
    alt_text?: string;
    // Propiedades Avanzadas (Super Tool)
    opacity?: number;       // 0-1
    borderRadius?: string;  // ej: "20px"
    blur?: string;          // ej: "10px"
    shadow?: 'none' | 'soft' | 'strong' | 'neon';
    gradient?: boolean;
    isCircle?: boolean;
    borderColor?: string;
    writingMode?: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr';
    fontSize?: string; // ej: "2rem"
    gallery?: string[]; // Para diapositivas dentro del bloque
    galleryAnimation?: 'fade' | 'slide-h' | 'slide-v' | 'zoom' | 'none' | 'peek' | 'crossfade' | 'full-carousel';

    // Transformación Experta
    transform_zoom?: number;
    transform_posX?: number; // 0-100%
    transform_posY?: number; // 0-100%
    transform_aspectRatio?: string;

    // Advanced Typography (New)
    titleSize?: string;     // Tamaños: 18px, 24px, 32px, 48px, 64px
    fontWeight?: string;    // 400, 600, 700, 900
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    letterSpacing?: string; // normal, 1px, 2px, 4px, -1px
    lineHeight?: string;    // 1.2, 1.5, 1.8, 2.0 (Párrafo)
    titleLineHeight?: string; // 0.9, 1.0, 1.1, 1.2
    fontStyle?: 'normal' | 'italic';
    fontFamily?: 'sans' | 'serif' | 'mono';
    textPadding?: string;   // ej: "30px" o "20px 40px"
    textMaxWidth?: string;  // ej: "90%" o "500px"
    textVerticalAlign?: 'flex-start' | 'center' | 'flex-end';
    paragraphSize?: string; // ej: "1rem" o "16px"
    textGap?: string; // ej: "10px"
    link?: string; // Enlace asociado al bloque (generado por la IA al buscar un SKU)
    buttonText?: string;
    buttonSku?: string;
    textProtection?: boolean;
    category?: string;
}

export interface DynamicSection {
    id: string;
    order: number;
    subtitle?: string;    // Etiqueta superior opcional
    title1: string;       // Título principal
    paragraph1: string;   // Descripción principal
    title2?: string;      // Título secundario opcional
    paragraph2?: string;  // Descripción secundaria opcional
    blocks: LayoutBlock[];
    bgColor: string;
    titleColor?: string;
    titleSize?: string; // ej: "4.5rem"
    descColor?: string;
    descSize?: string;
    descAlign?: 'left' | 'center' | 'right' | 'justify';
    descCol?: number;   // 1-24
    descSpan?: number;  // 1-24
    titleLineHeight?: string;
    paragraphLineHeight?: string;
    gallery?: string[];
    seo_keywords?: string;
}

export interface GridCell {
    id: string;
    label: string;
    image: string;
    span: string;
    col?: number;
    row?: number;
    alt_text?: string;
}

export interface SectionContent {
    title1: string;
    paragraph1: string;
    title2?: string;
    paragraph2?: string;
    cells?: GridCell[];
    cta_text: string;
    cta_link: string;
    alt_text?: string;
    meta_title?: string;
    focus_keywords?: string;
    gallery?: string[];
    drive_folder_id?: string;
}

export interface WebContent {
    hero: HeroContent;
    sections: DynamicSection[];
    hideHero?: boolean;
    [key: string]: any;
}

const defaultContent: WebContent = {
    hero: {
        title1: '',
        paragraph1: '',
        cta_text: '',
        cta_link: '',
        background_image: '',
    },
    sections: []
};

export function useWebContent(projectPath?: string, projectId?: string) {
    const [content, setContent] = useState<WebContent>(defaultContent);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabaseClient = getSupabaseClient(projectId);

    const fetchContent = useCallback(async () => {
        try {
            setLoading(true);

            // PRIORIDAD 1: LECTURA LOCAL SI HAY RUTA DE PROYECTO (Studio Mode)
            if (projectPath) {
                const res = await fetch(`/api/local/read?t=${Date.now()}`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    body: JSON.stringify({ projectPath, fileName: 'web_content_sync.json' })
                });
                const { success, content: localContent } = await res.json();
                if (success) {
                    const normalized = { 
                        ...defaultContent, 
                        ...localContent,
                        sections: localContent.sections || []
                    };
                    setContent(normalized);
                } else {
                    console.log("[useWebContent] No local sync file found. Starting with empty workspace.");
                    setContent(defaultContent);
                }
                setLoading(false);
                return;
            }

            // PRIORIDAD 1.5: INTENTAR LEER ARCHIVO ESTÁTICO LOCAL EN LA RAÍZ DEL SITIO (Modo Producción Estática)
            try {
                const res = await fetch(`/web_content_sync.json?t=${Date.now()}`, {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                if (res.ok) {
                    const localContent = await res.json();
                    const normalized = { 
                        ...defaultContent, 
                        ...localContent,
                        sections: localContent.sections || []
                    };
                    setContent(normalized);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.log("No se pudo cargar el archivo local web_content_sync.json, usando Supabase.");
            }

            // PRIORIDAD 2: SUPABASE (Modo Producción o Fallback)
            const { data, error: fetchError } = await supabaseClient
                .from('web_contenido')
                .select('section, content');

            if (fetchError) {
                console.warn('Supabase fetch error (using defaults):', fetchError);
                setContent(defaultContent);
                return;
            }

            if (data && data.length > 0) {
                const newContent: WebContent = { ...defaultContent };
                const extraSections: Record<string, any> = {};

                data.forEach((row) => {
                    const sectionName = row.section;
                    if (sectionName === 'hero') {
                        newContent.hero = { ...newContent.hero, ...(row.content as any) };
                    } else if (sectionName === 'sections') {
                        const rawData = row.content;
                        newContent.sections = Array.isArray(rawData) ? rawData :
                            (typeof rawData === 'object' ? Object.values(rawData) : []);
                    } else {
                        const key = sectionName.toLowerCase();
                        extraSections[key] = row.content;
                        newContent[key] = row.content;
                    }
                });

                if (newContent.sections.length > 0) {
                    newContent.sections = newContent.sections.map(s => {
                        const titleLower = (s.title1 || (s as any).title || '').toLowerCase();
                        const idLower = (s.id || '').toLowerCase();
                        const foundKey = Object.keys(extraSections).find(key =>
                            titleLower.includes(key) || idLower.includes(key)
                        );
                        const extra = foundKey ? extraSections[foundKey] : null;
                        if (extra && extra.gallery && Array.isArray(extra.gallery)) {
                            return { ...s, gallery: extra.gallery };
                        }
                        return s;
                    });
                }
                setContent(newContent);
            }
        } catch (err) {
            console.error('Error fetching web content:', err);
            setError(String(err));
            setContent(defaultContent);
        } finally {
            setLoading(false);
        }
    }, [projectPath]);

    const updateSection = useCallback(async (section: keyof WebContent, newContentData: any) => {
        try {
            const currentSection = content[section];
            let merged = Array.isArray(currentSection) ? newContentData : { ...currentSection, ...newContentData };

            // 1. Update Supabase
            try {
                const { error: updateError } = await supabaseClient
                    .from('web_contenido')
                    .upsert({
                        section,
                        content: merged,
                        updated_by: 'useWebContent'
                    }, { onConflict: 'section' });
                if (updateError) throw updateError;
            } catch (err) {
                console.warn("[useWebContent] Supabase sync error (using local state):", err);
            }

            const updatedContent = { ...content, [section]: merged };
            setContent(updatedContent);

            // 2. If projectPath is active, save to local sync file
            if (projectPath) {
                try {
                    await fetch('/api/local/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            projectPath,
                            fileName: 'web_content_sync.json',
                            content: updatedContent
                        })
                    });
                } catch (localErr) {
                    console.error("[useWebContent] Local sync save error:", localErr);
                }
            }

            return true;
        } catch (err) { 
            return false; 
        }
    }, [content, projectPath]);

    useEffect(() => {
        fetchContent();
        if (!projectPath) {
            const channelId = `web-content-sync-${Math.random().toString(36).substring(7)}`;
            const channel = supabaseClient.channel(channelId).on('postgres_changes' as any, { event: '*', schema: 'public', table: 'web_contenido' }, () => fetchContent());
            channel.subscribe();
            return () => { supabaseClient.removeChannel(channel); };
        }
    }, [fetchContent, projectPath, supabaseClient]);

    return { content, loading, error, refetch: fetchContent, updateSection };
}
