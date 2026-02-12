import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ZECAT_API_BASE = 'https://api.zecat.cl/v1';
const ZECAT_TOKEN = process.env.NEXT_PUBLIC_ZECAT_TOKEN || '';

async function verifyDetail() {
    // We need a valid ID. I'll get it from the list.
    const listRes = await fetch(`${ZECAT_API_BASE}/generic_product?page=1&limit=1`, {
        headers: { 'Authorization': `Bearer ${ZECAT_TOKEN}` }
    });
    const listJson = await listRes.json();
    if (listJson.generic_products && listJson.generic_products.length > 0) {
        const id = listJson.generic_products[0].id;
        console.log(`Testing detail for ID: ${id}`);
        const res = await fetch(`${ZECAT_API_BASE}/generic_product/${id}`, {
            headers: { 'Authorization': `Bearer ${ZECAT_TOKEN}` }
        });
        const json = await res.json();
        console.log('Keys in detail response:', Object.keys(json));
        // Check if specifications are here
        if (json.subattributes) {
            console.log('Found subattributes:', json.subattributes.length);
            console.log('Sample subattribute:', JSON.stringify(json.subattributes[0], null, 2));
        }
    }
}
verifyDetail();
