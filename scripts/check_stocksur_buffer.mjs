import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuffer() {
    const { data, error } = await supabase
        .from('agent_buffer')
        .select('*')
        .eq('wholesaler', 'Stocksur')
        .limit(1);

    if (error) {
        console.error('Error fetching buffer:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log(`Product: ${data[0].name}`);
        console.log(`Specs (DB):`, JSON.stringify(data[0].technical_specs, null, 2));
    } else {
        console.log('No Stocksur products found.');
    }
}

checkBuffer();
