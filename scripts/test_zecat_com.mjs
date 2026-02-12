import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ZECAT_API_BASE = 'https://api.zecat.com/v1';
const ZECAT_TOKEN = process.env.NEXT_PUBLIC_ZECAT_TOKEN || '';

async function testZecat() {
    const productId = 6;
    try {
        console.log(`Fetching details for ID: ${productId} from .com API`);
        const detailRes = await fetch(`${ZECAT_API_BASE}/generic_product/${productId}`, {
            headers: {
                'Authorization': `Bearer ${ZECAT_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });
        if (detailRes.ok) {
            const detailData = await detailRes.json();
            console.log('Detail Data:', JSON.stringify(detailData, null, 2));
        } else {
            console.error(`Detail Error: ${detailRes.status} ${detailRes.statusText}`);
            const text = await detailRes.text();
            console.log('Response text:', text);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testZecat();
