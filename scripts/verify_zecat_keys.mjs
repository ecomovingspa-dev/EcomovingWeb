import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ZECAT_API_BASE = 'https://api.zecat.cl/v1';
const ZECAT_TOKEN = process.env.NEXT_PUBLIC_ZECAT_TOKEN || '';

async function verifyStructure() {
    const res = await fetch(`${ZECAT_API_BASE}/generic_product?page=1&limit=1`, {
        headers: { 'Authorization': `Bearer ${ZECAT_TOKEN}` }
    });
    const json = await res.json();
    console.log('Keys in response:', Object.keys(json));
    if (json.products) {
        console.log('Found "products" key with', json.products.length, 'items');
    }
    if (json.data) {
        console.log('Found "data" key with', json.data.length, 'items');
    }
}
verifyStructure();
