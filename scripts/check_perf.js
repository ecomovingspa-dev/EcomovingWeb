
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('Starting script...');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log('Fetching data...');
    try {
        const { data, error } = await supabase
            .from('web_contenido')
            .select('*');

        if (error) {
            console.error('Error:', error);
            return;
        }

        console.log('--- DB STATS ---');
        console.log('Total rows:', data.length);
        data.forEach(row => {
            const size = JSON.stringify(row.content).length;
            console.log(`Section: ${row.section}, Content Size: ${(size / 1024).toFixed(2)} KB`);
        });
    } catch (e) {
        console.error('Catch Error:', e);
    }
}

checkData();
