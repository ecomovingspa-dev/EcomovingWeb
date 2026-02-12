import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ZECAT_API_BASE = 'https://api.zecat.cl/v1';
const ZECAT_TOKEN = process.env.NEXT_PUBLIC_ZECAT_TOKEN || '';

async function findZecatProducts() {
    try {
        console.log('Searching for products...');
        const response = await fetch(`${ZECAT_API_BASE}/generic_product?page=1&limit=5`, {
            headers: {
                'Authorization': `Bearer ${ZECAT_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            console.error(`Search Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log('Response text:', text);
            return;
        }

        const data = await response.json();
        console.log('Found Products:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

findZecatProducts();
