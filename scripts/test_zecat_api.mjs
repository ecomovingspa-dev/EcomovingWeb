import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ZECAT_API_BASE = 'https://api.zecat.cl/v1';
const ZECAT_TOKEN = process.env.NEXT_PUBLIC_ZECAT_TOKEN || '';

async function testZecat() {
    console.log('Using Token:', ZECAT_TOKEN.substring(0, 10) + '...');
    const productId = 6;
    try {
        const response = await fetch(`${ZECAT_API_BASE}/generic_product/${productId}`, {
            headers: {
                'Authorization': `Bearer ${ZECAT_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json();
        console.log('Product Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testZecat();
