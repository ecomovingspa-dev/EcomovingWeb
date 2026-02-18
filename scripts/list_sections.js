const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase.from('content').select('*').single();
    if (error) {
        console.error('Error:', error);
        return;
    }
    const sections = data.sections || [];
    console.log('Sections:', JSON.stringify(sections.map(s => ({
        id: s.id,
        title1: s.title1,
        paragraph1: s.paragraph1
    })), null, 2));

    console.log('Hero:', JSON.stringify(data.hero.title1, null, 2));
}

main();
