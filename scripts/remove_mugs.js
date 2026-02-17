
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeMugSection() {
    console.log('Iniciando eliminación de la sección de mugs...');

    const { data: sectionsRow } = await supabase
        .from('web_contenido')
        .select('*')
        .eq('section', 'sections')
        .single();

    if (sectionsRow && Array.isArray(sectionsRow.content)) {
        const sections = sectionsRow.content.filter(s => s.id !== 'section_mugs' && s.id !== 'mugs');

        const { error } = await supabase
            .from('web_contenido')
            .upsert({
                section: 'sections',
                content: sections,
                updated_by: 'remove_script',
                updated_at: new Date().toISOString()
            }, { onConflict: 'section' });

        if (error) console.error('Error al actualizar secciones:', error);
        else console.log('Sección de mugs eliminada del array dinámico en Supabase.');
    }

    console.log('Eliminación completada.');
}

removeMugSection();
