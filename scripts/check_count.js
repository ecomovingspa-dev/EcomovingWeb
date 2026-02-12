
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCount() {
    console.log('Counting rows in agent_buffer...');
    const { count, error } = await supabase
        .from('agent_buffer')
        .select('*', { count: 'exact', head: true });

    if (error) console.error('Error agent_buffer:', error);
    else console.log('agent_buffer count:', count);

    console.log('Counting rows in web_contenido...');
    const { count: count2, error: error2 } = await supabase
        .from('web_contenido')
        .select('*', { count: 'exact', head: true });

    if (error2) console.error('Error web_contenido:', error2);
    else console.log('web_contenido count:', count2);
}

checkCount();
