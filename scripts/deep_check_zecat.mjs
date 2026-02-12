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
        .eq('wholesaler', 'Zecat');

    if (error) {
        console.error('Error fetching buffer:', error);
        return;
    }

    console.log(`Found ${data.length} Zecat products.`);
    data.forEach(p => {
        if (p.technical_specs && Object.keys(p.technical_specs).length > 0) {
            console.log(`Product: ${p.name}`);
            console.log(`Specs:`, JSON.stringify(p.technical_specs, null, 2));
        }
    });
}

checkBuffer();
