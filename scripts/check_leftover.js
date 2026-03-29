
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeftover() {
    console.log('Checking for leftover "CONTACTO PRINCIPAL" strings in "contactos"...');
    
    // ilike is case-insensitive.
    const { data: contacts, error } = await supabase
        .from('contactos')
        .select('nombre')
        .ilike('nombre', '%CONTACTO PRINCIPAL%');
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Found ${contacts.length} leftover strings.`);
        if (contacts.length > 0) {
            console.log('Examples:', contacts.slice(0, 5).map(c => c.nombre));
        }
    }
}

checkLeftover();
