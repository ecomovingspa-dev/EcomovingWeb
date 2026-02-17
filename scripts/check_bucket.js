
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBucket() {
    const { data, error } = await supabase.storage.getBucket('logotipo_ecomoving');
    if (error) {
        console.error('Bucket Error:', error);
    } else {
        console.log('Bucket Info:', JSON.stringify(data, null, 2));
    }
}

checkBucket();
