const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const sectionId = 'section_1770856178934';
    const textBlockId = 'block_1770857574162';

    // New Content
    const title1 = "CONSCIENCIA Y DISEÑO: MERCHANDISING SUSTENTABLE";
    const paragraph1 = "Redefinimos el impacto de tu marca con una selección de artículos corporativos fabricados con materiales nobles y reciclados. Desde bambú certificado hasta fibras de trigo, cada pieza comunica el compromiso medioambiental de tu empresa sin sacrificar estética ni durabilidad.";

    const blockTitle2 = "ECO-INTELIGENCIA";
    const blockSubText = "Seamos francos: el plástico desechable ya es historia. Regalar sustentabilidad hoy es el verdadero lujo. Al elegir materiales vivos, tu marca no solo entrega un objeto, proyecta una visión. Es merchandising que tus clientes querrán conservar y usar, porque se siente bien y hace bien.";

    const accentColor = "#00d4bd"; // Premium Turquoise for Title & Block

    // Fetch current sections
    const { data } = await supabase.from('web_contenido').select('*').eq('section', 'sections').single();
    let sections = data.content || [];

    // Update the specific section
    sections = sections.map(s => {
        if (s.id === sectionId) {
            // Update Section Header
            s.title1 = title1;
            s.paragraph1 = paragraph1;
            s.titleColor = accentColor; // Set title color

            // Update Blocks
            if (s.blocks) {
                s.blocks = s.blocks.map(b => {
                    if (b.id === textBlockId) {
                        return {
                            ...b,
                            textContent: blockTitle2,     // Título 2
                            subText: blockSubText,        // Descripción Especial
                            bgColor: accentColor,         // Same as Title Color
                            textColor: '#000000',         // Contrast for Turquoise
                            fontSize: '1.2rem',
                            textAlign: 'left'
                        };
                    }
                    return b;
                });
            }
        }
        return s;
    });

    // Save back to Supabase
    const { error } = await supabase
        .from('web_contenido')
        .update({ content: sections, updated_by: 'script_eco_update' })
        .eq('section', 'sections');

    if (error) {
        console.error('Error updating Eco section:', error);
    } else {
        console.log('Eco section updated successfully with Premium Smart content!');
    }
}

main();
