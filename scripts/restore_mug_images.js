
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setMugImages() {
    const { data: sectionsRow } = await supabase
        .from('web_contenido')
        .select('*')
        .eq('section', 'sections')
        .single();

    if (!sectionsRow) return;

    const sections = sectionsRow.content;
    const mugSection = sections.find(s => s.id === 'section_mugs');

    if (mugSection && mugSection.blocks) {
        const images = [
            'https://images-cdn.zecat.cl/generic_products/Jarro_Road_silver_Zecat_6jpg1626462668-1729448237.webp',
            'https://images-cdn.zecat.cl/generic_products/carrusel_mugbayo_5-1729448186.webp',
            'https://images-cdn.zecat.cl/generic_products/JarroChalten5-1729448898.webp'
        ];

        mugSection.blocks.forEach((block, i) => {
            if (images[i]) block.image = images[i];
        });

        const { error } = await supabase
            .from('web_contenido')
            .upsert({
                section: 'sections',
                content: sections,
                updated_at: new Date().toISOString()
            }, { onConflict: 'section' });

        if (!error) console.log('Imágenes de Mugs restauradas.');
    }
}

setMugImages();
