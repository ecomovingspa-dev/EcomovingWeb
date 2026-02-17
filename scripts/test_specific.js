
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log('Testing logotipo_ecomoving/Logotipo_horizontal.png');
    const { data: listData, error: listError } = await supabase.storage.from('logotipo_ecomoving').list();
    console.log('List Result:', listData, listError);

    const { data: publicUrlData } = supabase.storage.from('logotipo_ecomoving').getPublicUrl('Logotipo_horizontal.png');
    console.log('Public URL:', publicUrlData.publicUrl);
}

test();
