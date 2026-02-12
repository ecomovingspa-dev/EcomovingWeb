import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ZECAT_API_BASE = 'https://api.zecat.cl/v1';
const ZECAT_TOKEN = process.env.NEXT_PUBLIC_ZECAT_TOKEN || '';

async function debug() {
    // Get a list first to find a valid ID
    const listRes = await fetch(`${ZECAT_API_BASE}/generic_product?page=1&limit=5`, {
        headers: { 'Authorization': `Bearer ${ZECAT_TOKEN}` }
    });
    const listData = await listRes.json();
    if (listData.data && listData.data.length > 0) {
        const firstId = listData.data[0].id;
        console.log(`Checking Product ID: ${firstId}`);
        const res = await fetch(`${ZECAT_API_BASE}/generic_product/${firstId}`, {
            headers: { 'Authorization': `Bearer ${ZECAT_TOKEN}` }
        });
        const fullProduct = await res.json();
        console.log('Full Product:', JSON.stringify(fullProduct, null, 2));
    } else {
        console.log('No products found in list');
    }
}
debug();
