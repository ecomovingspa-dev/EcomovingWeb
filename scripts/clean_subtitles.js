
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanSubtitles() {
    console.log('Iniciando limpieza de subtítulos...');

    const { data: sectionsRow } = await supabase
        .from('web_contenido')
        .select('*')
        .eq('section', 'sections')
        .single();

    if (sectionsRow && Array.isArray(sectionsRow.content)) {
        const sections = sectionsRow.content.map(s => {
            return {
                ...s,
                subtitle: '',
                title_2: ''
            };
        });

        const { error } = await supabase
            .from('web_contenido')
            .upsert({
                section: 'sections',
                content: sections,
                updated_by: 'clean_script',
                updated_at: new Date().toISOString()
            }, { onConflict: 'section' });

        if (error) console.error('Error al limpiar secciones:', error);
        else console.log('Secciones limpiadas en Supabase.');
    }

    // También limpiar secciones estáticas si existen
    const sectionsToClean = ['mugs', 'botellas', 'libretas', 'mochilas', 'ecologicos', 'bolsas'];
    for (const sName of sectionsToClean) {
        const { data } = await supabase.from('web_contenido').select('*').eq('section', sName).single();
        if (data && data.content) {
            const newContent = { ...data.content, subtitle: '', title_2: '' };
            await supabase.from('web_contenido').upsert({
                section: sName,
                content: newContent,
                updated_at: new Date().toISOString()
            }, { onConflict: 'section' });
        }
    }

    console.log('Limpieza completada.');
}

cleanSubtitles();
