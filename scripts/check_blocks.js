
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBlocks() {
    const { data, error } = await supabase
        .from('web_contenido')
        .select('*')
        .eq('section', 'sections');

    if (error) {
        fs.writeFileSync('blocks_check_error.txt', error.message);
        return;
    }

    let output = 'Detalle de Bloques en Secciones:\n';
    if (data && data.length > 0) {
        const sections = data[0].content;
        sections.forEach(s => {
            output += `--- Sección ID: ${s.id} ---\n`;
            output += `Title: ${typeof s.title === 'string' ? s.title.substring(0, 100) : JSON.stringify(s.title)}\n`;
            output += `Blocks (${s.blocks?.length || 0}):\n`;
            s.blocks?.forEach(b => {
                output += `  - Block: ${b.label}, ID: ${b.id}, Image: ${b.image}\n`;
            });
            output += '----------------------------\n';
        });
    }
    fs.writeFileSync('blocks_check_result.txt', output);
}

checkBlocks();
