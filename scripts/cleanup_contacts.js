
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgdmyjzyejjmwdqkufhp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZG15anp5ZWpqbXdkcWt1ZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTk0MTgsImV4cCI6MjA3OTM5NTQxOH0.WtEIZ324jxd5ymXJ6RwdXfqFc_qM6UAKJ-ONkbL2J4E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanContacts() {
    console.log('Identifying contacts with placeholder "Contacto Principal - "...');
    
    const { data: contacts, error: fetchErr } = await supabase
        .from('contactos')
        .select('id, nombre')
        .ilike('nombre', 'Contacto Principal - %');
    
    if (fetchErr) {
        console.error('Error fetching contacts:', fetchErr.message);
        return;
    }
    
    if (contacts.length === 0) {
        console.log('No contacts found with that pattern.');
        return;
    }
    
    console.log(`Found ${contacts.length} placeholder contacts. Proceeding to clear names...`);
    
    let updatedCount = 0;
    // Process in batches if necessary, but 10-100 is fine. 
    // ilike might return more, let's process all.
    for (const contact of contacts) {
        const { error: updateErr } = await supabase
            .from('contactos')
            .update({ nombre: '' })
            .eq('id', contact.id);
        
        if (updateErr) {
            console.error(`Error updating contact ${contact.id}:`, updateErr.message);
        } else {
            updatedCount++;
        }
    }
    
    console.log(`Successfully cleared ${updatedCount} contact names.`);
}

cleanContacts();
