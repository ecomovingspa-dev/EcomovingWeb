
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTimestamps() {
    const { data, error } = await supabase
        .from('web_contenido')
        .select('section, updated_at, updated_by');

    if (error) {
        fs.writeFileSync('ts_check_error.txt', error.message);
        return;
    }

    let output = 'Timestamps en web_contenido:\n';
    data.forEach(row => {
        output += `Section: ${row.section}, Updated At: ${row.updated_at}, By: ${row.updated_by}\n`;
    });
    fs.writeFileSync('ts_check_result.txt', output);
}

checkTimestamps();
