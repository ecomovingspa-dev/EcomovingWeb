
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/web_contenido`;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkFetch() {
    console.log('Fetching web_contenido via axios...');
    const startTime = Date.now();
    try {
        const response = await axios.get(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        console.log(`Success! Status: ${response.status}, Rows: ${response.data.length}, Time: ${Date.now() - startTime}ms`);
        // Calculate size
        const size = JSON.stringify(response.data).length;
        console.log(`Data size: ${(size / 1024).toFixed(2)} KB`);
    } catch (err) {
        console.error('Error fetching:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
    }
}

checkFetch();
