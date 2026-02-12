
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Environment variables missing!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log('Testing connection to Supabase...');
    const { data, error } = await supabase.from('web_contenido').select('*');
    if (error) {
        console.error('Connection error:', error);
    } else {
        console.log('Connection successful! Data:', JSON.stringify(data, null, 2));
    }
}

test();
