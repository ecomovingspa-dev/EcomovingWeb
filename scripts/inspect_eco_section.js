const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // Fetch all sections to find the "Ecológicos" one by title or content hint
    const { data, error } = await supabase
        .from('web_contenido')
        .select('*')
        .eq('section', 'sections')
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    const sections = data.content || [];
    // Find the section that looks like "Ecológicos"
    const ecoSection = sections.find(s =>
        (s.title1 && s.title1.toLowerCase().includes('ecoló')) ||
        (s.title1 && s.title1.toLowerCase().includes('eco')) ||
        (s.id === 'section_1770856178934') // Based on previous observation
    );

    if (ecoSection) {
        console.log('Found Eco Section:', JSON.stringify(ecoSection, null, 2));
    } else {
        console.log('Eco Section not found. Available IDs:', sections.map(s => s.id));
    }
}

main();
