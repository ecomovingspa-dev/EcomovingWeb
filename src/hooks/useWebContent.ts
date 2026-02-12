'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface HeroContent {
    title: string;
    subtitle: string;
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
    span: string; // formato "ancho x alto" ej: "4x2"
    col: number;  // 1-12
    row: number;  // 1-5
    zIndex: number; // Para traslapes
    alt_text?: string;
}

export interface DynamicSection {
    id: string;
    order: number;
    subtitle?: string;    // Subtítulo Estratégico (Etiqueta superior)
    title: string;       // Título 1
    description: string; // Descripción 1
    title_2?: string;    // Título 2
    description_2?: string; // Descripción 2
    blocks: LayoutBlock[];
    bgColor: string;
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
    title: string;
    description: string;
    description_2?: string;
    title_2?: string;
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
}

const defaultContent: WebContent = {
    hero: {
        title: 'ECOMOVING: MERCHANDISING SUSTENTABLE Y DISEÑO PREMIUM',
        subtitle: 'Elevamos tu marca con productos corporativos de alto impacto y conciencia ecológica.',
        cta_text: 'EXPLORAR CATÁLOGO 2026',
        cta_link: '/catalogo',
        background_image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop',
    },
    sections: [
        {
            id: 'section_mugs',
            order: 1,
            title: 'MUGS PERSONALIZADOS Y TAZAS CORPORATIVAS PREMIUM',
            title_2: 'CURATORÍA DE MATERIALES',
            description: 'Descubre nuestra línea de mugs cerámicos y térmicos con acabados de alta gama.',
            description_2: 'Cada mug es seleccionado por su balance entre ingeniería térmica y tacto premium.',
            bgColor: '#050505',
            blocks: []
        }
    ]
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

            if (data && data.length > 0) {
                const newContent = { ...defaultContent };

                data.forEach((row) => {
                    const sectionName = row.section as keyof WebContent;
                    if (sectionName in newContent) {
                        if (sectionName === 'sections') {
                            // Garantizar que 'sections' siempre sea un array
                            const rawData = row.content;
                            (newContent as any).sections = Array.isArray(rawData) ? rawData :
                                (typeof rawData === 'object' ? Object.values(rawData) : []);
                        } else {
                            // Si es un objeto (como 'hero'), lo mezclamos
                            newContent[sectionName] = {
                                ...(newContent[sectionName] as any),
                                ...(row.content as any)
                            };
                        }
                    }
                });

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
