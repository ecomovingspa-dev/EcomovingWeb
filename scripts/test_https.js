
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/web_contenido`;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Fetching web_contenido via native https...');
const startTime = Date.now();

const options = {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
};

https.get(url, options, (res) => {
    let data = '';
    console.log(`Status: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        const endTime = Date.now();
        console.log(`Time: ${endTime - startTime}ms`);
        try {
            const parsed = JSON.parse(data);
            console.log(`Rows: ${parsed.length}`);
            console.log(`Data size: ${(data.length / 1024).toFixed(2)} KB`);
        } catch (e) {
            console.error('JSON Parse Error');
            console.log('Raw data snippet:', data.substring(0, 100));
        }
    });

}).on('error', (err) => {
    console.error('Error:', err.message);
});
