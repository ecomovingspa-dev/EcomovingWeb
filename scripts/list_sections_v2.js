const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase
        .from('web_contenido')
        .select('*')
        .eq('section', 'sections')
        .single();

    if (error) {
        console.error('Error fetching sections:', error);
    } else {
        const sections = data.content || [];
        console.log('--- SECTIONS ---');
        sections.forEach((s, i) => {
            console.log(`[${i}] ID: ${s.id}, Title: "${s.title1 || 'N/A'}", Sub: "${s.subtitle || 'N/A'}"`);
            const p = s.paragraph1 ? s.paragraph1.substring(0, 50) : 'N/A';
            console.log(`    Para: "${p}..."`);
        });
    }

    const { data: heroData } = await supabase.from('web_contenido').select('*').eq('section', 'hero').single();
    console.log('\n--- HERO ---');
    console.log('Title:', heroData?.content?.title1);
    console.log('Para:', heroData?.content?.paragraph1);
}

main();
