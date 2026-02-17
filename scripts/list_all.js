
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listFiles() {
    try {
        const { data, error } = await supabase.storage.from('imágenes-marketing').list();
        if (error) {
            console.error('Error listing files in imágenes-marketing:', error);
        } else {
            console.log('Files in imágenes-marketing:', JSON.stringify(data, null, 2));
        }

        const { data: data2, error: error2 } = await supabase.storage.from('logotipo_ecomoving').list();
        if (error2) {
            console.error('Error listing files in logotipo_ecomoving:', error2);
        } else {
            console.log('Files in logotipo_ecomoving AGAIN:', JSON.stringify(data2, null, 2));
        }
    } catch (e) {
        console.error('Catch error:', e);
    }
}

listFiles();
