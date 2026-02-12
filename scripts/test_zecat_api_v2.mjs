import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ZECAT_API_BASE = 'https://api.zecat.cl/v1';
const ZECAT_TOKEN = process.env.NEXT_PUBLIC_ZECAT_TOKEN || '';

async function testZecat() {
    try {
        console.log('Searching for products...');
        const response = await fetch(`${ZECAT_API_BASE}/generic_product/autocomplete?name=Mug`, {
            headers: {
                'Authorization': `Bearer ${ZECAT_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            console.error(`Search Error: ${response.status} ${response.statusText}`);
            return;
        }

        const data = await response.json();
        console.log('Search Results:', JSON.stringify(data, null, 2));

        if (data.data && data.data.length > 0) {
            const firstId = data.data[0].id;
            console.log(`Fetching details for ID: ${firstId}`);
            const detailRes = await fetch(`${ZECAT_API_BASE}/generic_product/${firstId}`, {
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
            }
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testZecat();
