
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContent() {
    const { data, error } = await supabase
        .from('web_contenido')
        .select('*');

    if (error) {
        fs.writeFileSync('db_check_error.txt', error.message);
        return;
    }

    let output = 'Contenido actual en web_contenido:\n';
    data.forEach(row => {
        output += `--- Sección: ${row.section} ---\n`;
        if (Array.isArray(row.content)) {
            output += `Total items (array): ${row.content.length}\n`;
            row.content.forEach(item => {
                output += `  Item ID: ${item.id}, Title: ${item.title}, Blocks: ${item.blocks?.length || 0}\n`;
            });
        } else {
            output += JSON.stringify(row.content, null, 2) + '\n';
        }
        output += '----------------------------\n';
    });
    fs.writeFileSync('db_check_result.txt', output);
}

checkContent();
