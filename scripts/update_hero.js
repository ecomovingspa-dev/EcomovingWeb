const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const heroContent = {
        title1: "DISTINCIÓN Y PROPÓSITO: LA NUEVA ERA DE LA HIDRATACIÓN CORPORATIVA",
        paragraph1: "Elevamos el estándar del merchandising empresarial con una curaduría de tazas y botellas que equilibran sofisticación técnica y conciencia ecológica. Transformamos objetos funcionales en embajadores silenciosos de calidad y respeto ambiental.",
        cta_text: "VER CATÁLOGO 2026",
        cta_link: "/catalogo",
        background_image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop"
    };

    const { error } = await supabase
        .from('web_contenido')
        .upsert({
            section: 'hero',
            content: heroContent,
            updated_by: 'script_update_hero'
        }, {
            onConflict: 'section'
        });

    if (error) {
        console.error('Error updating hero:', error);
    } else {
        console.log('Hero updated successfully!');
    }
}

main();
