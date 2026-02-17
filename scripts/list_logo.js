
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listFiles() {
    const { data, error } = await supabase.storage.from('logotipo_ecomoving').list();
    if (error) {
        console.error('Error listing files:', error);
        return;
    }
    console.log('Files in logotipo_ecomoving:', data);
}

listFiles();
