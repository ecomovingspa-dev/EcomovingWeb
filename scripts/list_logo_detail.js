
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhw.supabase.co'; // Wait, let me check the URL again from .env.local
// .env.local said xgdmyjzyejjmwdqkufhp
const supabaseUrlFixed = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';

const supabase = createClient(supabaseUrlFixed, supabaseAnonKey);

async function listFiles() {
    console.log('Using URL:', supabaseUrlFixed);
    const { data, error } = await supabase.storage.from('logotipo_ecomoving').list();
    if (error) {
        console.error('Detailed Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Data:', JSON.stringify(data, null, 2));
    }
}

listFiles();
