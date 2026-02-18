const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data } = await supabase.from('web_contenido').select('*').eq('section', 'sections').single();
    const ecoSection = data.content.find(s => s.id === 'section_1770856178934') || {};

    console.log('Section ID:', ecoSection.id);
    console.log('Current Title:', ecoSection.title1);
    console.log('Blocks:');
    (ecoSection.blocks || []).forEach((b, i) => {
        console.log(`[${i}] ID: ${b.id}, Type: ${b.type}, Text: "${(b.textContent || '').substring(0, 20)}..." Bg: ${b.bgColor}`);
    });
}

main();
