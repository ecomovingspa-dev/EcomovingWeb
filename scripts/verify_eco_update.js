const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const sectionId = 'section_1770856178934';

    // Fetch current sections
    const { data } = await supabase.from('web_contenido').select('*').eq('section', 'sections').single();
    const sections = data.content || [];
    const section = sections.find(s => s.id === sectionId);

    if (section) {
        console.log('Title:', section.title1);
        console.log('Blocks:');
        section.blocks.forEach(b => {
            if (b.type === 'text' || b.textContent) {
                console.log(`ID: ${b.id}`);
                console.log(`   TextContent: ${b.textContent}`);
                console.log(`   SubText: ${b.subText}`); // Check if this field exists
            }
        });
    } else {
        console.log('Section not found');
    }
}

main();
