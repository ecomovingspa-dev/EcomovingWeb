const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const sectionId = 'section_1770856178934';
    const textBlockId = 'block_1770857574162';

    // Premium Smart Content for "Regalos Publicitarios Ecológicos"
    const title1 = "REGALOS PUBLICITARIOS ECOLÓGICOS";
    const paragraph1 = "Transforma tu merchandising en una declaración de principios. Nuestra línea ecológica combina diseño funcional con materiales responsables como bambú y rPET, ofreciendo una experiencia de marca que conecta con los valores de hoy.";

    // Block Content
    const blockTitle2 = "NATURALMENTE PREMIUM";
    const blockSubText = "Menos plástico, más impacto. Hemos curado una selección que demuestra que lo sustentable puede ser sofisticado. Productos que se sienten bien al tacto y mejor en la conciencia, diseñados para permanecer en la vida de tus clientes, no en la basura.";

    const accentColor = "#00d4bd"; // Turquoise

    // Fetch master record
    const { data } = await supabase.from('web_contenido').select('*').eq('section', 'sections').single();
    let sections = data.content || [];

    let updated = false;

    sections = sections.map(s => {
        if (s.id === sectionId) {
            console.log('Found section to update:', s.title1);

            // 1. Update Section Header
            s.title1 = title1;
            s.paragraph1 = paragraph1;
            s.titleColor = accentColor;

            // 2. Update the specific Block
            if (s.blocks) {
                s.blocks = s.blocks.map(b => {
                    // Try to match by ID, or if that fails, by typical "text" type in this position
                    if (b.id === textBlockId || (b.type === 'text' && b.bgColor)) {
                        console.log('Found block to update:', b.id);
                        return {
                            ...b,
                            textContent: blockTitle2,     // Título 2
                            subText: blockSubText,        // Descripción Especial (New Field)
                            bgColor: accentColor,
                            textColor: '#000000',
                            fontSize: '1.2rem',
                            textAlign: 'left'
                        };
                    }
                    return b;
                });
            }
            updated = true;
        }
        return s;
    });

    if (!updated) {
        console.error('Could not find section with ID:', sectionId);
        return;
    }

    // Force update with UPSERT
    const { error } = await supabase
        .from('web_contenido')
        .upsert({
            section: 'sections',
            content: sections,
            updated_by: 'script_eco_fix_v2'
        });

    if (error) {
        console.error('Error updating Supabase:', error);
    } else {
        console.log('SUCCESS: Content updated for Regalos Publicitarios Ecológicos.');
    }
}

main();
