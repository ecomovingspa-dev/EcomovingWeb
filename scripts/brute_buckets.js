
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBuckets() {
    const buckets = ['logotipo_ecomoving', 'logotipo-ecomoving', 'Logotipo_Ecomoving', 'logo_ecomoving', 'logo-ecomoving'];
    for (const b of buckets) {
        const { data, error } = await supabase.storage.from(b).list();
        if (error) {
            console.log(`Bucket ${b}: Error - ${error.message}`);
        } else {
            console.log(`Bucket ${b}: Found ${data.length} items. ${JSON.stringify(data)}`);
        }
    }
}

checkBuckets();
