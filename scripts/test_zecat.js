require('dotenv').config({ path: '.env.local' });

const ZECAT_TOKEN = process.env.NEXT_PUBLIC_ZECAT_TOKEN;
const ZECAT_API_BASE = 'https://api.zecat.cl/v1';

async function testZecat() {
    console.log('Testing connection to Zecat API (.cl)...');
    try {
        const response = await fetch(`${ZECAT_API_BASE}/family`, {
            headers: {
                'Authorization': `Bearer ${ZECAT_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Connection successful! Found families:', (data.families || data.data || []).length);
        } else {
            console.error('Zecat API returned error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response body:', text);
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testZecat();
