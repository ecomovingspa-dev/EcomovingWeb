
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTop() {
    console.log('Fetching top 5 from agent_buffer...');
    const startTime = Date.now();
    const { data, error } = await supabase
        .from('agent_buffer')
        .select('*')
        .limit(5);

    if (error) console.error('Error:', error);
    else {
        console.log(`Fetched 5 rows in ${Date.now() - startTime}ms`);
        data.forEach(d => {
            console.log(`ID: ${d.id}, Name: ${d.name}, Images: ${d.images?.length || 0}`);
        });
    }
}

checkTop();
