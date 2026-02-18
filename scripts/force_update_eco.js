const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data } = await supabase.from('web_contenido').select('content').eq('section', 'sections').single();
    let sections = data.content;

    // Modify in memory
    sections = sections.map(s => {
        if (s.id === 'section_1770856178934') {
            s.title1 = "REGALOS PUBLICITARIOS ECOLÓGICOS";
            s.paragraph1 = "Transforma tu merchandising en una declaración de principios. Nuestra línea ecológica combina diseño funcional con materiales responsables como bambú y rPET, ofreciendo una experiencia de marca que conecta con los valores de hoy.";

            s.blocks = (s.blocks || []).map(b => {
                if (b.id === 'block_1770857574162' || (b.type === 'text' && b.bgColor)) {
                    return {
                        ...b,
                        textContent: "NATURALMENTE PREMIUM",
                        subText: "Menos plástico, más impacto. Hemos curado una selección que demuestra que lo sustentable puede ser sofisticado. Productos que se sienten bien al tacto y mejor en la conciencia, diseñados para permanecer en la vida de tus clientes, no en la basura."
                    };
                }
                return b;
            });
        }
        return s;
    });

    // Use explicit UPDATE instead of UPSERT to avoid duplicate key issues if PK handling is weird
    const { error } = await supabase
        .from('web_contenido')
        .update({ content: sections, updated_by: 'script_force_update' })
        .eq('section', 'sections');

    if (error) console.error('Error:', error);
    else console.log('Successfully updated content via UPDATE.');
}

main();
