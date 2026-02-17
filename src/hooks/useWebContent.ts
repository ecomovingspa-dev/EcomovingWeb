'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
}

export interface LayoutBlock {
    id: string;
    label: string;
    type?: 'image' | 'text' | 'both';
    image?: string;
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
    writingMode?: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr';
    fontSize?: string; // ej: "2rem"
    gallery?: string[]; // Para diapositivas dentro del bloque
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
    [key: string]: any;
}

const defaultContent: WebContent = {
    hero: {
        title1: 'ECOMOVING: MERCHANDISING SUSTENTABLE Y DISEÑO PREMIUM',
        paragraph1: 'Elevamos tu marca con productos corporativos de alto impacto y conciencia ecológica.',
        cta_text: 'EXPLORAR CATÁLOGO 2026',
        cta_link: '/catalogo',
        background_image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop',
    },
    sections: []
};

export function useWebContent() {
    const [content, setContent] = useState<WebContent>(defaultContent);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContent = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('web_contenido')
                .select('section, content');

            if (fetchError) {
                console.warn('Supabase fetch error (using defaults):', fetchError);
                setContent(defaultContent);
                return;
            }

            console.log(`[useWebContent] Filas obtenidas: ${data?.length || 0}`);

            if (data && data.length > 0) {
                const newContent: WebContent = { ...defaultContent };
                const extraSections: Record<string, any> = {};

                // 1. Primero procesamos las filas maestras (hero y sections)
                data.forEach((row) => {
                    const sectionName = row.section;
                    if (sectionName === 'hero') {
                        newContent.hero = { ...newContent.hero, ...(row.content as any) };
                    } else if (sectionName === 'sections') {
                        const rawData = row.content;
                        newContent.sections = Array.isArray(rawData) ? rawData :
                            (typeof rawData === 'object' ? Object.values(rawData) : []);
                    } else {
                        // Guardamos las secciones extra (mugs, botellas, etc.) en el objeto principal y para procesar galerías
                        const key = sectionName.toLowerCase();
                        extraSections[key] = row.content;
                        newContent[key] = row.content;
                    }
                });

                // 2. Fusionar galerías de secciones extra en el array de secciones dinámicas
                if (newContent.sections.length > 0) {
                    newContent.sections = newContent.sections.map(s => {
                        const titleLower = (s.title1 || (s as any).title || '').toLowerCase();
                        const idLower = (s.id || '').toLowerCase();

                        // Buscamos si alguna de las claves extra (mugs, botellas...) está en el título o ID
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
    }, []);

    const updateSection = useCallback(async (section: keyof WebContent, newContentData: any) => {
        try {
            const currentSection = content[section];
            let merged;

            if (Array.isArray(currentSection)) {
                // Si es un array, el 'newContentData' ya es el nuevo array completo
                merged = newContentData;
            } else {
                // Si es un objeto, lo mezclamos
                merged = { ...currentSection, ...newContentData };
            }

            const { error: updateError } = await supabase
                .from('web_contenido')
                .upsert({
                    section,
                    content: merged,
                    updated_by: 'useWebContent'
                }, {
                    onConflict: 'section'
                });

            if (updateError) throw updateError;

            setContent(prev => ({
                ...prev,
                [section]: merged
            }));

            return true;
        } catch (err) {
            console.error('Error updating section:', err);
            return false;
        }
    }, [content]);

    useEffect(() => {
        fetchContent();

        const channel = supabase
            .channel('web_contenido_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'web_contenido' },
                () => {
                    fetchContent();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchContent]);

    return {
        content,
        loading,
        error,
        refetch: fetchContent,
        updateSection
    };
}
